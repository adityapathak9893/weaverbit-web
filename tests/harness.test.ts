/**
 * Guards the harness invariants whose breakage is INVISIBLE at runtime.
 *
 * Every defect asserted here shipped in a Weaverbit repo and went unnoticed, because each
 * one fails non-blocking: a hook that exits 126 (lost exec bit), or 1 (unbound variable), or
 * 0 (dependency missing) is either swallowed or read as "all gates green". There is no red
 * output to notice — the gate simply stops existing. A test is the only thing that can see
 * the difference between "enforced" and "silently absent".
 *
 * The fail-closed specs below RUN the hooks rather than grepping them: the property is
 * "which exit code comes back under a broken toolchain", and no string search can see that.
 *
 * See CLAUDE.md §9, and the exit-code contract in each hook script's own header.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// vitest runs from the repo root, so cwd resolves the fixtures this file reads.
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

const HOOKS = ['.claude/hooks/post-edit-verify.sh', '.claude/hooks/stop-gate.sh'] as const;

interface HookCommand {
  type: string;
  command: string;
}
interface HookMatcher {
  matcher?: string;
  hooks: HookCommand[];
}

const rawSettings: unknown = JSON.parse(read('.claude/settings.json'));

/**
 * Validated before use rather than cast: "the hooks block is gone" is one of the very
 * failures this file exists to report, and an unchecked cast turns it into a TypeError
 * during collection — a stack trace instead of a named assertion.
 */
function hookConfig(value: unknown): Record<string, HookMatcher[]> {
  const hooks = (value as { hooks?: unknown } | null)?.hooks;
  if (typeof hooks !== 'object' || hooks === null) {
    throw new Error('.claude/settings.json has no "hooks" block — every gate is unwired.');
  }
  return hooks as Record<string, HookMatcher[]>;
}

