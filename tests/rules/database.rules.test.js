/**
 * tests/rules/database.rules.test.js
 *
 * Testa database.rules.json no emulador do Realtime Database.
 * Rodar com: npm run test:rules
 *
 * Cenário base:
 *   admin  → tipo admin
 *   prof1  → professor de aluno1
 *   prof2  → professor de aluno2
 *   aluno1, aluno2 → alunos
 */

const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  ref,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  equalTo,
} = require("firebase/database");
const { setLogLevel } = require("firebase/app");

// Esconde os "permission_denied" esperados nos assertFails
setLogLevel("error");

let testEnv;

/* ── Helpers ──────────────────────────────────────────────── */

/** DB autenticado como o uid informado */
const dbDe = (uid) => testEnv.authenticatedContext(uid).database();
/** DB sem login */
const dbAnonimo = () => testEnv.unauthenticatedContext().database();

/** Mensagem válida enviada por `uid` com papel `tipo` */
const msg = (uid, tipo, extra = {}) => ({
  texto: "Olá",
  de: tipo,
  deUid: uid,
  deNome: "Teste",
  timestamp: Date.now(),
  lida: false,
  ...extra,
});

/* ── Setup ────────────────────────────────────────────────── */

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-treino",
    database: {
      rules: fs.readFileSync(
        path.join(__dirname, "../../database.rules.json"),
        "utf8",
      ),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  // Semeia o banco ignorando as regras
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await set(ref(ctx.database()), {
      users: {
        admin: { tipo: "admin", nome: "Admin" },
        prof1: { tipo: "professor", nome: "Prof Um" },
        prof2: { tipo: "professor", nome: "Prof Dois" },
        aluno1: { tipo: "aluno", nome: "Aluno Um", professorId: "prof1" },
        aluno2: { tipo: "aluno", nome: "Aluno Dois", professorId: "prof2" },
      },
      alunos: {
        aluno1: { tipo: "aluno", nome: "Aluno Um", professorId: "prof1" },
        aluno2: { tipo: "aluno", nome: "Aluno Dois", professorId: "prof2" },
      },
      professores: {
        prof1: { nome: "Prof Um", email: "p1@x.com", telefone: "9999" },
        prof2: { nome: "Prof Dois", email: "p2@x.com", telefone: "8888" },
      },
      professoresPublico: {
        prof1: { nome: "Prof Um" },
        prof2: { nome: "Prof Dois" },
      },
      treinos: { aluno1: { A: { foco: "peito" } } },
      dietas: { aluno1: { titulo: "Cutting" } },
      mensagens: { aluno1: { m1: msg("prof1", "professor") } },
      config: { adminUid: "admin" },
    });
  });
});

/* ── users: escalada de privilégio ────────────────────────── */

describe("users / tipo", () => {
  test("aluno NÃO consegue virar admin", async () => {
    await assertFails(set(ref(dbDe("aluno1"), "users/aluno1/tipo"), "admin"));
  });

  test("aluno NÃO consegue virar admin via update do nó", async () => {
    await assertFails(
      update(ref(dbDe("aluno1"), "users/aluno1"), { tipo: "admin" }),
    );
  });

  test("professor NÃO consegue virar admin", async () => {
    await assertFails(set(ref(dbDe("prof1"), "users/prof1/tipo"), "admin"));
  });

  test("aluno NÃO consegue apagar o próprio nó (e recriar como admin)", async () => {
    await assertFails(set(ref(dbDe("aluno1"), "users/aluno1"), null));
  });

  test("aluno NÃO consegue remover só o campo tipo", async () => {
    await assertFails(set(ref(dbDe("aluno1"), "users/aluno1/tipo"), null));
  });

  test("novo usuário cria o próprio nó como aluno", async () => {
    await assertSucceeds(
      set(ref(dbDe("novo"), "users/novo"), { tipo: "aluno", nome: "Novo" }),
    );
  });

  test("novo usuário NÃO se cria como professor ou admin", async () => {
    await assertFails(
      set(ref(dbDe("novo"), "users/novo"), { tipo: "professor", nome: "X" }),
    );
    await assertFails(
      set(ref(dbDe("novo"), "users/novo"), { tipo: "admin", nome: "X" }),
    );
  });

  test("aluno atualiza campos comuns (fcmToken, imc)", async () => {
    await assertSucceeds(
      update(ref(dbDe("aluno1"), "users/aluno1"), { fcmToken: "t", imc: 22 }),
    );
  });

  test("admin cria professor", async () => {
    await assertSucceeds(
      set(ref(dbDe("admin"), "users/prof3"), {
        tipo: "professor",
        nome: "Prof 3",
      }),
    );
  });

  test("professor lê users do próprio aluno, não de aluno alheio", async () => {
    await assertSucceeds(get(ref(dbDe("prof1"), "users/aluno1")));
    await assertFails(get(ref(dbDe("prof1"), "users/aluno2")));
  });

  test("aluno NÃO lê users de outro aluno", async () => {
    await assertFails(get(ref(dbDe("aluno1"), "users/aluno2")));
  });
});

