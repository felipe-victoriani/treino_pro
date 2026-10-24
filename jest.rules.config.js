/** @type {import('jest').Config} */
// Testes das regras do Realtime Database. Precisam do emulador rodando:
//   npm run test:rules
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/rules/**/*.test.js"],
  testTimeout: 20000,
};
