import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import baseConfig from '../../eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...baseConfig,
  {
    ignores: [
      '**/loader/**',
      '**/www/**',
      '**/dist/**',
      '**/components.d.ts',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  ...compat
    .config({
      extends: ['plugin:@nx/typescript'],
      rules: {},
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx'],
    })),
];