/* ── alunos ───────────────────────────────────────────────── */

describe("alunos", () => {
  test("professor lê o próprio aluno, não o de outro professor", async () => {
    await assertSucceeds(get(ref(dbDe("prof1"), "alunos/aluno1")));
    await assertFails(get(ref(dbDe("prof1"), "alunos/aluno2")));
  });

  test("professor lista alunos só via query por professorId = ele", async () => {
    const db = dbDe("prof1");
    await assertSucceeds(
      get(
        query(ref(db, "alunos"), orderByChild("professorId"), equalTo("prof1")),
      ),
    );
    await assertFails(
      get(
        query(ref(db, "alunos"), orderByChild("professorId"), equalTo("prof2")),
      ),
    );
    await assertFails(get(ref(db, "alunos")));
  });

  test("aluno e anônimo NÃO listam alunos", async () => {
    await assertFails(get(ref(dbDe("aluno1"), "alunos")));
    await assertFails(get(ref(dbAnonimo(), "alunos")));
  });

  test("admin lista todos os alunos", async () => {
    await assertSucceeds(get(ref(dbDe("admin"), "alunos")));
  });

  test("professorId só aceita uid de professor", async () => {
    await assertFails(
      set(ref(dbDe("aluno1"), "alunos/aluno1/professorId"), "aluno2"),
    );
    await assertSucceeds(
      set(ref(dbDe("aluno1"), "alunos/aluno1/professorId"), "prof2"),
    );
  });

  test("professor edita o próprio aluno, não o alheio", async () => {
    await assertSucceeds(
      set(ref(dbDe("prof1"), "alunos/aluno1/treinoAtual"), "B"),
    );
    await assertFails(
      set(ref(dbDe("prof1"), "alunos/aluno2/treinoAtual"), "B"),
    );
  });
});

/* ── dados do aluno (treinos, histórico, dietas) ──────────── */

describe("treinos / histórico / dietas", () => {
  test("treinos: aluno e professor dele leem e gravam; outros não", async () => {
    await assertSucceeds(get(ref(dbDe("aluno1"), "treinos/aluno1")));
    await assertSucceeds(
      set(ref(dbDe("prof1"), "treinos/aluno1/B/foco"), "costas"),
    );
    await assertFails(get(ref(dbDe("prof2"), "treinos/aluno1")));
    await assertFails(
      set(ref(dbDe("prof2"), "treinos/aluno1/B/foco"), "costas"),
    );
    await assertFails(get(ref(dbDe("aluno2"), "treinos/aluno1")));
  });

  test("historicoIMC: professor alheio NÃO lê", async () => {
    await assertFails(get(ref(dbDe("prof2"), "historicoIMC/aluno1")));
    await assertSucceeds(get(ref(dbDe("prof1"), "historicoIMC/aluno1")));
  });

  test("dietas: aluno lê mas não grava; professor dele grava", async () => {
    await assertSucceeds(get(ref(dbDe("aluno1"), "dietas/aluno1")));
    await assertFails(set(ref(dbDe("aluno1"), "dietas/aluno1/titulo"), "X"));
    await assertSucceeds(set(ref(dbDe("prof1"), "dietas/aluno1/titulo"), "X"));
    await assertFails(set(ref(dbDe("prof2"), "dietas/aluno1/titulo"), "X"));
  });
});

/* ── mensagens ────────────────────────────────────────────── */

