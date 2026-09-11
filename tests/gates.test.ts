/**
 * Guards the five gates against the one failure mode this template exists to prevent:
 * a gate that reports success while checking nothing (CLAUDE.md §3, STRUCTURE.md §2).
 *
 * A fresh template legitimately has no app, so `dev`/`build` are placeholders and the test
 * runners are told to pass with no specs. Those allowances are scoped to "there is no
 * product code yet": the moment `src/` contains a file, they become lies, and this test
 * turns red until they are replaced. That is the check a README paragraph cannot make.
 *
 * A product keeps this file — it costs nothing once the scripts are real.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>;
};

const GATES = ['typecheck', 'lint', 'test', 'e2e', 'build'] as const;

/** Recursively: does src/ hold any file at all? An empty or absent dir means "no product yet". */
function hasSourceFiles(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.isDirectory() ? hasSourceFiles(join(dir, entry.name)) : true,
  );
}

const productHasCode = hasSourceFiles(new URL('../src', import.meta.url).pathname);

describe('the five gates are defined', () => {
  for (const gate of GATES) {
    it(`package.json defines "${gate}"`, () => {
      expect(pkg.scripts?.[gate], `missing script: ${gate}`).toBeTruthy();
    });
  }
});

describe('the five gates still check something', () => {
  // `it.skipIf` rather than a bare early return: a skipped test is visible in the run,
  // a silently-passing one is exactly the problem being guarded against.
  it.skipIf(!productHasCode)('dev and build are no longer placeholders', () => {
    for (const script of ['dev', 'build'] as const) {
      expect(
        pkg.scripts[script],
        `src/ has code, so "${script}" must be the product's real command, not the template placeholder`,
      ).not.toContain('no app yet');
    }
  });

  it.skipIf(!productHasCode)('the test runners no longer pass with zero specs', () => {
    expect(
      pkg.scripts.test,
      'src/ has code, so the unit gate must fail on an empty suite: drop --passWithNoTests',
    ).not.toContain('passWithNoTests');
    expect(
      pkg.scripts.e2e,
      'src/ has code, so the e2e gate must fail on an empty suite: drop --pass-with-no-tests',
    ).not.toContain('pass-with-no-tests');
  });
});
