/** @type {import('jest').Config} */
// Testes das Cloud Functions nos emuladores (Auth + Database + Functions):
//   npm run test:functions
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/functions/**/*.test.js"],
  testTimeout: 30000,
};
