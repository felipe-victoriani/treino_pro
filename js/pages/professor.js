/* =================================================================
   TREINO PRO - professor.js
   Controlador principal do dashboard do professor
   ================================================================= */
/* -- Estado ---------------------------------------------------- */
var profState = {
  uid: null,
  nome: "",
  alunoSelecionado: null,
  treinoLetraAtual: "A",
  focoSelecionado: "",
};
/* -- Inicializacao --------------------------------------------- */
document.addEventListener("userReady", async function (e) {
  var user = e.detail.user;
  var userData = e.detail.userData;
  if (userData.tipo !== "professor") {
    window.location.replace("login.html");
    return;
  }
  profState.uid = user.uid;
  profState.nome = userData.nome || "Professor";
  // Nome na sidebar (abaixo de "Treino Pro")
  var sidebarNomeLogo = document.getElementById("sidebar-logo-nome");
  if (sidebarNomeLogo) sidebarNomeLogo.textContent = sanitize(profState.nome);
  // Atualiza footer da sidebar
  var sidebarName = document.getElementById("sidebar-name");
  if (sidebarName) sidebarName.textContent = sanitize(profState.nome);
  var sidebarAvatar = document.getElementById("sidebar-avatar");
  if (sidebarAvatar)
    sidebarAvatar.textContent = profState.nome.charAt(0).toUpperCase();
  // Header de boas-vindas
  var welcomeEl = document.getElementById("dashboard-welcome");
  if (welcomeEl)
    welcomeEl.textContent = "Ola, " + sanitize(profState.nome) + "! 👋";
  setupNavigation();
  setupLogout();
  if (typeof initVideoUploadListeners === "function")
    initVideoUploadListeners();
  professorNavigate("dashboard");
});
/* -- Navegacao ------------------------------------------------- */
function professorNavigate(section) {
  document.querySelectorAll(".sidebar-nav-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  document.querySelectorAll(".app-section").forEach(function (s) {
    s.classList.toggle("hidden", s.id !== "section-" + section);
  });
  var headerTitle = document.getElementById("header-title");
  if (headerTitle) {
    var titulos = {
      dashboard: "Dashboard",
      alunos: "Meus Alunos",
      mensagens: "Mensagens",
      perfil: "Meu Perfil",
    };
    headerTitle.textContent = titulos[section] || section;
  }
  switch (section) {
    case "dashboard":
      loadDashboard();
      break;
    case "alunos":
      loadAlunos();
      break;
    case "mensagens":
      loadMensagensGeral();
      break;
    case "perfil":
      loadPerfilProfessor();
      break;
  }
  document.getElementById("sidebar")?.classList.remove("open");
}
function setupNavigation() {
  document.querySelectorAll(".sidebar-nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      professorNavigate(btn.dataset.section);
    });
  });
  document
    .getElementById("menu-toggle")
    ?.addEventListener("click", function () {
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      sidebar?.classList.toggle("open");
      overlay?.classList.toggle("active", sidebar?.classList.contains("open"));
    });
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", function () {
      document.getElementById("sidebar")?.classList.remove("open");
      this.classList.remove("active");
    });
}
function setupLogout() {
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", async function () {
      if (!confirm("Deseja sair da sua conta?")) return;
      await auth.signOut();
      window.location.replace("login.html");
    });
}
/* -- Dashboard ------------------------------------------------- */
async function loadDashboard() {
  try {
    // Skeleton loading na lista de alunos recentes
    var skelEl = document.getElementById("dashboard-alunos-list");
    if (skelEl) {
      skelEl.innerHTML = [1, 2, 3]
        .map(
          () =>
            '<div class="skeleton-student-card"><div class="skeleton-avatar-sm"></div><div style="flex:1"><div class="skeleton-line sk-title"></div><div class="skeleton-line sk-meta"></div></div></div>',
        )
        .join("");
    }

    // ⚡ OTIMIZAÇÃO: Limita a 10 alunos para calcular stats (performance)
    var snap = await db
      .ref("alunos")
      .orderByChild("professorId")
      .equalTo(profState.uid)
      .limitToFirst(10)
      .once("value");
    var alunosData = snap.val() || {};
    var alunoIds = Object.keys(alunosData);

    // Busca contagem total de alunos separadamente (mais rápido)
    var totalSnap = await db
      .ref("alunos")
      .orderByChild("professorId")
      .equalTo(profState.uid)
      .once("value");
    var totalAlunos = totalSnap.val() ? Object.keys(totalSnap.val()).length : 0;

    var statAlunos = document.getElementById("stat-alunos");
    if (statAlunos) statAlunos.textContent = totalAlunos;

    // ⚡ OTIMIZAÇÃO: Calcula stats apenas dos 10 primeiros alunos
    var totalMsgNaoLidas = 0;
    var recentes = [];

    // Busca mensagens não lidas em paralelo (muito mais rápido)
    var naoLidasPromises = alunoIds.map((uid) =>
      contarNaoLidas(uid, profState.uid),
    );
    var naoLidasResults = await Promise.all(naoLidasPromises);

    for (var i = 0; i < Math.min(alunoIds.length, 5); i++) {
      var uid = alunoIds[i];
      var aluno = alunosData[uid];
      if (aluno) {
        var naoLidas = naoLidasResults[i] || 0;
        totalMsgNaoLidas += naoLidas;
        recentes.push(Object.assign({ uid: uid, naoLidas: naoLidas }, aluno));
      }
    }

    // ⚡ Stat de treinos agora mostra apenas "Ver detalhes" para evitar query pesada
    var statTreinos = document.getElementById("stat-treinos");
    if (statTreinos) statTreinos.textContent = "Ver detalhes";

    var statMsgs = document.getElementById("stat-msgs");
    if (statMsgs) statMsgs.textContent = totalMsgNaoLidas;

    renderAlunosRecentes(recentes);

    // ⚡ Carrega widgets adicionais de forma lazy (não bloqueia)
    setTimeout(() => {
      renderAlunosInativos(alunosData).catch((e) =>
        console.warn("[Dashboard] Erro ao carregar inativos:", e),
      );
      renderRelatorioSemanal(alunosData).catch((e) =>
        console.warn("[Dashboard] Erro ao carregar relatório:", e),
      );
    }, 100);
  } catch (e) {
    console.error("[Professor] Erro ao carregar dashboard:", e);
  }
}

