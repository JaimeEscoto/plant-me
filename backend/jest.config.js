module.exports = {
  testEnvironment: 'node',
  rootDir: __dirname,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['src/**/*.js'],
};
