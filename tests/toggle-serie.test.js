/**
 * tests/toggle-serie.test.js
 *
 * Testa a função toggleSerie (treinos.js):
 * - Atualiza estado local (_sessaoLocal) corretamente
 * - NUNCA chama db.ref()
 * - Marca exercício completo quando todas as séries estão feitas
 * - Remove de completo quando série é desmarcada
 * - Inicia timer ao marcar, não ao desmarcar
 * - Estado de letra A é isolado de letra B
 */

const LETRA = "A";
const EX_ID = "ex-test-1";
const ALUNO = "aluno-123";
const DESCANS = 60; // segundos

/** Cria no DOM os elementos que toggleSerie manipula */
function setupDOM(exId, numSeries) {
  document.body.innerHTML = "";

  // Barra de progresso
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="progress-fill"></div>
    <span id="progress-text"></span>
    <span id="progress-pct"></span>
  `,
  );

  // Card do exercício
  const card = document.createElement("div");
  card.id = `excard-${exId}`;
  card.className = "exercise-check-card";
  document.body.appendChild(card);

  // Pílulas das séries
  for (let i = 0; i < numSeries; i++) {
    const pill = document.createElement("button");
    pill.id = `spill-${exId}-${i}`;
    pill.className = "serie-pill";
    document.body.appendChild(pill);
  }
}

beforeEach(() => {
  // Reseta estado de sessão para as letras usadas nos testes
  ["A", "B"].forEach((l) => {
    const s = global._getSessaoLetra(l);
    s.exerciciosCompletos = {};
    s.seriesCompletas = {};
  });

  // Reseta mocks
  global.db.ref.mockClear();
  global.iniciarTimerDescanso.mockClear();
  global.db.ref.mockImplementation(() => ({
    once: jest.fn().mockResolvedValue({ val: () => null, exists: () => false }),
    update: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  }));
});

describe("toggleSerie — atualização de estado local", () => {
  const TOTAL = 3;

  test("marca série no estado local ao chamar pela 1ª vez", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    const s = global._getSessaoLetra(LETRA);
    expect(s.seriesCompletas[EX_ID]).toEqual({ s0: true });
  });

  test("desmarca série ao chamar novamente (toggle)", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    const s = global._getSessaoLetra(LETRA);
    expect(s.seriesCompletas[EX_ID]).not.toHaveProperty("s0");
  });

  test("NÃO chama db.ref() ao marcar série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    expect(global.db.ref).not.toHaveBeenCalled();
  });

  test("NÃO chama db.ref() ao desmarcar série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.db.ref.mockClear();
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    expect(global.db.ref).not.toHaveBeenCalled();
  });
});

describe("toggleSerie — conclusão de exercício", () => {
  const TOTAL = 2;

  test("marca exercício como completo quando TODAS as séries são feitas", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0);

    const s = global._getSessaoLetra(LETRA);
    expect(s.exerciciosCompletos[EX_ID]).toBe(true);
  });

  test("NÃO marca como completo se ainda falta série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0); // só 1 de 2

    const s = global._getSessaoLetra(LETRA);
    expect(s.exerciciosCompletos).not.toHaveProperty(EX_ID);
  });

  test("remove exercício de completo ao desmarcar uma série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0); // completo!
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0); // desmarca

    const s = global._getSessaoLetra(LETRA);
    expect(s.exerciciosCompletos).not.toHaveProperty(EX_ID);
  });
});

describe("toggleSerie — timer de descanso", () => {
  const TOTAL = 3;

  test("inicia timer ao MARCAR série com descanso > 0", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, DESCANS);

    expect(global.iniciarTimerDescanso).toHaveBeenCalledWith(DESCANS);
  });

  test("NÃO inicia timer ao DESMARCAR série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, DESCANS);
    global.iniciarTimerDescanso.mockClear();
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, DESCANS); // desmarca

    expect(global.iniciarTimerDescanso).not.toHaveBeenCalled();
  });

  test("NÃO inicia timer quando descanso === 0", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    expect(global.iniciarTimerDescanso).not.toHaveBeenCalled();
  });
});

describe("toggleSerie — isolamento entre letras", () => {
  test("marcar série na letra A não afeta letra B", () => {
    setupDOM(EX_ID, 3);
    global.toggleSerie(EX_ID, ALUNO, "A", 0, 3, 0);
    global.toggleSerie(EX_ID, ALUNO, "A", 1, 3, 0);

    const sB = global._getSessaoLetra("B");
    expect(sB.seriesCompletas).not.toHaveProperty(EX_ID);
    expect(sB.exerciciosCompletos).not.toHaveProperty(EX_ID);
  });
});

describe("toggleSerie — atualização de DOM", () => {
  const TOTAL = 2;

  test("adiciona classe serie-done na pílula ao marcar", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);

    const pill = document.getElementById(`spill-${EX_ID}-0`);
    expect(pill.classList.contains("serie-done")).toBe(true);
  });

  test("remove classe serie-done da pílula ao desmarcar", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0); // desmarca

    const pill = document.getElementById(`spill-${EX_ID}-0`);
    expect(pill.classList.contains("serie-done")).toBe(false);
  });

  test("adiciona classe completed no card quando exercício concluído", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0); // completo

    const card = document.getElementById(`excard-${EX_ID}`);
    expect(card.classList.contains("completed")).toBe(true);
  });

  test("remove classe completed do card ao desmarcar série", () => {
    setupDOM(EX_ID, TOTAL);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 0, TOTAL, 0);
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0); // completo
    global.toggleSerie(EX_ID, ALUNO, LETRA, 1, TOTAL, 0); // desmarca

    const card = document.getElementById(`excard-${EX_ID}`);
    expect(card.classList.contains("completed")).toBe(false);
  });
});
