export default {
  displayName: 'ui-components',
  preset: '@stencil/core/testing',
  setupFilesAfterEnv: [
    '<rootDir>/../../node_modules/@stencil/core/testing/jest-preset.js',
  ],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: '../../coverage/libs/ui-components',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/components.d.ts',
    '!src/index.ts',
  ],
};
