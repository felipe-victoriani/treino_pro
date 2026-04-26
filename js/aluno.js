/* ============================================================
   TREINO PRO - Aluno.js
   Controlador principal do dashboard do aluno
   ============================================================ */

/* -- Frases Motivacionais ------------------------------------ */
const FRASES_MASCULINAS = [
  "Bora, guerreiro! Aquele shape não vai aparecer sozinho. 💪",
  "Menos desculpa, mais barra.",
  "O cara no espelho amanhã agradece o esforço de hoje.",
  "Endorfina é o melhor pré-treino.",
  "Forjado na academia, respeitado em qualquer lugar.",
  "Levanta, brother. O treino não espera.",
  "Cada série te deixa mais perto do físico que você quer.",
  "Não tem dia ruim pra treinar. Tem dia que exige mais força.",
  "Seu corpo pode mais — sua mente é que precisa acreditar.",
  "Consistência bate motivação todo dia.",
  "Dói agora, orgulho depois.",
  "Você já está na frente de quem ficou no sofá.",
  "O esforço de hoje é o físico de amanhã.",
  "Um rep de cada vez, mas nunca parado.",
  "Disciplina é liberdade.",
];

const FRASES_FEMININAS = [
  "Bora, guerreira! Seu corpo é sua obra-prima. 🌟",
  "Você é forte, linda e ainda está ficando melhor.",
  "Cada treino é um presente que você dá a si mesma.",
  "Não é sobre ser magra. É sobre ser poderosa.",
  "Sua maior competição é quem você era ontem.",
  "Mulher que levanta peso, levanta a vida também.",
  "Suor hoje, brilho amanhã. ✨",
  "Seu esforço é silencioso. Seus resultados, barulhentos.",
  "Força não tem gênero — mas o seu é incrível.",
  "Consistência bate motivação todo dia.",
  "Dói agora, orgulho depois.",
  "Você já está na frente de quem ficou no sofá.",
  "O esforço de hoje é o resultado de amanhã.",
  "Um passo de cada vez, mas nunca parada.",
  "Disciplina é liberdade.",
];

const FRASES_GENERICAS = [
  "Cada rep te aproxima do seu melhor. 💪",
  "O único treino ruim é o que não aconteceu.",
  "Consistência bate motivação todo dia.",
  "Dói agora, orgulho depois.",
  "Seu corpo pode. É sua mente que você precisa convencer.",
  "Progresso, não perfeição.",
  "Você não vai se arrepender de ter treinado.",
  "Mais forte a cada treino.",
  "Mexa-se hoje para comemorar amanhã.",
  "Quem vai com frequência, chega com resultado.",
  "Força não vem do que o corpo pode fazer, mas do que você supera.",
  "Você já está na frente de quem ficou no sofá.",
  "O esforço de hoje é o físico de amanhã.",
  "Um passo de cada vez, mas nunca parado.",
  "Disciplina é liberdade.",
];

function getFraseMotivacional(sexo) {
  const banco =
    sexo === "masculino"
      ? FRASES_MASCULINAS
      : sexo === "feminino"
        ? FRASES_FEMININAS
        : FRASES_GENERICAS;
  const idx = new Date().getDate() % banco.length;
  return banco[idx];
}

/* -- Estado Global ------------------------------------------- */
let alunoState = {
  uid: null,
  nome: "",
  professorId: null,
  treinoAtual: "A",
  sexo: null,
  objetivo: null,
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
  alunoState.sexo = userData.sexo || null;
  alunoState.objetivo = userData.objetivo || null;
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

    // Frase motivacional
    const fraseEl = document.getElementById("frase-motivacional");
    if (fraseEl) fraseEl.textContent = getFraseMotivacional(alunoState.sexo);

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

    // Streak e gráfico da semana
    await calcularEExibirStreak();
    await renderSemanaChart();
  } catch (e) {
    console.error("[Aluno] Erro ao carregar inicio:", e);
  }
}

