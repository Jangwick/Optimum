import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['generated/**', 'node_modules/**', 'coverage/**', 'dist/**'],
  },
  {
    files: ['**/*.{js,ts,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error'] }],
    },
  },
  {
    files: ['prisma.config.*', 'prisma/seed.*', 'scripts/*.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
] satisfies Linter.Config[];
