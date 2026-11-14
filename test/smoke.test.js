import { describe, expect, it } from 'vitest'

// Proves the test runner is wired up. Real tests arrive with P0-T5.
describe('test setup', () => {
  it('runs in a browser-like environment', () => {
    expect(typeof document).toBe('object')
  })
})