/* -- Streak -------------------------------------------------- */
async function calcularEExibirStreak() {
  try {
    const hiSnap = await db
      .ref("historicoTreinos/" + alunoState.uid)
      .once("value");
    const historico = hiSnap.val() || {};
    const dias = Object.keys(historico).sort().reverse(); // mais recente primeiro

    let streak = 0;
    const hoje = getDateKey();
    let cursor = new Date();

    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (historico[key] && historico[key].completado) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (key === hoje) {
        // hoje ainda não treinou — não quebra o streak, só não conta
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const badgeEl = document.getElementById("streak-badge");
    const countEl = document.getElementById("streak-count");
    if (streak > 0 && badgeEl && countEl) {
      countEl.textContent = streak;
      badgeEl.classList.remove("hidden");
    }
    return streak;
  } catch (e) {
    return 0;
  }
}

/* -- Gráfico da semana --------------------------------------- */
let _semanaChart = null;
async function renderSemanaChart() {
  const container = document.getElementById("semana-treinos-card");
  if (!container) return;
  try {
    const hiSnap = await db
      .ref("historicoTreinos/" + alunoState.uid)
      .once("value");
    const historico = hiSnap.val() || {};

    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const labels = [];
    const valores = [];
    const cores = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const diaSemana = diasSemana[d.getDay()];
      const isHoje = i === 0;
      labels.push(isHoje ? "Hoje" : diaSemana);
      const entry = historico[key];
      if (!entry) {
        valores.push(0);
        cores.push("rgba(107,53,195,0.15)");
      } else if (entry.completado) {
        valores.push(100);
        cores.push("rgba(107,53,195,0.9)");
      } else {
        const pct =
          entry.totalExercicios > 0
            ? Math.round(
                (entry.exerciciosConcluidos / entry.totalExercicios) * 100,
              )
            : 0;
        valores.push(pct);
        cores.push("rgba(107,53,195,0.45)");
      }
    }

    const temDados = valores.some((v) => v > 0);
    if (!temDados) {
      container.innerHTML =
        '<div class="empty-state" style="padding:20px;"><p style="color:var(--text-muted);font-size:0.85rem;">Nenhum treino registrado esta semana. Vamos lá!</p></div>';
      return;
    }

    container.innerHTML = '<canvas id="semana-chart" height="130"></canvas>';
    const ctx = document.getElementById("semana-chart").getContext("2d");

    if (_semanaChart) {
      _semanaChart.destroy();
      _semanaChart = null;
    }

    _semanaChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: valores,
            backgroundColor: cores,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.raw === 100 ? "✅ Completo" : ctx.raw + "% feito",
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: (v) => v + "%",
              color: "#8888aa",
              font: { size: 10 },
            },
            grid: { color: "#ffffff11" },
          },
          x: {
            ticks: { color: "#8888aa", font: { size: 11 } },
            grid: { display: false },
          },
        },
      },
    });
  } catch (e) {
    console.error("[Aluno] Erro gráfico semana:", e);
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
  // Adiciona listener ao botão de IA
  const btnGerarTreino = document.getElementById("btn-gerar-treino-ia");
  if (btnGerarTreino) {
    btnGerarTreino.onclick = async () => {
      // Coleta dados do aluno para sugestão
      const objetivo = prompt(
        "Qual seu objetivo principal? (ex: hipertrofia, emagrecimento, condicionamento)",
        alunoState.objetivo || "",
      );
      if (!objetivo) {
        showToast("Informe seu objetivo para gerar o treino.", "error");
        return;
      }
      const nivel = prompt(
        "Qual seu nível? (Iniciante, Intermediário, Avançado)",
        "Iniciante",
      );
      if (!nivel) return;
      const restricoes = prompt(
        "Possui alguma restrição física ou de saúde? (opcional)",
        "",
      );
      btnGerarTreino.disabled = true;
      showToast("Gerando treino personalizado... Aguarde...", "info");
      try {
        const url =
          "https://us-central1-app-treino-academia.cloudfunctions.net/gerarTreinoIA";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objetivo, nivel, restricoes }),
        });
        if (!res.ok) {
          showToast("Erro ao gerar treino.", "error");
          btnGerarTreino.disabled = false;
          return;
        }
        showToast(
          "Treino gerado com sucesso! Atualize a página para ver.",
          "success",
        );
      } catch (e) {
        showToast("Erro ao conectar com a IA.", "error");
      }
      btnGerarTreino.disabled = false;
    };
  }
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
  // Tenta carregar exercícios do treino
  const exListEl = document.getElementById("aluno-exercise-list");
  let temExercicios = false;
  if (exListEl) {
    // Limpa
    exListEl.innerHTML =
      '<div class="empty-state"><div class="spinner"></div></div>';
    // Busca exercícios do treino
    const tSnap = await db
      .ref("treinos/" + alunoState.uid + "/" + letra)
      .once("value");
    const treinoData = tSnap.val();
    const exs = treinoData && treinoData.exercicios;
    if (exs && Object.keys(exs).length > 0) {
      temExercicios = true;
      // Exibe botão IA só se for aluno de IA
      const btnGerarTreino = document.getElementById("btn-gerar-treino-ia");
      if (btnGerarTreino) {
        if (alunoState.professorId === "IA") {
          btnGerarTreino.style.display = "block";
        } else {
          btnGerarTreino.style.display = "none";
        }
      }
      // Renderiza normalmente (reaproveita função existente)
      await loadTreinoAluno(
        alunoState.uid,
        letra,
        "aluno-exercise-list",
        historico,
      );
    } else {
      // Se não houver exercícios cadastrados, tenta mostrar treino IA
      const snapAluno = await db.ref("alunos/" + alunoState.uid).once("value");
      const dadosAluno = snapAluno.val() || {};
      const campo = "treino" + letra;
      const treinoIA = dadosAluno[campo];
      if (treinoIA) {
        exListEl.innerHTML = `<div class='card' style='white-space:pre-line;font-size:1.05rem;padding:18px 12px 12px 12px;'>${sanitize(treinoIA)}</div>`;
      } else {
        exListEl.innerHTML =
          '<div class="empty-state"><p style="color:var(--text-muted);padding:12px 0;">Seu professor ainda não cadastrou exercícios e não há sugestão de IA para este treino.</p></div>';
      }
    }
  }
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
    // Badge de sexo no avatar
    const sexoBadge = document.getElementById("perfil-sexo-badge");
    if (sexoBadge) {
      const s = data.sexo || alunoState.sexo;
      if (s) {
        sexoBadge.textContent = s === "masculino" ? "♂" : "♀";
        sexoBadge.classList.remove("hidden");
      } else {
        sexoBadge.classList.add("hidden");
      }
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
    // Objetivo
    const objetivoRow = document.getElementById("perfil-objetivo-row");
    const objetivoEl = document.getElementById("perfil-objetivo");
    const obj = data.objetivo || alunoState.objetivo;
    if (obj && objetivoRow && objetivoEl) {
      objetivoEl.textContent = sanitize(obj);
      objetivoRow.style.display = "";
    }
    // IMC
    renderIMCPerfil(data.imc, data.peso, data.altura);
    // Gráfico histórico IMC
    await renderIMCChart();
  } catch (e) {
    console.error("[Aluno] Erro ao carregar perfil:", e);
  }
}

