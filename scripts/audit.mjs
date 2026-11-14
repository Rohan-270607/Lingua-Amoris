#!/usr/bin/env node
// Forced audit for the roadmap workflow.
//
// Runs in two ways:
//   1. From the Claude Code Stop hook. A failure exits with code 2, which stops the model
//      from finishing its turn and feeds the failure list back to it.
//   2. By hand:  node scripts/audit.mjs --check     (exit 1 on failure)
//                node scripts/audit.mjs --relock    (HUMANS ONLY: accept the current spec)
//
// It has no dependencies on purpose, so it works before the project is scaffolded.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROADMAP = join(ROOT, 'ROADMAP.md');
const AUDIT_DIR = join(ROOT, '.audit');
const LOCK = join(AUDIT_DIR, 'spec.lock');
const STATE = join(AUDIT_DIR, 'state.json');
const REPORT = join(AUDIT_DIR, 'last-report.md');

// How many times in a row the hook may refuse to let the model stop before it gives up
// and leaves the failure for a human. This prevents an endless, expensive loop.
const MAX_BLOCKS = 3;
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;

const args = process.argv.slice(2);
const RELOCK = args.includes('--relock');
const MANUAL = RELOCK || args.includes('--check') || Boolean(process.stdin.isTTY);

// Set when this script is started by its own Verify step (a task's Verify may call
// "audit --check"). A nested run does the structural checks only, so it cannot recurse.
const NESTED = process.env.AUDIT_NESTED === '1';

const TASK_RE = /^- \[([ ~x!])\] \*\*(P(\d+)-(T\d+|GATE))\*\*/;

// Files a model must not edit. Their hashes sit in the lock next to the spec hash, so a
// change to the rules, the hook, the auditor or this script shows up as an audit failure.
const PROTECTED = [
  'CLAUDE.md',
  '.claude/settings.json',
  '.claude/agents/auditor.md',
  'scripts/audit.mjs',
];

// ---------- helpers ----------

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function tail(text, lines = 25) {
  return String(text || '').trim().split(/\r?\n/).slice(-lines).join('\n');
}

function run(command) {
  // shell: true so that npm/npx resolve on Windows as well as macOS and Linux.
  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    encoding: 'utf8',
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, AUDIT_NESTED: '1' },
  });
  const timedOut = result.error && result.error.code === 'ETIMEDOUT';
  return {
    ok: result.status === 0 && !timedOut,
    output: `${result.stdout || ''}\n${result.stderr || ''}${timedOut ? '\n(timed out)' : ''}`,
  };
}

// The spec is everything except the parts a model is allowed to change: checkbox states,
// evidence text and the LIVING block. Normalising those away gives a hash that only moves
// when the spec itself is edited.
function normaliseSpec(text) {
  const out = [];
  let living = false;
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line.includes('<!-- LIVING:START -->')) { living = true; continue; }
    if (line.includes('<!-- LIVING:END -->')) { living = false; continue; }
    if (living) continue;
    if (TASK_RE.test(line)) { out.push(line.replace(/^- \[[ ~x!]\]/, '- [ ]')); continue; }
    if (/^\s+- Evidence:/.test(line)) { out.push(line.replace(/Evidence:.*$/, 'Evidence:')); continue; }
    out.push(line);
  }
  return out.join('\n').replace(/\n+$/, '\n');
}

// Hash a protected file with line endings normalised, so Windows and CI agree.
function fileHash(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return sha256(readFileSync(full, 'utf8').replace(/\r\n/g, '\n'));
}

// Lock format: one "name hash" pair per line. An old lock holding only the spec hash is
// still read, so a kit locked before this change keeps working until the next re-lock.
function readLock() {
  const lines = readFileSync(LOCK, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && !lines[0].includes(' ')) return { spec: lines[0], legacy: true };
  const lock = { legacy: false };
  for (const line of lines) {
    const [name, hash] = line.split(/\s+/);
    lock[name] = hash;
  }
  return lock;
}

