import { defineConfig } from 'vitest/config';

// Unit/integration gate (CLAUDE.md §3). Specs live in tests/ mirroring src/ (STRUCTURE.md §2).
//
// Environment is `node` because the template spine has no components yet. A product that
// renders React switches this to `jsdom`, adds `jsdom` + `@testing-library/react` as
// devDependencies, and points `setupFiles` at a vitest.setup.ts — see weaverbit-core.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
