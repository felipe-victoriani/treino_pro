/* ============================================================
   TREINO PRO - Autenticação
   Gerencia estado de autenticação e controle de acesso
   ============================================================ */

/* Páginas que não precisam de autenticação */
const PUBLIC_PAGES = [
  "login.html",
  "cadastro.html",
  "404.html",
  "admin-login.html",
];

/**
 * Verifica se a página atual é pública
 * @returns {boolean}
 */
function isPublicPage() {
  const page = window.location.pathname.split("/").pop();
  return PUBLIC_PAGES.some((p) => page.includes(p)) || page === "";
}

/**
 * Retorna o nome do arquivo da página atual
 * @returns {string}
 */
function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

/**
 * Redireciona o usuário baseado no seu tipo
 * @param {string} tipo - 'professor' | 'aluno'
 */
function redirectByRole(tipo) {
  if (tipo === "admin") {
    window.location.replace("admin.html");
  } else if (tipo === "professor") {
    window.location.replace("professor.html");
  } else if (tipo === "aluno") {
    window.location.replace("aluno.html");
  } else {
    // Tipo desconhecido: desloga e vai ao login
    auth.signOut().then(() => window.location.replace("login.html"));
  }
}

/**
 * Busca os dados do usuário no Firebase
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
async function getUserData(uid) {
  try {
    const snap = await db.ref(`users/${uid}`).once("value");
    return snap.val();
  } catch (error) {
    console.error("[Auth] Erro ao buscar dados do usuário:", error);
    return null;
  }
}

/**
 * Faz logout do usuário
 */
async function logout() {
  try {
    showLoading("Saindo...");
    await auth.signOut();
    window.location.replace("login.html");
  } catch (error) {
    hideLoading();
    showToast("Erro ao sair. Tente novamente.", "error");
    console.error("[Auth] Erro no logout:", error);
  }
}

/**
 * Protetor de rota principal - deve ser chamado no onAuthStateChanged
 * Verifica se o usuário tem permissão para acessar a página atual
 * @param {Object} user - Objeto do Firebase Auth
 */
async function handleAuthState(user) {
  const page = getCurrentPage();

  if (!user) {
    // Usuário não autenticado
    if (!isPublicPage()) {
      window.location.replace("login.html");
    }
    hideLoading();
    return;
  }

  // Usuário autenticado — busca dados
  const userData = await getUserData(user.uid);

  if (!userData) {
    // Sem dados no DB: desloga
    showToast("Conta não encontrada. Contate o administrador.", "error");
    await auth.signOut();
    window.location.replace("login.html");
    return;
  }

  // Valida rota para o tipo correto
  if (userData.tipo === "admin" && page !== "admin.html") {
    window.location.replace("admin.html");
    return;
  }
  if (userData.tipo !== "admin" && page === "admin.html") {
    redirectByRole(userData.tipo);
    return;
  }
  if (userData.tipo === "professor" && page === "aluno.html") {
    window.location.replace("professor.html");
    return;
  }
  if (userData.tipo === "aluno" && page === "professor.html") {
    window.location.replace("aluno.html");
    return;
  }
  if (page === "login.html" || page === "index.html" || page === "") {
    redirectByRole(userData.tipo);
    return;
  }

  hideLoading();

  // Disponibiliza dados globalmente para a página
  window.currentUser = user;
  window.currentUserData = userData;

  // Dispara evento customizado para a página usar
  document.dispatchEvent(
    new CustomEvent("userReady", { detail: { user, userData } }),
  );
}

/* ---- Inicializa listener de autenticação ---- */
document.addEventListener("DOMContentLoaded", () => {
  // Não mostra loading nas páginas públicas
  if (!isPublicPage()) showLoading("Verificando autenticação...");

  auth.onAuthStateChanged(handleAuthState);
});

/**
 * Retorna se o usuário logado é professor
 * @returns {boolean}
 */
function isProfessor() {
  return window.currentUserData?.tipo === "professor";
}

/**
 * Retorna se o usuário logado é aluno
 * @returns {boolean}
 */
function isAluno() {
  return window.currentUserData?.tipo === "aluno";
}
