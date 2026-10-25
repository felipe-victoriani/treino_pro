/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    // Permite que script tags injetados no DOM executem de verdade,
    // necessário para carregar os arquivos JS do browser no jsdom.
    runScripts: "dangerously",
    url: "http://localhost/",
  },
  // Roda antes de cada arquivo de teste (no contexto jsdom)
  setupFiles: ["./tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  // Testes de regras rodam em config própria, com emulador (npm run test:rules)
  testPathIgnorePatterns: ["/node_modules/", "/tests/rules/", "/tests/functions/"],
};