/* -- Gráfico histórico IMC ----------------------------------- */
let _imcChart = null;
async function renderIMCChart() {
  const wrap = document.getElementById("imc-historico-wrap");
  const canvas = document.getElementById("imc-chart");
  if (!wrap || !canvas) return;
  try {
    const snap = await db.ref("historicoIMC/" + alunoState.uid).once("value");
    const hist = snap.val();
    if (!hist) return;
    const entries = Object.entries(hist)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10);
    if (entries.length < 2) return;
    const labels = entries.map(([k]) => {
      const [, m, d] = k.split("-");
      return d + "/" + m;
    });
    const imcs = entries.map(([, v]) => parseFloat(v.imc));
    wrap.classList.remove("hidden");
    if (_imcChart) {
      _imcChart.destroy();
      _imcChart = null;
    }
    _imcChart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: imcs,
            borderColor: "#6B35C3",
            backgroundColor: "rgba(107,53,195,0.1)",
            borderWidth: 2,
            pointBackgroundColor: "#6B35C3",
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { color: "#8888aa", font: { size: 10 } },
            grid: { color: "#ffffff11" },
          },
          x: {
            ticks: { color: "#8888aa", font: { size: 10 } },
            grid: { display: false },
          },
        },
      },
    });
  } catch (e) {
    /* silencioso */
  }
}

/* -- Celebração ao finalizar treino ------------------------- */
async function mostrarCelebracao(letra, proxLetra, feitos, total) {
  const modal = document.getElementById("modal-celebracao");
  if (!modal) {
    showToast("Treino " + letra + " finalizado! 🎉", "success");
    return;
  }
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 100;
  let emoji = "🎉",
    titulo = "Treino Concluído!",
    msg = "";
  if (pct === 100) {
    emoji = "🏆";
    titulo = "Treino 100% Completo!";
    msg = "Você arrasou! Todos os " + total + " exercícios feitos.";
  } else if (pct >= 80) {
    emoji = "💪";
    titulo = "Ótimo Treino!";
    msg = feitos + " de " + total + " exercícios — quase perfeito!";
  } else {
    emoji = "✅";
    titulo = "Treino Finalizado!";
    msg = feitos + " de " + total + " exercícios concluídos.";
  }
  if (proxLetra && proxLetra !== letra) {
    msg += " Próximo treino: <strong>" + proxLetra + "</strong>.";
  }
  document.getElementById("celebracao-emoji").textContent = emoji;
  document.getElementById("celebracao-title").textContent = titulo;
  document.getElementById("celebracao-msg").innerHTML = msg;

  // Streak
  const streak = await calcularEExibirStreak();
  const streakEl = document.getElementById("celebracao-streak");
  const streakNum = document.getElementById("celebracao-streak-num");
  if (streak > 1 && streakEl && streakNum) {
    streakNum.textContent = streak;
    streakEl.classList.remove("hidden");
  } else if (streakEl) {
    streakEl.classList.add("hidden");
  }
  modal.classList.add("open");
}

