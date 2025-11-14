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
  ...compat
    .config({
      extends: [
        'plugin:@nx/angular',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      rules: {},
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts'],
      ignores: ['**/*.spec.ts'],
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/angular-template'],
      rules: {},
    })
    .map((config) => ({
      ...config,
      files: ['**/*.html'],
    })),
];