async function renderAlunosInativos(alunosData) {
  const container = document.getElementById("dashboard-inativos");
  if (!container) return;
  const LIMITE_DIAS = 5;
  const hoje = new Date();
  const inativos = [];

  // ⚡ OTIMIZAÇÃO: Limita verificação aos 10 alunos já carregados
  const alunosArray = Object.entries(alunosData).slice(0, 10);

  // ⚡ Busca históricos em paralelo
  const historicoPromises = alunosArray.map(([uid]) =>
    db
      .ref("historicoTreinos/" + uid)
      .orderByKey()
      .limitToLast(1)
      .once("value")
      .then((snap) => ({ uid, snap }))
      .catch(() => ({ uid, snap: null })),
  );

  const historicos = await Promise.all(historicoPromises);

  for (let i = 0; i < historicos.length; i++) {
    const { uid, snap } = historicos[i];
    const aluno = alunosData[uid];
    if (!aluno) continue;

    const hist = snap?.val();
    let ultimoTreino = null;
    if (hist) {
      const chave = Object.keys(hist)[0]; // "YYYY-MM-DD"
      ultimoTreino = chave;
    }
    let diasSemTreinar = LIMITE_DIAS + 1;
    if (ultimoTreino) {
      const diff = Math.floor(
        (hoje - new Date(ultimoTreino + "T00:00:00")) / 86400000,
      );
      diasSemTreinar = diff;
    }
    if (diasSemTreinar >= LIMITE_DIAS) {
      inativos.push({ uid, nome: aluno.nome, diasSemTreinar, ultimoTreino });
    }
  }
  if (!inativos.length) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }
  container.classList.remove("hidden");
  container.innerHTML =
    '<div class="alerta-inativos-header">⚠️ Alunos sem treinar há ' +
    LIMITE_DIAS +
    "+ dias</div>" +
    inativos
      .map(function (a) {
        const label = a.ultimoTreino
          ? "Último treino: " +
            new Date(a.ultimoTreino + "T00:00:00").toLocaleDateString("pt-BR") +
            " (" +
            a.diasSemTreinar +
            " dias)"
          : "Nunca treinou";
        return (
          '<div class="alerta-inativo-item" onclick="selecionarAlunoDosDash(\'' +
          sanitize(a.uid) +
          "')\">" +
          '<div class="alerta-inativo-avatar" style="background:' +
          getAvatarColor(a.nome) +
          '">' +
          sanitize(getInitials(a.nome)) +
          "</div>" +
          "<div><strong>" +
          sanitize(a.nome) +
          '</strong><p class="alerta-inativo-label">' +
          label +
          "</p></div>" +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left:auto;color:var(--text-muted)"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>' +
          "</div>"
        );
      })
      .join("");
}
async function renderRelatorioSemanal(alunosData) {
  const container = document.getElementById("dashboard-relatorio");
  if (!container) return;

  const hoje = new Date();
  const semanaKeys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    semanaKeys.push(d.toISOString().slice(0, 10));
  }

  let totalSemana = 0;
  const porAluno = {};

  // ⚡ OTIMIZAÇÃO: Limita a 10 alunos e busca em paralelo
  const alunosArray = Object.entries(alunosData).slice(0, 10);

  // Busca todos os históricos em paralelo (7 dias × 10 alunos = 70 queries paralelas)
  const historicoPromises = [];
  for (const [uid, aluno] of alunosArray) {
    for (const dia of semanaKeys) {
      historicoPromises.push(
        db
          .ref(`historicoTreinos/${uid}/${dia}`)
          .once("value")
          .then((snap) => ({ uid, aluno, dia, snap }))
          .catch(() => ({ uid, aluno, dia, snap: null })),
      );
    }
  }

  const resultados = await Promise.all(historicoPromises);

  // Processa resultados
  for (const { uid, aluno, snap } of resultados) {
    const hist = snap?.val();
    if (hist && hist.completado) {
      totalSemana++;
      if (!porAluno[uid]) {
        porAluno[uid] = { nome: aluno.nome, count: 0 };
      }
      porAluno[uid].count++;
    }
  }

  const topAlunos = Object.values(porAluno)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  container.classList.remove("hidden");
  const medalhas = ["🥇", "🥈", "🥉"];
  container.innerHTML =
    '<div class="relatorio-header">📊 Relatório da Semana</div>' +
    '<div class="relatorio-total">' +
    '<span class="relatorio-num">' +
    totalSemana +
    "</span>" +
    '<span class="relatorio-label">treino' +
    (totalSemana !== 1 ? "s" : "") +
    " completado" +
    (totalSemana !== 1 ? "s" : "") +
    " pelos alunos</span>" +
    "</div>" +
    (topAlunos.length > 0
      ? '<div class="relatorio-top"><p class="relatorio-top-label">🏆 Destaque da semana</p>' +
        topAlunos
          .map(
            (a, i) =>
              '<div class="relatorio-top-item">' +
              '<span class="relatorio-rank">' +
              medalhas[i] +
              "</span>" +
              '<span class="relatorio-nome">' +
              sanitize(a.nome) +
              "</span>" +
              '<span class="relatorio-count badge badge-purple">' +
              a.count +
              " treino" +
              (a.count > 1 ? "s" : "") +
              "</span>" +
              "</div>",
          )
          .join("") +
        "</div>"
      : '<p class="relatorio-vazio">Nenhum treino concluído esta semana.</p>');
}