function parseTasks(text) {
  const tasks = [];
  let current = null;
  let living = false;
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    if (raw.includes('<!-- LIVING:START -->')) living = true;
    if (living) continue;
    const m = raw.match(TASK_RE);
    if (m) {
      current = {
        state: m[1],
        id: m[2],
        phase: Number(m[3]),
        isGate: m[4] === 'GATE',
        verify: null,
        manual: false,
        evidence: '',
      };
      tasks.push(current);
      continue;
    }
    if (!current) continue;
    if (/^#{1,6} /.test(raw)) { current = null; continue; }
    const verify = raw.match(/^\s+- Verify:\s*(.*)$/);
    if (verify) {
      const body = verify[1].trim();
      const code = body.match(/`([^`]+)`/);
      if (/^manual\b/i.test(body)) current.manual = true;
      else if (code) current.verify = code[1];
      continue;
    }
    const evidence = raw.match(/^\s+- Evidence:\s*(.*)$/);
    if (evidence) current.evidence = evidence[1].trim();
  }
  return tasks;
}

function workingTreeFingerprint(roadmapText) {
  const head = run('git rev-parse HEAD');
  if (!head.ok) return null; // not a git repo yet: never skip
  const diff = run('git diff HEAD');
  const untracked = run('git ls-files --others --exclude-standard');
  return sha256([head.output, diff.output, untracked.output, roadmapText].join('\n--\n'));
}

// ---------- main ----------

if (!existsSync(AUDIT_DIR)) mkdirSync(AUDIT_DIR, { recursive: true });

if (!existsSync(ROADMAP)) {
  console.error('AUDIT: ROADMAP.md not found at the project root.');
  process.exit(MANUAL ? 1 : 2);
}

const roadmapText = readFileSync(ROADMAP, 'utf8');
const specHash = sha256(normaliseSpec(roadmapText));

if (RELOCK) {
  const lines = [`spec ${specHash}`];
  for (const rel of PROTECTED) {
    const hash = fileHash(rel);
    if (hash) lines.push(`${rel} ${hash}`);
  }
  writeFileSync(LOCK, `${lines.join('\n')}\n`);
  console.log(`Re-locked the spec and ${lines.length - 1} protected file(s).`);
  process.exit(0);
}

let hookInput = {};
if (!MANUAL) {
  try {
    hookInput = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    hookInput = {};
  }
}

const state = readJson(STATE, { failStreak: 0, verified: [], lastPass: null });
// A stop that is not a continuation of an earlier block starts a fresh streak.
if (!hookInput.stop_hook_active) state.failStreak = 0;

const fingerprint = workingTreeFingerprint(roadmapText);
if (!MANUAL && fingerprint && fingerprint === state.lastPass) {
  // Nothing changed since the last passing audit (for example a turn that only answered
  // a question), so there is nothing new to check.
  process.exit(0);
}

const failures = [];
const notes = [];
const tasks = parseTasks(roadmapText);
const byId = new Map(tasks.map((t) => [t.id, t]));

// 1. Spec lock
if (!existsSync(LOCK)) {
  failures.push('No .audit/spec.lock found. A human must run: node scripts/audit.mjs --relock');
} else {
  const lock = readLock();
  if (lock.spec !== specHash) {
    failures.push(
      'The spec part of ROADMAP.md was edited. Only checkboxes, Evidence text and the LIVING block may change. ' +
        'Revert the edit (git checkout -- ROADMAP.md, then redo your checkbox and evidence updates) and file a Change request instead.'
    );
  }
  if (lock.legacy) {
    notes.push('The lock is in the old format and covers ROADMAP.md only. A human re-lock will also protect the rules, the hook and this script.');
  } else {
    for (const rel of PROTECTED) {
      if (!lock[rel]) continue; // not present when the lock was made
      if (fileHash(rel) !== lock[rel]) {
        failures.push(`${rel} was changed or removed. It is a protected file. Restore it (git checkout -- ${rel}) and file a Change request instead.`);
      }
    }
  }
}

// 2. Roadmap consistency
if (tasks.length === 0) failures.push('No tasks could be parsed from ROADMAP.md.');

const inProgress = tasks.filter((t) => t.state === '~');
if (inProgress.length > 1) {
  failures.push(`Only one task may be in progress. Found: ${inProgress.map((t) => t.id).join(', ')}`);
}

for (const t of tasks) {
  if (t.state === 'x' && !t.evidence) {
    failures.push(`${t.id} is marked done but has no Evidence.`);
  }
  const started = t.state === 'x' || t.state === '~';
  if (started && t.phase > 0) {
    const prevGate = byId.get(`P${t.phase - 1}-GATE`);
    if (prevGate && prevGate.state !== 'x') {
      failures.push(`${t.id} was started before ${prevGate.id} passed. Finish and gate phase ${t.phase - 1} first.`);
    }
  }
  if (t.isGate && t.state === 'x') {
    const open = tasks.filter((o) => o.phase === t.phase && !o.isGate && o.state !== 'x');
    if (open.length) {
      failures.push(`${t.id} is marked done but these tasks are not: ${open.map((o) => o.id).join(', ')}`);
    }
    const reportPath = join(ROOT, 'audits', `phase-${t.phase}.md`);
    const report = existsSync(reportPath) ? readFileSync(reportPath, 'utf8') : '';
    if (!/VERDICT:\s*PASS/.test(report)) {
      failures.push(`${t.id} is marked done but audits/phase-${t.phase}.md is missing or does not say "VERDICT: PASS".`);
    }
  }
}

// 3. Project-wide checks, once the project has them
const pkg = NESTED ? null : readJson(join(ROOT, 'package.json'), null);
if (NESTED) {
  notes.push('Nested run: structural checks only.');
} else if (pkg && pkg.scripts) {
  for (const script of ['typecheck', 'lint', 'test']) {
    if (!pkg.scripts[script]) continue;
    const result = run(`npm run ${script} --silent`);
    if (result.ok) notes.push(`npm run ${script}: pass`);
    else failures.push(`npm run ${script} failed:\n${tail(result.output)}`);
  }
} else {
  notes.push('No package.json yet, so code checks were skipped.');
}

// 4. Verify commands of tasks completed since the last passing audit
const doneIds = new Set(tasks.filter((t) => t.state === 'x').map((t) => t.id));
const verified = new Set((state.verified || []).filter((id) => doneIds.has(id)));
for (const t of tasks) {
  if (NESTED || t.state !== 'x' || verified.has(t.id)) continue;
  if (t.verify) {
    const result = run(t.verify);
    if (result.ok) {
      verified.add(t.id);
      notes.push(`${t.id} verify passed: ${t.verify}`);
    } else {
      failures.push(`${t.id} is marked done but its Verify command failed (${t.verify}):\n${tail(result.output)}`);
    }
  } else if (t.manual) {
    if (t.evidence) verified.add(t.id); // manual checks rest on written evidence
  } else {
    failures.push(`${t.id} has no Verify line that the audit can read.`);
  }
}

// ---------- report and exit ----------

const passed = failures.length === 0;
const done = tasks.filter((t) => t.state === 'x').length;
const summary = `${done}/${tasks.length} tasks done`;
const report = [
  `# Audit report`,
  ``,
  `Result: ${passed ? 'PASS' : 'FAIL'} (${summary})`,
  `Time: ${new Date().toISOString()}`,
  ``,
  ...(passed ? [] : ['## Failures', '', ...failures.map((f, i) => `${i + 1}. ${f}`), '']),
  '## Notes',
  '',
  ...(notes.length ? notes.map((n) => `- ${n}`) : ['- none']),
  '',
].join('\n');
writeFileSync(REPORT, report);

state.verified = [...verified];

if (NESTED) {
  if (!passed) console.error(failures.join('\n'));
  process.exit(passed ? 0 : 1);
}

if (passed) {
  state.failStreak = 0;
  state.lastPass = fingerprint;
  writeFileSync(STATE, JSON.stringify(state, null, 2));
  if (MANUAL) console.log(`AUDIT PASS (${summary})`);
  process.exit(0);
}

state.failStreak += 1;
state.lastPass = null;
writeFileSync(STATE, JSON.stringify(state, null, 2));

const message = [
  `AUDIT FAILED (${failures.length} problem${failures.length === 1 ? '' : 's'}):`,
  ...failures.map((f, i) => `${i + 1}. ${f}`),
].join('\n');

if (MANUAL) {
  console.error(message);
  process.exit(1);
}

if (state.failStreak > MAX_BLOCKS) {
  // Give up blocking so the session can end, but leave a clear trail for the human.
  console.error(`${message}\n\nThe audit is still failing after ${MAX_BLOCKS} attempts. Stopping. See .audit/last-report.md.`);
  process.exit(0);
}

console.error(
  `${message}\n\nFix these before finishing. Do not edit the spec, weaken tests or change thresholds to make this pass. ` +
    `If something cannot be fixed, set the task to [!], add a Change request in ROADMAP.md, and un-tick anything not truly done.`
);
process.exit(2);
