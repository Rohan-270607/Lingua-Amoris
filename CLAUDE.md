# Lingua Amoris II: working rules

Lingua Amoris II: the same app, made safer, richer and worth sharing.
`ROADMAP.md` is the spec and the plan. Read it before doing anything.

## The loop (follow it every session)

1. Read `ROADMAP.md`: sections 0 to 2, the current phase, and the latest session note.
2. Pick the first task that is `[ ]` in the current phase. If a task is `[~]`, continue that one.
3. Mark it `[~]`. Work on that task only.
4. Write the tests the `Accept:` line calls for, then the code.
5. Run the task's `Verify:` command until it passes.
6. Mark the task `[x]` and fill in `Evidence:` with something checkable: the command you ran
   and its key output, a file path, or a commit hash.
7. Add a short session note at the top of the Session notes list.
8. Commit with the task id in the message, for example `P1-T2: extend the shared table`.
9. Stop. One task per turn unless told otherwise.

## Hard rules

- In `ROADMAP.md` you may change only: task checkboxes, text after `Evidence:`, and the
  block between `LIVING:START` and `LIVING:END`. The rest is locked by a hash.
- Never run `node scripts/audit.mjs --relock`. Never edit `.audit/spec.lock`, `CLAUDE.md`,
  `.claude/settings.json`, `.claude/agents/auditor.md` or `scripts/audit.mjs`. Never write
  files in `audits/`. Those belong to the human and the auditor, and the lock covers them.
- Never weaken, skip or delete a test to get a pass. Never change a threshold or a seed
  from the roadmap. Never hard-code a result.
- If the spec is wrong, unclear, or a threshold cannot be reached after an honest attempt:
  mark the task `[!]`, add a Change request explaining what you tried and what you
  measured, and stop.
- Do not start a phase until the previous phase's gate is `[x]`. Do not tick a gate
  yourself unless `audits/phase-N.md` says `VERDICT: PASS`.
- No new dependencies beyond the stack in section 2 without a Change request.
- Keep code simple and readable. Comment why, not what.

## Project rules

- No saved verse may ever be lost. Every storage change ships with a migration test and keeps a backup of the old data.
- Keep the existing Velvet & Gilt look, the swipe cover and the sealed letter. Improve, do not redesign.
- Never invent quotes, authors or translations. Test data uses short everyday phrases, not real quotations.
- This is an existing app. Read before you change, and do not move or rewrite files a task does not need.
- Supabase is the source of truth for verses. Tests never touch the live project: use a mocked client and fixtures.
- Database changes are additive only (new nullable columns, new policies). Never drop or rename a column, never delete or bulk-update rows. Write the SQL and stop: the human applies it.
- JavaScript and JSX only. The interface says "verse", the code and database say "quote". Do not rename either.
- Work on the `v2` branch. Do not push to `main` or deploy unless a task says so and the human agrees.

## The audit

A Stop hook runs `scripts/audit.mjs` every time you finish a turn. If it fails you will be
sent the failure list and must fix it before stopping. You can run it yourself at any time
with `node scripts/audit.mjs --check`.

## Commands

- `npm run lint`, `npm test` (which is `vitest run`), `npm run build`
- `node scripts/audit.mjs --check`
