/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          esModuleInterop: true,
          skipLibCheck: true,
          strict: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  forceExit: true,
};