describe("mensagens", () => {
  test("aluno envia para o próprio professor", async () => {
    await assertSucceeds(
      push(
        ref(dbDe("aluno1"), "mensagens/aluno1"),
        msg("aluno1", "aluno", { paraUid: "prof1" }),
      ),
    );
  });

  test("aluno envia para o admin (suporte)", async () => {
    await assertSucceeds(
      push(
        ref(dbDe("aluno1"), "mensagens/aluno1"),
        msg("aluno1", "aluno", { paraUid: "admin" }),
      ),
    );
  });

  test("terceiro NÃO escreve na conversa de outro aluno", async () => {
    await assertFails(
      push(ref(dbDe("aluno2"), "mensagens/aluno1"), msg("aluno2", "aluno")),
    );
    await assertFails(
      push(ref(dbDe("prof2"), "mensagens/aluno1"), msg("prof2", "professor")),
    );
  });

  test("NÃO forja remetente (deUid ou de)", async () => {
    const db = dbDe("aluno1");
    await assertFails(
      push(ref(db, "mensagens/aluno1"), msg("prof1", "professor")),
    );
    await assertFails(
      push(ref(db, "mensagens/aluno1"), msg("aluno1", "professor")),
    );
  });

  test("NÃO dispara push para uid arbitrário (paraUid)", async () => {
    await assertFails(
      push(
        ref(dbDe("aluno1"), "mensagens/aluno1"),
        msg("aluno1", "aluno", { paraUid: "aluno2" }),
      ),
    );
  });

  test("texto vazio, longo ou campo extra é rejeitado", async () => {
    const db = dbDe("aluno1");
    await assertFails(
      push(ref(db, "mensagens/aluno1"), msg("aluno1", "aluno", { texto: "" })),
    );
    await assertFails(
      push(
        ref(db, "mensagens/aluno1"),
        msg("aluno1", "aluno", { texto: "a".repeat(1001) }),
      ),
    );
    await assertFails(
      push(ref(db, "mensagens/aluno1"), msg("aluno1", "aluno", { x: 1 })),
    );
  });

  test("mensagem existente NÃO pode ser editada nem apagada", async () => {
    const db = dbDe("aluno1");
    await assertFails(set(ref(db, "mensagens/aluno1/m1/texto"), "editado"));
    await assertFails(set(ref(db, "mensagens/aluno1/m1"), null));
  });

  test("participante marca como lida; terceiro não", async () => {
    await assertSucceeds(
      set(ref(dbDe("aluno1"), "mensagens/aluno1/m1/lida"), true),
    );
    await assertFails(
      set(ref(dbDe("aluno2"), "mensagens/aluno1/m1/lida"), true),
    );
  });

  test("lida NÃO volta para false", async () => {
    await assertFails(
      set(ref(dbDe("aluno1"), "mensagens/aluno1/m1/lida"), false),
    );
  });

  test("professor alheio NÃO lê a conversa", async () => {
    await assertFails(get(ref(dbDe("prof2"), "mensagens/aluno1")));
    await assertSucceeds(get(ref(dbDe("prof1"), "mensagens/aluno1")));
  });
});

/* ── professores ──────────────────────────────────────────── */

describe("professores", () => {
  test("anônimo NÃO lê professores (e-mail/telefone)", async () => {
    await assertFails(get(ref(dbAnonimo(), "professores")));
    await assertFails(get(ref(dbAnonimo(), "professores/prof1")));
  });

  test("anônimo lê professoresPublico (cadastro)", async () => {
    await assertSucceeds(get(ref(dbAnonimo(), "professoresPublico")));
  });

  test("aluno lê só o próprio professor", async () => {
    await assertSucceeds(get(ref(dbDe("aluno1"), "professores/prof1")));
    await assertFails(get(ref(dbDe("aluno1"), "professores/prof2")));
  });

  test("só admin grava professoresPublico, e só o nome", async () => {
    await assertFails(
      set(ref(dbDe("prof1"), "professoresPublico/prof1/nome"), "Hack"),
    );
    await assertSucceeds(
      set(ref(dbDe("admin"), "professoresPublico/prof3"), { nome: "Prof 3" }),
    );
    await assertFails(
      set(ref(dbDe("admin"), "professoresPublico/prof3"), {
        nome: "Prof 3",
        email: "vaza@x.com",
      }),
    );
  });
});

/* ── default deny ─────────────────────────────────────────── */

describe("nós não declarados", () => {
  test("professor NÃO grava em nó desconhecido", async () => {
    await assertFails(set(ref(dbDe("prof1"), "qualquerCoisa/x"), 1));
  });
});
