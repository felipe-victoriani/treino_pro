/**
 * tests/setup.js
 *
 * Roda ANTES de cada arquivo de teste (setupFiles).
 * 1. Define todos os globals que treinos.js espera encontrar no browser.
 * 2. Injeta treinos.js no DOM via <script> para que suas funções fiquem
 *    disponíveis em window/global (comportamento idêntico ao browser).
 */

const fs = require("fs");
const path = require("path");

/* ── Helpers de mock do Firebase ─────────────────────────── */

/** Cria um ref-mock rastreável por path */
function makeMockRef() {
  return {
    once: jest.fn().mockResolvedValue({ val: () => null, exists: () => false }),
    update: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue({ key: "mock-key" }),
  };
}

/* ── Globals esperados pelo código do browser ─────────────── */

global.db = { ref: jest.fn(() => makeMockRef()) };
global.auth = { signOut: jest.fn() };

global.sanitize = (v) => String(v ?? "");
global.getDateKey = () => "2026-05-28";

global.showToast = jest.fn();
global.showLoading = jest.fn();
global.hideLoading = jest.fn();

global.iniciarTimerDescanso = jest.fn();
global.mostrarCelebracao = jest.fn().mockResolvedValue(undefined);
global.proximaLetraPrograma = jest.fn(() => "B");
global.confirm = jest.fn(() => true);
/* atualizarProgressoTreino vive em js/pages/aluno.js no browser;
   nos testes (que só carregam treinos.js) mockamos como no-op. */
global.atualizarProgressoTreino = jest.fn();

global.alunoState = {
  uid: "aluno-123",
  nome: "Aluno Teste",
  treinoAtual: "A",
  programaAtivo: null,
  professorId: null,
  treinoGerado: null,
};

/* navigator.vibrate pode não existir no jsdom */
Object.defineProperty(global.navigator, "vibrate", {
  value: jest.fn(),
  configurable: true,
  writable: true,
});

/* ── Carrega treinos.js no contexto jsdom via <script> ────── */
// Com runScripts:'dangerously' no jest.config.js, o jsdom executa o
// conteúdo do script tag imediatamente ao ser inserido no DOM.
// Funções declaradas com `function` tornam-se propriedades de window (= global).

const treinosCode = fs.readFileSync(
  path.resolve(__dirname, "../js/features/treinos.js"),
  "utf8",
);
const scriptEl = document.createElement("script");
scriptEl.textContent = treinosCode;
document.head.appendChild(scriptEl);

// proximaLetraComExercicios é definida em treinos.js, então o mock
// precisa vir DEPOIS do carregamento do script para sobrescrever a implementação real.
global.proximaLetraComExercicios = jest.fn().mockResolvedValue("B");