function fecharCelebracao() {
  const modal = document.getElementById("modal-celebracao");
  if (modal) modal.classList.remove("open");
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

/* -- Timer de descanso entre séries ------------------------- */
let _timerInterval = null;
let _timerTotal = 0;

function iniciarTimerDescanso(segundos) {
  const overlay = document.getElementById("timer-descanso-overlay");
  const display = document.getElementById("timer-display");
  const bar = document.getElementById("timer-bar");
  if (!overlay || !display || !bar) return;

  if (_timerInterval) clearInterval(_timerInterval);
  _timerTotal = segundos;
  let restante = segundos;

  overlay.classList.remove("hidden");
  display.textContent = restante;
  bar.style.transition = "none";
  bar.style.width = "100%";

  // Força reflow para a transição CSS funcionar corretamente
  void bar.offsetWidth;
  bar.style.transition = `width ${segundos}s linear`;
  bar.style.width = "0%";

  _timerInterval = setInterval(() => {
    restante--;
    display.textContent = restante;
    if (restante <= 3 && restante > 0 && navigator.vibrate) {
      navigator.vibrate(60);
    }
    if (restante <= 0) {
      if (navigator.vibrate) navigator.vibrate([100, 60, 100]);
      pularTimer();
    }
  }, 1000);
}

function pularTimer() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
  document.getElementById("timer-descanso-overlay")?.classList.add("hidden");
}

/* -- Histórico de cargas por exercício ---------------------- */
let _cargaChart = null;

async function verHistoricoCargas(exId, exNome, alunoId) {
  const overlay = document.getElementById("modal-cargas-overlay");
  const titleEl = document.getElementById("modal-cargas-title");
  if (!overlay) return;
  if (titleEl) titleEl.textContent = "📊 " + exNome;
  overlay.classList.remove("hidden");
  await renderCargaHistoricoChart(exId, alunoId);
}

function fecharModalCargas() {
  document.getElementById("modal-cargas-overlay")?.classList.add("hidden");
}

async function renderCargaHistoricoChart(exId, alunoId) {
  const bodyEl = document.getElementById("modal-cargas-body");
  if (!bodyEl) return;
  bodyEl.innerHTML =
    '<div class="empty-state" style="padding:20px"><div class="spinner"></div></div>';

  try {
    const snap = await db
      .ref(`historicoTreinos/${alunoId}`)
      .orderByKey()
      .limitToLast(60)
      .once("value");
    const data = snap.val() || {};

    const entries = [];
    Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, hist]) => {
        const carga = hist.cargaUsada && hist.cargaUsada[exId];
        if (carga) entries.push({ date, carga });
      });

    if (entries.length === 0) {
      bodyEl.innerHTML =
        '<div class="empty-state" style="padding:20px"><h3>Sem registros de carga</h3><p>Anote a carga durante o treino para ver a evolução.</p></div>';
      return;
    }

    bodyEl.innerHTML = '<canvas id="cargas-chart" height="180"></canvas>';
    const ctx = document.getElementById("cargas-chart").getContext("2d");

    if (_cargaChart) {
      _cargaChart.destroy();
      _cargaChart = null;
    }

    _cargaChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: entries.map((e) => {
          const [, m, d] = e.date.split("-");
          return d + "/" + m;
        }),
        datasets: [
          {
            data: entries.map((e) => parseFloat(e.carga) || null),
            borderColor: "#6B35C3",
            backgroundColor: "rgba(107,53,195,0.12)",
            borderWidth: 2,
            pointBackgroundColor: "#6B35C3",
            pointRadius: 5,
            fill: true,
            tension: 0.3,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.raw != null ? ctx.raw + " kg" : "sem valor numérico",
            },
          },
        },
        scales: {
          y: {
            ticks: { color: "#8888aa", font: { size: 10 } },
            grid: { color: "#ffffff11" },
          },
          x: {
            ticks: { color: "#8888aa", font: { size: 10 } },
            grid: { display: false },
          },
        },
      },
    });
  } catch (e) {
    bodyEl.innerHTML =
      '<div class="empty-state"><h3>Erro ao carregar histórico</h3></div>';
    console.error(e);
  }
}