describe('settings.json wiring points at real scripts', () => {
  it('has a hooks block at all', () => {
    expect(() => hookConfig(rawSettings)).not.toThrow();
  });

  const hooks = hookConfig(rawSettings);
  const hookCommands = Object.values(hooks)
    .flat()
    .flatMap((entry) => entry.hooks)
    .map((hook) => hook.command);

  it('still registers both lifecycle events', () => {
    // arrayContaining, not toEqual: a product legitimately adding SessionStart must not
    // turn this red. What must never happen is one of these two going missing.
    expect(Object.keys(hooks)).toEqual(expect.arrayContaining(['PostToolUse', 'Stop']));
  });

  for (const command of hookCommands) {
    // The path inside the quotes, with the ${CLAUDE_PROJECT_DIR:-.} prefix stripped.
    const scriptPath = command.match(/\$\{CLAUDE_PROJECT_DIR:-\.\}\/([^"]+)/)?.[1];

    it(`resolves the script in: ${command}`, () => {
      if (!scriptPath) throw new Error(`no \${CLAUDE_PROJECT_DIR:-.}-relative path in: ${command}`);
      expect(existsSync(resolve(root, scriptPath))).toBe(true);
    });

    it(`invokes through bash, with a default for an unset project dir: ${command}`, () => {
      // `bash "..."` ignores the exec bit outright; `:-.` keeps `set -u` from aborting the
      // script with exit 1 before it can resolve its own location.
      expect(command.startsWith('bash "')).toBe(true);
      expect(command).toContain('${CLAUDE_PROJECT_DIR:-.}');
    });
  }
});

describe('hook scripts are committed executable', () => {
  // The exec bit must be in the INDEX, not just on disk: git is what a fresh clone and CI
  // get. Committed 100644, the hook is invoked and dies with exit 126 — non-blocking, so
  // the failure never reaches the agent. Restore with:
  //   git update-index --chmod=+x .claude/hooks/*.sh
  let entries: { mode: string; path: string }[] = [];
  let gitError = '';
  try {
    entries = execFileSync('git', ['ls-files', '-s', '.claude/hooks/'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        // `git ls-files -s` is "<mode> <sha> <stage>\t<path>"; the tab is guaranteed, so
        // splitting on it keeps a path containing spaces intact.
        const [meta = '', path = ''] = line.split('\t');
        return { mode: meta.split(' ')[0] ?? '', path };
      })
      .filter((entry) => entry.path.endsWith('.sh'));
  } catch (error) {
    // The template is copied into new repos and may be read before `git init`. That is a
    // skip, not a failure — but a named one, so it can never be mistaken for a pass.
    gitError = error instanceof Error ? error.message : String(error);
  }

  it.skipIf(gitError !== '')('finds the hook scripts in the index', () => {
    expect(entries.length, `git reported no hook scripts (${gitError})`).toBeGreaterThan(0);
  });

  for (const entry of entries) {
    it(`${entry.path} is mode 100755 in git`, () => {
      expect(entry.mode, `${entry.path} is committed non-executable`).toBe('100755');
    });
  }
});

describe('hook scripts fail closed', () => {
  const sandboxes: string[] = [];
  afterAll(() => sandboxes.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

  /** A throwaway project root, optionally holding the given package.json text. */
  function sandbox(manifest?: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'wb-hook-'));
    sandboxes.push(dir);
    if (manifest !== undefined) writeFileSync(join(dir, 'package.json'), manifest);
    return dir;
  }

  // Every PATH entry that does NOT contain a node binary. Version managers (fnm, nvm) put
  // several shim dirs on PATH, so dropping only the first still leaves node resolvable.
  const pathWithoutNode = (process.env.PATH ?? '')
    .split(':')
    .filter((dir) => dir && !existsSync(join(dir, 'node')))
    .join(':');

  /** Runs a hook for real and returns its exit status — the only thing Claude Code reads. */
  function run(script: string, cwd: string, opts: { input?: string; path?: string } = {}) {
    const result = spawnSync('bash', [resolve(root, script)], {
      cwd,
      input: opts.input ?? '{}',
      encoding: 'utf8',
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: cwd,
        ...(opts.path === undefined ? {} : { PATH: opts.path }),
      },
    });
    return { status: result.status, stderr: result.stderr ?? '' };
  }

  it('a stripped PATH really does hide node', () => {
    // Guards the guard: if node stayed resolvable, every "node missing" case below would
    // be testing the healthy path and passing for the wrong reason.
    expect(
      spawnSync('node', ['-v'], { env: { ...process.env, PATH: pathWithoutNode } }).error,
    ).toBeDefined();
  });

  for (const script of HOOKS) {
    it(`${script} blocks with exit 2 when package.json will not parse`, () => {
      const { status, stderr } = run(script, sandbox('{"name": BROKEN,,,'));
      expect(status, 'an unreadable manifest must not read as "no gates defined"').toBe(2);
      expect(stderr).toMatch(/gates NOT run/);
    });

    it(`${script} blocks with exit 2 when node is missing`, () => {
      const manifest = '{"name":"sb","scripts":{"typecheck":"true","lint":"true"}}';
      const { status, stderr } = run(script, sandbox(manifest), { path: pathWithoutNode });
      expect(status, 'no node means the gates did not run — that is not success').toBe(2);
      expect(stderr).toMatch(/node not found/);
    });

    it(`${script} exits 0 when package.json is absent`, () => {
      // The deliberate carve-out: early scaffolding is not an error. Only an unreadable
      // manifest is. Without this the hooks would block a repo that has no project yet.
      expect(run(script, sandbox()).status).toBe(0);
    });

    it(`${script} exits 0 for a valid manifest that defines no gates`, () => {
      expect(run(script, sandbox('{"name":"sb"}')).status).toBe(0);
    });
  }

  it('stop-gate.sh lets a hook-triggered continuation through even with no node', () => {
    // Regression test for a real bug in this backport: the stop_hook_active guard parsed
    // stdin with node, so when node was the missing dependency the guard could never fire
    // and the new fail-closed exit 2 re-triggered the Stop hook forever. Fail closed must
    // not mean "wedged with no way out".
    const manifest = '{"name":"sb","scripts":{"test":"true"}}';
    const { status } = run('.claude/hooks/stop-gate.sh', sandbox(manifest), {
      input: '{"stop_hook_active":true}',
      path: pathWithoutNode,
    });
    expect(status, 'a continuation must exit 0 or the Stop hook loops forever').toBe(0);
  });

  it('stop-gate.sh runs every gate when the toolchain is healthy', () => {
    // The positive control. Without it, "fail closed" could be satisfied by a script that
    // blocks unconditionally and never checks anything.
    const dir = sandbox(
      JSON.stringify({
        name: 'sb',
        scripts: Object.fromEntries(
          ['typecheck', 'lint', 'test', 'e2e', 'build'].map((g) => [g, `echo ${g} >> ran.log`]),
        ),
      }),
    );
    const { status } = run('.claude/hooks/stop-gate.sh', dir);
    expect(status).toBe(0);
    expect(readFileSync(join(dir, 'ran.log'), 'utf8').trim().split('\n')).toEqual([
      'typecheck',
      'lint',
      'test',
      'e2e',
      'build',
    ]);
  }, 60_000);
});

describe('hook scripts only block with exit 2', () => {
  for (const script of HOOKS) {
    it(`${script} uses no literal exit other than 0 or 2`, () => {
      // Any other non-zero status is non-blocking and never reaches the agent, so a
      // "failure" exit that isn't 2 is indistinguishable from success. Whole-line matching,
      // so an indirect `exit $?` — whose status this test cannot predict — is caught too
      // rather than slipping past a digits-only pattern.
      const lines = [...read(script).matchAll(/^[ \t]*exit\b.*$/gm)].map((m) => m[0].trim());
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.filter((line) => line !== 'exit 0' && line !== 'exit 2')).toEqual([]);
    });
  }
});
