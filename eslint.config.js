// Flat ESLint config (ESLint 9). The `lint` gate runs with --max-warnings 0,
// so every rule below is effectively an error: nothing yellow is allowed to land.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Generated output, deps, and tool reports are never linted.
  {
    ignores: [
      'dist/**',
      'build/**',
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  // a11y is a floor, not a nicety (BRAND.md / docs/DESIGN_GUIDE.md): JSX rules are on
  // from day one so the first component written in a product is already accessible.
  jsxA11y.flatConfigs.recommended,

  // Product source (components run in the browser).
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Allow intentionally-unused args/vars only when prefixed with _.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Build/tooling scripts and configs run in Node.
  {
    files: ['scripts/**', '**/*.mjs', '*.config.{ts,js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
