/**
 * tests/finalizar-treino.test.js
 *
 * Testa a função finalizarTreino (treinos.js):
 * - Lê exerciciosConcluidos do estado LOCAL (_sessaoLocal), não do Firebase
 * - Escreve em historicoTreinos/${uid}/${data}, nunca em treinos/${uid}/${letra}
 * - Marca letrasCompletas/${letra} = true
 * - Avança treinoAtual para a próxima letra
 * - Nunca sobrescreve a definição do treino (treinos/)
 */

const ALUNO = "aluno-123";
const LETRA = "A";
const TODAY = "2026-05-28"; // getDateKey() está mockado neste valor

/** Rastreador de chamadas db.ref() por path */
function makePathTrackingDb() {
  const calls = {};

  const makeRef = (path) => {
    if (!calls[path]) {
      calls[path] = {
        once: jest
          .fn()
          .mockResolvedValue({ val: () => null, exists: () => false }),
        update: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      };
    }
    return calls[path];
  };

  return {
    db: { ref: jest.fn((path) => makeRef(path)) },
    calls, // acesso direto por path
  };
}

/** Injeta elementos de DOM mínimos que finalizarTreino usa via querySelectorAll */
function setupMinimalDOM() {
  document.body.innerHTML = `
    <div id="excard-ex1" class="exercise-check-card"></div>
    <div id="excard-ex2" class="exercise-check-card"></div>
    <div id="progress-fill"></div>
    <span id="progress-text"></span>
    <span id="progress-pct"></span>
  `;
}

beforeEach(() => {
  setupMinimalDOM();

  // Reseta alunoState para o cenário padrão (aluno com professor)
  global.alunoState = {
    uid: ALUNO,
    nome: "Aluno Teste",
    treinoAtual: LETRA,
    programaAtivo: null,
    professorId: "prof-999",
    treinoGerado: null,
  };

  // Reseta estado de sessão
  ["A", "B", "C"].forEach((l) => {
    const s = global._getSessaoLetra(l);
    s.exerciciosCompletos = {};
    s.seriesCompletas = {};
  });

  // Reseta mocks globais
  global.showLoading.mockClear();
  global.hideLoading.mockClear();
  global.mostrarCelebracao.mockClear();
  // proximaLetraComExercicios é definida em treinos.js; setup.js já sobrescreve
  // com jest.fn() depois do script. Aqui apenas resetamos e redefinimos o retorno.
  global.proximaLetraComExercicios = jest.fn().mockResolvedValue("B");
  global.confirm.mockReturnValue(true);
});

describe("finalizarTreino — lê estado LOCAL para exerciciosConcluidos", () => {
  test("usa o número de exercícios do _sessaoLocal, não do Firebase", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    // Simula treinos/aluno/A/exercicios retornando 2 exercícios no Firebase
    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {}, ex2: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    // Estado local: apenas 1 exercício concluído
    const sessao = global._getSessaoLetra(LETRA);
    sessao.exerciciosCompletos["ex1"] = true;
    // ex2 NÃO está em exerciciosCompletos

    await global.finalizarTreino(ALUNO);

    const hiPath = `historicoTreinos/${ALUNO}/${TODAY}`;
    const updateArg = tracker.calls[hiPath].update.mock.calls[0][0];
    expect(updateArg.exerciciosConcluidos).toBe(1); // 1 local, não 2 do Firebase
  });

  test("exerciciosConcluidos = 0 quando nenhum exercício foi feito na sessão", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {}, ex2: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    // Sem exercícios no estado local
    global.confirm.mockReturnValue(true); // confirma mesmo com 0%

    await global.finalizarTreino(ALUNO);

    const hiPath = `historicoTreinos/${ALUNO}/${TODAY}`;
    const updateArg = tracker.calls[hiPath].update.mock.calls[0][0];
    expect(updateArg.exerciciosConcluidos).toBe(0);
  });
});

describe("finalizarTreino — escreve no path correto", () => {
  test("escreve em historicoTreinos/{uid}/{data}, nunca em treinos/{uid}/{letra}", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    const sessao = global._getSessaoLetra(LETRA);
    sessao.exerciciosCompletos["ex1"] = true;

    await global.finalizarTreino(ALUNO);

    // DEVE ter escrito no histórico
    const hiPath = `historicoTreinos/${ALUNO}/${TODAY}`;
    expect(tracker.calls[hiPath].update).toHaveBeenCalled();

    // NUNCA deve ter chamado update/set em treinos/
    const treinoPath = `treinos/${ALUNO}/${LETRA}`;
    const tRef = tracker.calls[treinoPath];
    if (tRef) {
      expect(tRef.update).not.toHaveBeenCalled();
      expect(tRef.set).not.toHaveBeenCalled();
    }
    // Se o path nem apareceu nos calls, também está correto (não foi acessado)
  });

  test("marca letrasCompletas/{letra} = true no histórico", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    const sessao = global._getSessaoLetra(LETRA);
    sessao.exerciciosCompletos["ex1"] = true;

    await global.finalizarTreino(ALUNO);

    const letrasPath = `historicoTreinos/${ALUNO}/${TODAY}/letrasCompletas/${LETRA}`;
    expect(tracker.calls[letrasPath]).toBeDefined();
    expect(tracker.calls[letrasPath].set).toHaveBeenCalledWith(true);
  });
});

describe("finalizarTreino — avança treinoAtual", () => {
  test("avança alunoState.treinoAtual para a próxima letra retornada por proximaLetraComExercicios", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    global.proximaLetraComExercicios.mockResolvedValue("B");
    global.alunoState.treinoAtual = LETRA;

    const sessao = global._getSessaoLetra(LETRA);
    sessao.exerciciosCompletos["ex1"] = true;

    await global.finalizarTreino(ALUNO);

    expect(global.alunoState.treinoAtual).toBe("B");

    const alunoPath = `alunos/${ALUNO}/treinoAtual`;
    expect(tracker.calls[alunoPath]).toBeDefined();
    expect(tracker.calls[alunoPath].set).toHaveBeenCalledWith("B");
  });
});

describe("finalizarTreino — confirmação com % baixa", () => {
  test("aborta quando pct < 50 e usuário cancela confirm()", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    // 1 exercício cadastrado, 0 concluídos → 0%
    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    global.confirm.mockReturnValue(false); // usuário cancela

    await global.finalizarTreino(ALUNO);

    const hiPath = `historicoTreinos/${ALUNO}/${TODAY}`;
    // update não deve ter sido chamado (abortou)
    const hRef = tracker.calls[hiPath];
    if (hRef) {
      expect(hRef.update).not.toHaveBeenCalled();
    }
  });

  test("prossegue quando pct >= 50 sem exibir confirm()", async () => {
    const tracker = makePathTrackingDb();
    global.db = tracker.db;

    tracker.calls[`treinos/${ALUNO}/${LETRA}/exercicios`] = {
      once: jest.fn().mockResolvedValue({
        val: () => ({ ex1: {}, ex2: {} }),
        exists: () => true,
      }),
      update: jest.fn(),
      set: jest.fn(),
    };

    const sessao = global._getSessaoLetra(LETRA);
    sessao.exerciciosCompletos["ex1"] = true;
    sessao.exerciciosCompletos["ex2"] = true; // 100% → sem confirm

    global.confirm.mockClear();

    await global.finalizarTreino(ALUNO);

    expect(global.confirm).not.toHaveBeenCalled();

    const hiPath = `historicoTreinos/${ALUNO}/${TODAY}`;
    expect(tracker.calls[hiPath].update).toHaveBeenCalled();
  });
});
