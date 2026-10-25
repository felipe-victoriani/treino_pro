/**
 * tests/functions/excluir-conta.test.js
 *
 * Testa a Cloud Function excluirMinhaConta nos emuladores
 * (Auth + Realtime Database + Functions). Rodar com:
 *   npm run test:functions
 */

const adminAppMod = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} = require("firebase/auth");
const {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} = require("firebase/functions");
const { setLogLevel } = require("firebase/app");

setLogLevel("error");

const PROJECT_ID = "demo-treino";
// Namespace que o emulador de Functions usa para o RTDB em projeto demo
const DB_NS = PROJECT_ID;
const SENHA = "senha-teste-123";

// Endereços exportados pelo firebase emulators:exec (com fallback padrão)
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const DB_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
const [FN_HOST, FN_PORT] = (process.env.FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001").split(":");

let adminApp, adminDb, clientApp, auth, excluir;

/** Cria usuário no emulador de Auth e devolve o uid. */
async function criarUsuario(email) {
  const cred = await createUserWithEmailAndPassword(auth, email, SENHA);
  await signOut(auth);
  return cred.user.uid;
}

/** Faz login e chama a Function como esse usuário. */
async function excluirComo(email) {
  await signInWithEmailAndPassword(auth, email, SENHA);
  try {
    return await excluir();
  } finally {
    await signOut(auth).catch(() => {});
  }
}

const ler = async (path) => (await adminDb.ref(path).once("value")).val();

beforeAll(() => {
  adminApp = adminAppMod.initializeApp(
    { projectId: PROJECT_ID, databaseURL: `http://${DB_HOST}?ns=${DB_NS}` },
    "admin-teste",
  );
  adminDb = getDatabase(adminApp);

  clientApp = initializeApp({ projectId: PROJECT_ID, apiKey: "fake-key" });
  auth = getAuth(clientApp);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const fns = getFunctions(clientApp);
  connectFunctionsEmulator(fns, FN_HOST, Number(FN_PORT));
  excluir = httpsCallable(fns, "excluirMinhaConta");
});

afterAll(async () => {
  await deleteApp(clientApp);
  await adminAppMod.deleteApp(adminApp);
});

beforeEach(async () => {
  await adminDb.ref().set(null);
});

test("sem login: recusa", async () => {
  await expect(excluir()).rejects.toMatchObject({ code: "functions/unauthenticated" });
});

test("aluno: apaga todos os dados e a conta", async () => {
  const email = `aluno-${Date.now()}@teste.com`;
  const uid = await criarUsuario(email);
  await adminDb.ref().update({
    [`users/${uid}`]: { tipo: "aluno", nome: "Aluno Teste", peso: 70 },
    [`alunos/${uid}`]: { tipo: "aluno", nome: "Aluno Teste" },
    [`treinos/${uid}/A/foco`]: "peito",
    [`historicoIMC/${uid}/x`]: { imc: 22 },
    [`mensagens/${uid}/m1`]: { texto: "oi", deUid: uid },
    [`conquistas/${uid}/c1`]: { nome: "Primeiro treino" },
    "users/outro": { tipo: "aluno", nome: "Outro" },
  });

  const res = await excluirComo(email);
  expect(res.data).toEqual({ success: true });

  for (const no of ["users", "alunos", "treinos", "historicoIMC", "mensagens", "conquistas"]) {
    expect(await ler(`${no}/${uid}`)).toBeNull();
  }
  // Dado de outra pessoa intacto
  expect(await ler("users/outro/nome")).toBe("Outro");
  // Conta de autenticação removida: login com a mesma senha falha
  await expect(signInWithEmailAndPassword(auth, email, SENHA)).rejects.toMatchObject({
    code: expect.stringMatching(/auth\/(user-not-found|invalid-credential)/),
  });
});

test("professor: apaga a conta, desvincula alunos e remove só as mensagens dele", async () => {
  const email = `prof-${Date.now()}@teste.com`;
  const uid = await criarUsuario(email);
  await adminDb.ref().update({
    [`users/${uid}`]: { tipo: "professor", nome: "Prof" },
    [`professores/${uid}`]: { nome: "Prof", email },
    [`professoresPublico/${uid}`]: { nome: "Prof" },
    "alunos/a1": { nome: "A1", professorId: uid, professorNome: "Prof" },
    "users/a1": { tipo: "aluno", nome: "A1", professorId: uid, professorNome: "Prof" },
    "mensagens/a1/m1": { texto: "do prof", deUid: uid },
    "mensagens/a1/m2": { texto: "do aluno", deUid: "a1" },
  });

  await excluirComo(email);

  expect(await ler(`users/${uid}`)).toBeNull();
  expect(await ler(`professores/${uid}`)).toBeNull();
  expect(await ler(`professoresPublico/${uid}`)).toBeNull();
  expect(await ler("alunos/a1/professorId")).toBeNull();
  expect(await ler("users/a1/professorId")).toBeNull();
  expect(await ler("alunos/a1/nome")).toBe("A1");
  expect(await ler("mensagens/a1/m1")).toBeNull();
  expect((await ler("mensagens/a1/m2")).texto).toBe("do aluno");
});

test("admin: bloqueado", async () => {
  const email = `admin-${Date.now()}@teste.com`;
  const uid = await criarUsuario(email);
  await adminDb.ref(`users/${uid}`).set({ tipo: "admin", nome: "Admin" });

  await expect(excluirComo(email)).rejects.toMatchObject({
    code: "functions/permission-denied",
  });
  expect(await ler(`users/${uid}/tipo`)).toBe("admin");
});
