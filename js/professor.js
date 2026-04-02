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
      document.getElementById("sidebar")?.classList.toggle("open");
    });
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", function () {
      document.getElementById("sidebar")?.classList.remove("open");
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
    var snap = await db
      .ref("alunos")
      .orderByChild("professorId")
      .equalTo(profState.uid)
      .once("value");
    var alunosData = snap.val() || {};
    var alunoIds = Object.keys(alunosData);
    var statAlunos = document.getElementById("stat-alunos");
    if (statAlunos) statAlunos.textContent = alunoIds.length;
    var totalTreinos = 0;
    var totalMsgNaoLidas = 0;
    var recentes = [];
    for (var i = 0; i < Math.min(alunoIds.length, 5); i++) {
      var uid = alunoIds[i];
      var aluno = alunosData[uid];
      var treinos = (await db.ref("treinos/" + uid).once("value")).val();
      if (aluno) recentes.push(Object.assign({ uid: uid }, aluno));
      if (treinos) {
        Object.values(treinos).forEach(function (t) {
          if (t.exercicios) totalTreinos += Object.keys(t.exercicios).length;
        });
      }
      var naoLidas = await contarNaoLidas(uid, profState.uid);
      totalMsgNaoLidas += naoLidas;
      if (aluno) recentes[recentes.length - 1].naoLidas = naoLidas;
    }
    var statTreinos = document.getElementById("stat-treinos");
    if (statTreinos) statTreinos.textContent = totalTreinos;
    var statMsgs = document.getElementById("stat-msgs");
    if (statMsgs) statMsgs.textContent = totalMsgNaoLidas;
    renderAlunosRecentes(recentes);
  } catch (e) {
    console.error("[Professor] Erro ao carregar dashboard:", e);
  }
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
async function loadAlunos() {
  mostrarListaAlunos();
  var listEl = document.getElementById("alunos-grid");
  if (!listEl) return;
  listEl.innerHTML =
    '<div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>';
  try {
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
    // Busca naoLidas em paralelo
    var naoLidasMap = {};
    await Promise.all(
      alunosBase.map(async function (a) {
        naoLidasMap[a.uid] = await contarNaoLidas(a.uid, profState.uid);
      }),
    );
    var alunos = alunosBase.map(function (a) {
      return Object.assign({ naoLidas: naoLidasMap[a.uid] || 0 }, a);
    });
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
  setupMensagemForm(uid, "prof-msg-input", "prof-send-msg-btn");
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
