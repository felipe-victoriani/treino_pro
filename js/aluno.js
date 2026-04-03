/* ============================================================
   TREINO PRO - Aluno.js
   Controlador principal do dashboard do aluno
   ============================================================ */
/* -- Estado Global ------------------------------------------- */
let alunoState = {
  uid: null,
  nome: "",
  professorId: null,
  treinoAtual: "A",
  peso: null,
  altura: null,
  imc: null,
};
/* -- Inicializacao ------------------------------------------- */
document.addEventListener("userReady", async (e) => {
  const { user, userData } = e.detail;
  if (userData.tipo !== "aluno") {
    window.location.replace("login.html");
    return;
  }
  alunoState.uid = user.uid;
  alunoState.nome = userData.nome || "Aluno";
  alunoState.professorId = userData.professorId;
  alunoState.peso = userData.peso;
  alunoState.altura = userData.altura;
  alunoState.imc = userData.imc;
  setupBottomNav();
  setupLogout();
  await alunoNavigate("inicio");
  verificarMensagensNaoLidas();
});
/* -- Navegacao ----------------------------------------------- */
async function alunoNavigate(section) {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  document.querySelectorAll(".aluno-section, .app-section").forEach((s) => {
    s.classList.toggle("hidden", s.id !== "section-" + section);
  });
  switch (section) {
    case "inicio":
      await loadInicio();
      break;
    case "treino":
      await loadTreinoSection();
      break;
    case "dieta":
      await loadDietaSection();
      break;
    case "mensagens":
      loadMensagensSection();
      break;
    case "perfil":
      await loadPerfilSection();
      break;
  }
}
function setupBottomNav() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => alunoNavigate(btn.dataset.section));
  });
}
function setupLogout() {
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);
  document
    .getElementById("aluno-logout-btn")
    ?.addEventListener("click", handleLogout);
}
async function handleLogout() {
  if (!confirm("Deseja sair da sua conta?")) return;
  await auth.signOut();
  window.location.replace("login.html");
}
/* -- Secao Inicio -------------------------------------------- */
async function loadInicio() {
  try {
    const snap = await db.ref("alunos/" + alunoState.uid).once("value");
    const data = snap.val() || {};
    alunoState.treinoAtual = data.treinoAtual || "A";
    // Boas-vindas
    const welcomeEl = document.getElementById("welcome-name");
    if (welcomeEl) welcomeEl.textContent = "Ola, " + alunoState.nome + "! 💪";
    // Treino do dia na badge
    const treinoDia = document.getElementById("treino-dia-letra");
    if (treinoDia) treinoDia.textContent = alunoState.treinoAtual;
    // Quick card treino
    const quickTreino = document.getElementById("quick-treino-info");
    if (quickTreino)
      quickTreino.textContent =
        "Treino " + alunoState.treinoAtual + " para hoje";
    // Quick card IMC
    const quickImc = document.getElementById("quick-imc-info");
    if (quickImc && data.imc) {
      const cls = classificarIMC(data.imc);
      quickImc.textContent =
        parseFloat(data.imc).toFixed(1) + " - " + cls.classe;
    }
    // Preview dos exercicios
    const previewEl = document.getElementById("inicio-treino-preview");
    if (previewEl) {
      const tSnap = await db
        .ref("treinos/" + alunoState.uid + "/" + alunoState.treinoAtual)
        .once("value");
      const treinoData = tSnap.val();
      const exs = treinoData && treinoData.exercicios;
      if (exs) {
        const lista = Object.values(exs)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
          .slice(0, 3);
        const foco = treinoData.foco
          ? '<p style="color:var(--purple-400);margin-bottom:8px;">🎯 ' +
            sanitize(treinoData.foco) +
            "</p>"
          : "";
        previewEl.innerHTML =
          foco +
          lista
            .map(function (ex) {
              return (
                '<div style="padding:6px 0;border-bottom:1px solid var(--border-color);font-size:0.9rem;">💪 <strong>' +
                sanitize(ex.nome) +
                "</strong> — " +
                sanitize(ex.series) +
                "x" +
                sanitize(ex.repeticoes) +
                "</div>"
              );
            })
            .join("");
        if (Object.keys(exs).length > 3) {
          previewEl.innerHTML +=
            '<p style="color:var(--text-muted);margin-top:8px;font-size:0.82rem;">+' +
            (Object.keys(exs).length - 3) +
            " exercicios a mais</p>";
        }
      } else {
        previewEl.innerHTML =
          '<p style="color:var(--text-muted);padding:12px 0;">Seu professor ainda nao cadastrou exercicios.</p>';
      }
    }
    // Nome do professor no header
    if (alunoState.professorId) {
      const profSnap = await db
        .ref("professores/" + alunoState.professorId)
        .once("value");
      const profData = profSnap.val();
      const profInfoEl = document.getElementById("header-professor-info");
      if (profInfoEl && profData) {
        profInfoEl.textContent =
          "Professor: " + sanitize(profData.nome || "Professor");
      }
    }
  } catch (e) {
    console.error("[Aluno] Erro ao carregar inicio:", e);
  }
}
/* -- Secao Treino -------------------------------------------- */
async function loadTreinoSection() {
  const snap = await db
    .ref("alunos/" + alunoState.uid + "/treinoAtual")
    .once("value");
  alunoState.treinoAtual = snap.val() || "A";
  setupTreinoTabs();
  await mostrarTreino(alunoState.treinoAtual);
  await loadHistoricoTreinos(alunoState.uid, "aluno-historico-list", 7);
}
function setupTreinoTabs() {
  document.querySelectorAll(".workout-tab-btn").forEach((btn) => {
    // Remove listeners antigos clonando
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  document.querySelectorAll(".workout-tab-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document
        .querySelectorAll(".workout-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      await mostrarTreino(btn.dataset.letra);
    });
  });
  // Ativa aba do treino atual
  document
    .querySelectorAll(".workout-tab-btn")
    .forEach((b) => b.classList.remove("active"));
  const btnAtual = document.querySelector(
    '.workout-tab-btn[data-letra="' + alunoState.treinoAtual + '"]',
  );
  if (btnAtual) btnAtual.classList.add("active");
}
async function mostrarTreino(letra) {
  const today = getDateKey();
  const hiSnap = await db
    .ref("historicoTreinos/" + alunoState.uid + "/" + today)
    .once("value");
  const historico = hiSnap.val() || {};
  const isHoje = historico.letra === letra;
  const completado = historico.completado;
  // Subtitulo / foco
  const focoInfoEl = document.getElementById("treino-foco-info");
  if (focoInfoEl) {
    const focoSnap = await db
      .ref("treinos/" + alunoState.uid + "/" + letra + "/foco")
      .once("value");
    focoInfoEl.textContent = focoSnap.val()
      ? "🎯 Foco: " + sanitize(focoSnap.val())
      : letra === alunoState.treinoAtual
        ? "Seu treino de hoje"
        : "Treino " + letra;
  }
  // Carrega exercicios
  await loadTreinoAluno(
    alunoState.uid,
    letra,
    "aluno-exercise-list",
    historico,
  );
  // Botao finalizar
  const btnFinalizar = document.getElementById("finish-workout-btn");
  if (btnFinalizar) {
    if (completado && isHoje) {
      btnFinalizar.innerHTML = "✅ Treino Concluido Hoje!";
      btnFinalizar.disabled = true;
    } else {
      const total = document.querySelectorAll('[id^="excard-"]').length;
      btnFinalizar.innerHTML =
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Finalizar Treino';
      btnFinalizar.disabled = total === 0;
      btnFinalizar.onclick = function () {
        finalizarTreino(alunoState.uid);
      };
    }
  }
}
/* -- Secao Dieta --------------------------------------------- */
async function loadDietaSection() {
  await loadDietaAluno(alunoState.uid, "aluno-dieta-content");
}
/* -- Secao Mensagens ----------------------------------------- */
function loadMensagensSection() {
  loadMensagens(alunoState.uid, "aluno-messages-container", alunoState.uid);
  setupMensagemForm(
    alunoState.uid,
    "aluno-msg-input",
    "aluno-send-msg-btn",
    alunoState.professorId,
  );
}
/* -- Secao Perfil -------------------------------------------- */
async function loadPerfilSection() {
  try {
    const [alunoSnap, userSnap] = await Promise.all([
      db.ref("alunos/" + alunoState.uid).once("value"),
      db.ref("users/" + alunoState.uid).once("value"),
    ]);
    const data = alunoSnap.val() || {};
    const userData = userSnap.val() || {};
    const nome = data.nome || alunoState.nome;
    // Avatar
    const avatarEl = document.getElementById("perfil-avatar");
    if (avatarEl) {
      avatarEl.textContent = getInitials(nome);
      avatarEl.style.background = getAvatarColor(nome);
    }
    // Campos
    var campos = {
      "perfil-nome": nome,
      "perfil-email": data.email || userData.email || "",
      "perfil-treino-atual": data.treinoAtual
        ? "Treino " + data.treinoAtual
        : "Nao definido",
      "perfil-data-cadastro": userData.createdAt
        ? new Date(userData.createdAt).toLocaleDateString("pt-BR")
        : "Nao informado",
    };
    Object.entries(campos).forEach(function (entry) {
      var el = document.getElementById(entry[0]);
      if (el) el.textContent = sanitize(String(entry[1]));
    });
    // Nome do professor
    var pid = data.professorId || alunoState.professorId;
    if (pid) {
      db.ref("users/" + pid)
        .once("value")
        .then(function (s) {
          var profEl = document.getElementById("perfil-professor");
          if (profEl && s.val())
            profEl.textContent = sanitize(s.val().nome || "Professor");
        });
    }
    // IMC
    renderIMCPerfil(data.imc, data.peso, data.altura);
  } catch (e) {
    console.error("[Aluno] Erro ao carregar perfil:", e);
  }
}
/* -- Badge de Mensagens nao lidas ---------------------------- */
async function verificarMensagensNaoLidas() {
  try {
    var snap = await db
      .ref("mensagens/" + alunoState.uid)
      .orderByChild("lida")
      .equalTo(false)
      .once("value");
    var data = snap.val();
    var dotEl = document.getElementById("nav-msg-dot");
    var badgeEl = document.getElementById("quick-msg-badge");
    if (!data) {
      dotEl && dotEl.classList.add("hidden");
      badgeEl && badgeEl.classList.add("hidden");
      return;
    }
    var naoLidas = Object.values(data).filter(function (m) {
      return m.deUid !== alunoState.uid;
    }).length;
    if (dotEl) dotEl.classList.toggle("hidden", naoLidas === 0);
    if (badgeEl) badgeEl.classList.toggle("hidden", naoLidas === 0);
  } catch (_) {}
}
