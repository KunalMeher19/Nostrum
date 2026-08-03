module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup.js'],
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  clearMocks: true,
  // `jose` is ESM-only; Jest runs CommonJS. Tests use a tiny mock that
  // accepts deterministic "test.<payload>" tokens (test/mocks/jose.js).
  moduleNameMapper: {
    '^jose$': '<rootDir>/test/mocks/jose.js',
  },
  testTimeout: 15000,
};