function renderAlunosRecentes(alunos) {
  var el = document.getElementById("dashboard-alunos-list");
  if (!el) return;
  if (!alunos.length) {
    el.innerHTML =
      '<div class="empty-state"><h3>Nenhum aluno ainda</h3><p>Seus alunos aparecerão aqui quando se cadastrarem.</p></div>';
    return;
  }
  el.innerHTML = alunos
    .map(function (a) {
      var imc = a.imc ? parseFloat(a.imc).toFixed(1) : null;
      var imcClass = "";
      if (imc) {
        var v = parseFloat(imc);
        imcClass =
          v < 18.5
            ? "badge-blue"
            : v < 25
              ? "badge-green"
              : v < 30
                ? "badge-orange"
                : "badge-red";
      }
      return (
        '<div class="student-card" onclick="selecionarAlunoDosDash(\'' +
        sanitize(a.uid) +
        '\')" style="cursor:pointer;position:relative;">' +
        (a.naoLidas > 0
          ? '<span class="card-msg-badge">' + a.naoLidas + "</span>"
          : "") +
        '<div class="student-card-top">' +
        '<div class="student-avatar" style="background:' +
        getAvatarColor(a.nome) +
        '">' +
        sanitize(a.nome || "Aluno") +
        "</div>" +
        "</div>" +
        '<div class="student-card-stats">' +
        (a.peso
          ? '<div class="student-stat"><span class="stat-label">Peso</span><span class="stat-val">' +
            sanitize(String(a.peso)) +
            " kg</span></div>"
          : "") +
        (a.altura
          ? '<div class="student-stat"><span class="stat-label">Altura</span><span class="stat-val">' +
            sanitize(String(a.altura)) +
            " m</span></div>"
          : "") +
        (imc
          ? '<div class="student-stat"><span class="stat-label">IMC</span><span class="stat-val badge ' +
            imcClass +
            '">' +
            imc +
            "</span></div>"
          : "") +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}
function selecionarAlunoDosDash(uid) {
  professorNavigate("alunos");
  setTimeout(function () {
    selecionarAluno(uid);
  }, 150);
}
/* -- Lista de Alunos ------------------------------------------ */
// ⚡ Estado da paginação
var alunosPaginacao = {
  carregados: [],
  limite: 30,
  offset: 0,
  temMais: true,
};

async function loadAlunos() {
  mostrarListaAlunos();
  var listEl = document.getElementById("alunos-grid");
  if (!listEl) return;
  listEl.innerHTML =
    '<div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>';
  try {
    // ⚡ OTIMIZAÇÃO: Carrega todos de uma vez mas processa em lotes
    var snap = await db
      .ref("alunos")
      .orderByChild("professorId")
      .equalTo(profState.uid)
      .once("value");
    var alunosData = snap.val() || {};
    var alunosBase = Object.entries(alunosData).map(function (entry) {
      return Object.assign({ uid: entry[0] }, entry[1]);
    });
    if (!alunosBase.length) {
      listEl.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><h3>Nenhum aluno cadastrado</h3><p>Seus alunos aparecerao quando se registrarem e selecionarem voce como professor.</p></div>';
      return;
    }

    // ⚡ Busca mensagens não lidas apenas dos primeiros 30 alunos
    var alunosParaCarregar = alunosBase.slice(0, alunosPaginacao.limite);
    var naoLidasPromises = alunosParaCarregar.map((a) =>
      contarNaoLidas(a.uid, profState.uid)
        .then((count) => ({ uid: a.uid, count }))
        .catch(() => ({ uid: a.uid, count: 0 })),
    );
    var naoLidasResults = await Promise.all(naoLidasPromises);
    var naoLidasMap = {};
    naoLidasResults.forEach((r) => {
      naoLidasMap[r.uid] = r.count;
    });

    var alunos = alunosBase.map(function (a) {
      return Object.assign({ naoLidas: naoLidasMap[a.uid] || 0 }, a);
    });

    // Guarda referência para paginação futura
    alunosPaginacao.carregados = alunos;
    // Busca
    var searchEl = document.getElementById("search-alunos");
    function renderList(filtro) {
      var filtered = filtro
        ? alunos.filter(function (a) {
            return (a.nome || "").toLowerCase().includes(filtro.toLowerCase());
          })
        : alunos;
      if (!filtered.length) {
        listEl.innerHTML =
          '<div class="empty-state" style="grid-column:1/-1"><h3>Nenhum aluno encontrado</h3></div>';
        return;
      }
      listEl.innerHTML = filtered
        .map(function (a) {
          return (
            '<div class="student-card" onclick="selecionarAluno(\'' +
            sanitize(a.uid) +
            '\')" style="cursor:pointer;position:relative;">' +
            (a.naoLidas > 0
              ? '<span class="card-msg-badge">' + a.naoLidas + "</span>"
              : "") +
            '<div class="student-avatar" style="background:' +
            getAvatarColor(a.nome) +
            '">' +
            sanitize((a.nome || "Aluno").split(" ")[0]) +
            "</div>" +
            '<div class="student-info">' +
            "<span>" +
            (a.treinoAtual
              ? "Treino " + sanitize(a.treinoAtual)
              : "Sem treino") +
            "</span>" +
            "</div>" +
            '<span class="student-arrow">›</span>' +
            "</div>"
          );
        })
        .join("");
    }
    renderList("");
    if (searchEl)
      searchEl.addEventListener("input", function () {
        renderList(searchEl.value);
      });
  } catch (e) {
    var listEl2 = document.getElementById("alunos-grid");
    if (listEl2)
      listEl2.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><h3>Erro ao carregar alunos</h3></div>';
    console.error(e);
  }
}
function mostrarListaAlunos() {
  document.getElementById("alunos-list-view")?.classList.remove("hidden");
  document.getElementById("aluno-detail-view")?.classList.add("hidden");
}
function voltarParaAlunos() {
  stopMensagensListener();
  profState.alunoSelecionado = null;
  mostrarListaAlunos();
}
/* -- Detalhe do Aluno ----------------------------------------- */
async function selecionarAluno(uid) {
  showLoading("Carregando dados do aluno...");
  try {
    var snap = await db.ref("alunos/" + uid).once("value");
    var data = snap.val();
    if (!data) {
      showToast("Aluno nao encontrado", "error");
      return;
    }
    profState.alunoSelecionado = Object.assign({ uid: uid }, data);
    // Painel de detalhe
    document.getElementById("alunos-list-view")?.classList.add("hidden");
    document.getElementById("aluno-detail-view")?.classList.remove("hidden");
    // Header do aluno
    var avatarEl = document.getElementById("aluno-detail-avatar");
    if (avatarEl) {
      var primeiroNome = (data.nome || "Aluno").split(" ")[0];
      avatarEl.textContent = sanitize(primeiroNome);
      avatarEl.style.background = getAvatarColor(data.nome);
    }
    var treinoEl = document.getElementById("aluno-detail-treino");
    if (treinoEl)
      treinoEl.textContent = "Treino " + sanitize(data.treinoAtual || "A");
    var imcEl = document.getElementById("aluno-detail-imc");
    if (imcEl)
      imcEl.textContent = data.imc
        ? "IMC: " + parseFloat(data.imc).toFixed(1)
        : "IMC nao calculado";
    // Botao voltar
    var btnBack = document.getElementById("btn-back-alunos");
    if (btnBack) btnBack.onclick = voltarParaAlunos;
    // Registra clicks nas sub-tabs
    setupSubTabs(uid);
    // Ativa sub-tab treinos por padrao
    abrirSubtab("treinos", uid);
  } catch (e) {
    showToast("Erro ao carregar dados do aluno", "error");
    console.error(e);
  } finally {
    hideLoading();
  }
}
/* -- Sub-tabs -------------------------------------------------- */
function abrirSubtab(tab, alunoId) {
  var uid = alunoId || profState.alunoSelecionado?.uid;
  if (!uid) return;
  document.querySelectorAll(".sub-tab-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.subtab === tab);
  });
  document.querySelectorAll(".subtab-panel").forEach(function (panel) {
    panel.classList.toggle("hidden", panel.id !== "subtab-" + tab);
  });
  switch (tab) {
    case "treinos":
      initTreinosTab(uid);
      break;
    case "dieta":
      initDietaTab(uid);
      break;
    case "historico":
      loadHistoricoTreinos(uid, "prof-historico-list");
      break;
    case "msgs":
      initMensagensTab(uid);
      break;
  }
}
// Wires up sub-tab click events (called once after detail panel shows)
function setupSubTabs(uid) {
  document.querySelectorAll(".sub-tab-btn").forEach(function (btn) {
    var clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  document.querySelectorAll(".sub-tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      abrirSubtab(btn.dataset.subtab, uid);
    });
  });
}
/* -- Sub-tab: Treinos ----------------------------------------- */
function initTreinosTab(uid) {
  // Abas A-E (apenas do professor — filtrar pelo contexto do subtab-treinos)
  var profTabs = document.querySelectorAll(
    "#prof-workout-tabs .workout-tab-btn",
  );
  profTabs.forEach(function (btn) {
    var c = btn.cloneNode(true);
    btn.parentNode.replaceChild(c, btn);
  });
  document
    .querySelectorAll("#prof-workout-tabs .workout-tab-btn")
    .forEach(function (btn) {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll("#prof-workout-tabs .workout-tab-btn")
          .forEach(function (b) {
            b.classList.remove("active");
          });
        btn.classList.add("active");
        profState.treinoLetraAtual = btn.dataset.letra;
        loadTreinoProfessor(uid, btn.dataset.letra);
        document.getElementById("current-workout-label").textContent =
          "Treino " + btn.dataset.letra;
      });
    });
  // Focus chips
  document
    .querySelectorAll("#focus-selector .focus-chip")
    .forEach(function (chip) {
      chip.addEventListener("click", async function () {
        document
          .querySelectorAll("#focus-selector .focus-chip")
          .forEach(function (c) {
            c.classList.remove("active");
          });
        chip.classList.add("active");
        profState.focoSelecionado = chip.dataset.foco;
        var uid2 = profState.alunoSelecionado?.uid;
        if (!uid2) return;
        try {
          await db
            .ref("treinos/" + uid2 + "/" + profState.treinoLetraAtual + "/foco")
            .set(chip.dataset.foco);
          showToast("Foco salvo!", "success");
        } catch (_) {
          showToast("Erro ao salvar foco", "error");
        }
      });
    });
  // Definir treino atual
  var btnSetTreino = document.getElementById("set-treino-atual-btn");
  if (btnSetTreino) {
    var newBtn = btnSetTreino.cloneNode(true);
    btnSetTreino.parentNode.replaceChild(newBtn, btnSetTreino);
    newBtn.addEventListener("click", async function () {
      var selectEl = document.getElementById("treino-atual-select");
      if (!selectEl || !uid) return;
      try {
        await db.ref("alunos/" + uid + "/treinoAtual").set(selectEl.value);
        showToast(
          "Treino atual definido como " + selectEl.value + "!",
          "success",
        );
        var treinoEl = document.getElementById("aluno-detail-treino");
        if (treinoEl) treinoEl.textContent = "Treino " + selectEl.value;
      } catch (_) {
        showToast("Erro ao definir treino", "error");
      }
    });
  }
  // Preenche select com treino atual do aluno
  var selectEl = document.getElementById("treino-atual-select");
  if (selectEl) selectEl.value = profState.alunoSelecionado?.treinoAtual || "A";
  // Botao adicionar exercicio
  var addBtn = document.getElementById("add-exercise-btn");
  if (addBtn) {
    var newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.addEventListener("click", async function () {
      var formEl = document.getElementById("exercise-form");
      if (!formEl) return;
      var isOpening = formEl.classList.contains("hidden");
      formEl.classList.toggle("hidden");
      if (isOpening) {
        limparFormExercicio();
        if (window.ExercicioAutocomplete) {
          await ExercicioAutocomplete.init(profState.uid);
        }
      }
    });
  }
  // Botao cancelar exercicio
  var cancelBtn = document.getElementById("cancel-exercise-btn");
  if (cancelBtn) {
    var newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener("click", function () {
      document.getElementById("exercise-form")?.classList.add("hidden");
      limparFormExercicio();
    });
  }
  // Botao salvar exercicio
  var saveExBtn = document.getElementById("save-exercise-btn");
  if (saveExBtn) {
    var newSaveExBtn = saveExBtn.cloneNode(true);
    saveExBtn.parentNode.replaceChild(newSaveExBtn, saveExBtn);
    newSaveExBtn.addEventListener("click", async function () {
      await salvarExercicio();
      document.getElementById("exercise-form")?.classList.add("hidden");
    });
  }
  // Carrega treino A por padrao
  profState.treinoLetraAtual = "A";
  loadTreinoProfessor(uid, "A");
}
/* -- Sub-tab: Dieta ------------------------------------------- */
function initDietaTab(uid) {
  loadDietaProfessor(uid);
  // Botao adicionar refeicao
  var addRefBtn = document.getElementById("add-refeicao-btn");
  if (addRefBtn) {
    var newBtn = addRefBtn.cloneNode(true);
    addRefBtn.parentNode.replaceChild(newBtn, addRefBtn);
    newBtn.addEventListener("click", function () {
      adicionarRefeicaoCard(null);
    });
  }
  // Botao salvar dieta
  var saveDietBtn = document.getElementById("save-diet-btn");
  if (saveDietBtn) {
    var newSaveBtn = saveDietBtn.cloneNode(true);
    saveDietBtn.parentNode.replaceChild(newSaveBtn, saveDietBtn);
    newSaveBtn.addEventListener("click", salvarDieta);
  }
}
/* -- Sub-tab: Mensagens --------------------------------------- */
function initMensagensTab(uid) {
  loadMensagens(uid, "prof-messages-container", profState.uid);
  setupMensagemForm(uid, "prof-msg-input", "prof-send-msg-btn", uid);
}
/* -- Mensagens Geral ----------------------------------------- */
async function loadMensagensGeral() {
  var el = document.getElementById("messages-alunos-list");
  if (!el) return;
  el.innerHTML =
    '<div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>';
  try {
    var snap = await db
      .ref("professores/" + profState.uid + "/alunos")
      .once("value");
    var alunoIds = snap.val() ? Object.keys(snap.val()) : [];
    if (!alunoIds.length) {
      el.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><h3>Nenhum aluno</h3></div>';
      return;
    }
    var itens = await Promise.all(
      alunoIds.map(async function (uid) {
        var results = await Promise.all([
          db.ref("alunos/" + uid).once("value"),
          db
            .ref("mensagens/" + uid)
            .orderByChild("timestamp")
            .limitToLast(1)
            .once("value"),
        ]);
        var aluno = results[0].val() || {};
        var msgs = results[1].val();
        var ultima = msgs ? Object.values(msgs)[0] : null;
        var naoLidas = await contarNaoLidas(uid, profState.uid);
        return { uid: uid, aluno: aluno, ultima: ultima, naoLidas: naoLidas };
      }),
    );
    el.innerHTML = itens
      .map(function (item) {
        return (
          '<div class="student-card" onclick="abrirConversa(\'' +
          sanitize(item.uid) +
          '\')" style="cursor:pointer;">' +
          '<div class="student-avatar" style="background:' +
          getAvatarColor(item.aluno.nome) +
          '">' +
          getInitials(item.aluno.nome) +
          "</div>" +
          '<div class="student-info">' +
          "<strong>" +
          sanitize(item.aluno.nome || "Aluno") +
          "</strong>" +
          "<span>" +
          (item.ultima
            ? sanitize((item.ultima.texto || "").slice(0, 50))
            : "Nenhuma mensagem") +
          "</span>" +
          "</div>" +
          (item.naoLidas > 0
            ? '<span class="badge-dot">' + item.naoLidas + "</span>"
            : "") +
          "</div>"
        );
      })
      .join("");
  } catch (e) {
    el.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1"><h3>Erro ao carregar</h3></div>';
    console.error(e);
  }
}
function abrirConversa(alunoId) {
  professorNavigate("alunos");
  setTimeout(function () {
    selecionarAluno(alunoId).then(function () {
      setTimeout(function () {
        abrirSubtab("msgs", alunoId);
      }, 300);
    });
  }, 100);
}
/* -- Perfil do Professor ------------------------------------- */
async function loadPerfilProfessor() {
  try {
    var snap = await db.ref("users/" + profState.uid).once("value");
    var data = snap.val() || {};
    var avatarEl = document.getElementById("prof-avatar-big");
    if (avatarEl) {
      avatarEl.textContent = getInitials(data.nome || profState.nome);
      avatarEl.style.background = getAvatarColor(data.nome || profState.nome);
    }
    var nomeEl = document.getElementById("prof-nome-big");
    if (nomeEl) nomeEl.textContent = sanitize(data.nome || profState.nome);
    var emailEl = document.getElementById("prof-email-big");
    if (emailEl) emailEl.textContent = sanitize(data.email || "");
  } catch (e) {
    console.error(e);
  }
}
