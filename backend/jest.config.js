/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Transpile-only: some legacy service files have pre-existing type
        // errors; type-checking them would break unrelated test suites.
        isolatedModules: true,
        // backend/node_modules pins typescript@7 (native rewrite, no classic
        // ts.sys API); ts-jest needs the hoisted TypeScript 5.x compiler.
        compiler: require('path').join(__dirname, '..', 'node_modules', 'typescript'),
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  testTimeout: 30000,
};
