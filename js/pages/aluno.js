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
  programaAtivo: null, // id do programa ativo (ia-custom, pré-definido, etc.)
  treinoGerado: null, // plano gerado pela IA
  treinoAtual: "A",
  sexo: null,
  objetivo: null,
  peso: null,
  altura: null,
  imc: null,
  programaFase: 1,
  treinosCompletos: 0,
};
/* -- Inicializacao ------------------------------------------- */
document.addEventListener("userReady", async (e) => {
  const { user, userData } = e.detail;
  if (userData.tipo !== "aluno") {
    window.location.replace("login.html");
    return;
  }

  // Aluno sem professor nem programa → vai montar treino com IA
  if (!userData.professorId && !userData.programaAtivo) {
    window.location.replace("montar-treino.html");
    return;
  }

  alunoState.uid = user.uid;
  alunoState.nome = userData.nome || "Aluno";
  alunoState.professorId = userData.professorId || null;
  alunoState.programaAtivo = userData.programaAtivo || null;
  alunoState.treinoGerado = userData.treinoGerado || null;
  alunoState.sexo = userData.sexo || null;
  alunoState.objetivo = userData.objetivo || null;
  alunoState.peso = userData.peso;
  alunoState.altura = userData.altura;
  alunoState.imc = userData.imc;
  alunoState.programaFase = userData.programaFase || 1;
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

    // Preview dos exercicios na tela de início
    const previewEl = document.getElementById("inicio-treino-preview");
    if (previewEl) {
      if (alunoState.programaAtivo === "ia-custom" && alunoState.treinoGerado) {
        // Preview do plano gerado por IA
        const treinoIA =
          alunoState.treinoGerado.treinos?.[alunoState.treinoAtual];
        if (treinoIA && treinoIA.exercicios) {
          const lista = treinoIA.exercicios.slice(0, 3);
          const foco = `<p style="color:var(--blue-400);margin-bottom:8px;font-size:0.85rem;">🤖 ${sanitize(treinoIA.nome)}</p>`;
          previewEl.innerHTML =
            foco +
            lista
              .map(
                (ex) =>
                  `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.88rem;">💪 <strong>${sanitize(ex.nome)}</strong> — ${ex.series}x ${sanitize(ex.repeticoes)}</div>`,
              )
              .join("");
          if (treinoIA.exercicios.length > 3) {
            previewEl.innerHTML += `<p style="color:var(--text-muted);margin-top:8px;font-size:0.82rem;">+${treinoIA.exercicios.length - 3} exercícios</p>`;
          }
        }
      } else if (alunoState.programaAtivo && !alunoState.professorId) {
        // Preview do programa pré-definido
        const treinoPre = getTreinoDoPrograma(
          alunoState.programaAtivo,
          alunoState.treinoAtual,
        );
        if (treinoPre && treinoPre.exercicios) {
          const lista = treinoPre.exercicios.slice(0, 3);
          const foco = treinoPre.foco
            ? `<p style="color:var(--blue-400);margin-bottom:8px;font-size:0.85rem;">🎯 ${sanitize(treinoPre.foco)}</p>`
            : "";
          previewEl.innerHTML =
            foco +
            lista
              .map(
                (ex) =>
                  `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.88rem;">💪 <strong>${sanitize(ex.nome)}</strong> — ${ex.series}x ${sanitize(ex.reps)}</div>`,
              )
              .join("");
          if (treinoPre.exercicios.length > 3) {
            previewEl.innerHTML += `<p style="color:var(--text-muted);margin-top:8px;font-size:0.82rem;">+${treinoPre.exercicios.length - 3} exercícios</p>`;
          }
        }
      } else {
        // Preview do treino do professor (fluxo original)
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
            ? `<p style="color:var(--blue-400);margin-bottom:8px;">🎯 ${sanitize(treinoData.foco)}</p>`
            : "";
          previewEl.innerHTML =
            foco +
            lista
              .map(
                (ex) =>
                  `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.9rem;">💪 <strong>${sanitize(ex.nome)}</strong> — ${sanitize(ex.series)}x${sanitize(ex.repeticoes)}</div>`,
              )
              .join("");
          if (Object.keys(exs).length > 3) {
            previewEl.innerHTML += `<p style="color:var(--text-muted);margin-top:8px;font-size:0.82rem;">+${Object.keys(exs).length - 3} exercícios a mais</p>`;
          }
        } else {
          previewEl.innerHTML =
            '<p style="color:var(--text-muted);padding:12px 0;">Seu professor ainda não cadastrou exercícios.</p>';
        }
      }
    }

    // Nome do professor OU nome do programa no header
    const profInfoEl = document.getElementById("header-professor-info");
    if (alunoState.programaAtivo === "ia-custom" && alunoState.treinoGerado) {
      if (profInfoEl) {
        profInfoEl.textContent = `🤖 Treino IA · ${sanitize(alunoState.treinoGerado.objetivo || "Personalizado")}`;
      }
    } else if (alunoState.programaAtivo && !alunoState.professorId) {
      const prog = getProgramaById(alunoState.programaAtivo);
      if (profInfoEl && prog) {
        profInfoEl.textContent = "📋 " + prog.nome;
      }
    } else if (alunoState.professorId) {
      const profSnap = await db
        .ref("professores/" + alunoState.professorId)
        .once("value");
      const profData = profSnap.val();
      if (profInfoEl && profData) {
        profInfoEl.textContent =
          "Professor: " + sanitize(profData.nome || "Professor");
      }
    }

    // Streak e gráfico da semana
    await calcularEExibirStreak();
    await renderSemanaChart();
    // Barra de progressão de fase (apenas alunos independentes)
    await loadProgressaoInicio();
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
      const key = dateKeyOf(cursor);
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
      const key = dateKeyOf(d);
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

  // Ajusta abas conforme tipo de plano
  if (alunoState.programaAtivo === "ia-custom" && alunoState.treinoGerado) {
    const letras = Object.keys(alunoState.treinoGerado.treinos || {}).sort();
    ajustarAbasTreinoIA(letras);
  } else if (alunoState.programaAtivo && !alunoState.professorId) {
    const letras = getTreinosDoPrograma(alunoState.programaAtivo);
    ajustarAbasTreino(letras);
  }

  setupTreinoTabs();
  await mostrarTreino(alunoState.treinoAtual);
  await loadHistoricoTreinos(alunoState.uid, "aluno-historico-list", 7);
}

/**
 * Ajusta as abas da seção de treino para refletir as letras do programa
 */
function ajustarAbasTreino(letras) {
  const tabsContainer = document.querySelector(".workout-tabs");
  if (!tabsContainer) return;
  tabsContainer.innerHTML = letras
    .map((letra, i) => {
      const prog = getProgramaById(alunoState.programaAtivo);
      const treino = prog?.treinos[letra];
      return `<button class="workout-tab-btn${i === 0 ? " active" : ""}" data-letra="${letra}">
        ${treino ? treino.icone + " " : ""}Treino ${letra}
      </button>`;
    })
    .join("");
}
function ajustarAbasTreinoIA(letras) {
  const tabsContainer = document.querySelector(".workout-tabs");
  if (!tabsContainer) return;
  tabsContainer.innerHTML = letras
    .map(
      (letra, i) =>
        `<button class="workout-tab-btn${i === 0 ? " active" : ""}" data-letra="${letra}">
          🤖 Treino ${letra}
        </button>`,
    )
    .join("");
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
  // Extrai dados específicos da letra (nova estrutura) com fallback legado
  const historicoLetra =
    (historico.letras && historico.letras[letra]) ||
    (historico.letra === letra ? historico : {});
  // Letra concluída = novo campo letrasCompletas OU estrutura legada
  const letraCompletadaHoje =
    !!(historico.letrasCompletas && historico.letrasCompletas[letra]) ||
    (historico.letra === letra && !!historico.completado);
  // Subtitulo / foco
  const focoInfoEl = document.getElementById("treino-foco-info");

  // ── Aluno com plano gerado por IA ─────────────────────────
  if (alunoState.programaAtivo === "ia-custom" && alunoState.treinoGerado) {
    const treinoIA = alunoState.treinoGerado.treinos?.[letra];
    if (focoInfoEl) {
      focoInfoEl.textContent = treinoIA
        ? "🤖 " + sanitize(treinoIA.nome)
        : "Treino " + letra;
    }
    const exListEl = document.getElementById("aluno-exercise-list");
    if (exListEl) {
      if (treinoIA && treinoIA.exercicios && treinoIA.exercicios.length) {
        const exercicios = treinoIA.exercicios.map((ex) => ({
          nome: ex.nome,
          series: ex.series,
          reps: ex.repeticoes,
          descanso: ex.descanso,
          dica: ex.observacao,
        }));
        // Sempre renderiza com estado vazio — checkboxes reiniciam a cada abertura
        exListEl.innerHTML = renderExerciciosPreDefinidos(
          exercicios,
          {},
          letra,
        );
        initExercicioCheckboxes();
      } else {
        exListEl.innerHTML =
          '<div class="empty-state"><p style="color:var(--text-muted);padding:12px 0;">Este treino não está disponível.</p></div>';
      }
    }
  } else if (alunoState.programaAtivo && !alunoState.professorId) {
    // ── Aluno com programa pré-definido (sem professor) ────────
    const treinoBase = getTreinoDoPrograma(alunoState.programaAtivo, letra);
    const treinoPre =
      treinoBase && typeof aplicarFaseAoTreino !== "undefined"
        ? aplicarFaseAoTreino(
            treinoBase,
            alunoState.programaAtivo,
            letra,
            alunoState.programaFase,
          )
        : treinoBase;
    if (focoInfoEl) {
      focoInfoEl.textContent = treinoPre
        ? "🎯 " + treinoPre.foco
        : "Treino " + letra;
    }
    const exListEl = document.getElementById("aluno-exercise-list");
    if (exListEl) {
      if (treinoPre && treinoPre.exercicios && treinoPre.exercicios.length) {
        // Sempre renderiza com estado vazio — checkboxes reiniciam a cada abertura
        exListEl.innerHTML = renderExerciciosPreDefinidos(
          treinoPre.exercicios,
          {},
          letra,
        );
        initExercicioCheckboxes();
      } else {
        exListEl.innerHTML =
          '<div class="empty-state"><p style="color:var(--text-muted);padding:12px 0;">Este treino não está disponível no seu programa.</p></div>';
      }
    }
  } else {
    // ── Aluno com professor (fluxo original) ──────────────────
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
    const exListEl = document.getElementById("aluno-exercise-list");
    if (exListEl) {
      exListEl.innerHTML =
        '<div class="empty-state"><div class="spinner"></div></div>';
      const tSnap = await db
        .ref("treinos/" + alunoState.uid + "/" + letra)
        .once("value");
      const treinoData = tSnap.val();
      const exs = treinoData && treinoData.exercicios;
      if (exs && Object.keys(exs).length > 0) {
        // Passa apenas cargaUsada (para pré-preencher o input de carga);
        // estado de checkboxes é sempre reiniciado em loadTreinoAluno
        await loadTreinoAluno(alunoState.uid, letra, "aluno-exercise-list", {
          cargaUsada: historico.cargaUsada || {},
        });
      } else {
        const snapAluno = await db
          .ref("alunos/" + alunoState.uid)
          .once("value");
        const dadosAluno = snapAluno.val() || {};
        const campo = "treino" + letra;
        const treinoIA = dadosAluno[campo];
        if (treinoIA) {
          exListEl.innerHTML = `<div class='card' style='white-space:pre-line;font-size:1.05rem;padding:18px 12px 12px 12px;'>${sanitize(treinoIA)}</div>`;
        } else {
          exListEl.innerHTML =
            '<div class="empty-state"><p style="color:var(--text-muted);padding:12px 0;">Seu professor ainda não cadastrou exercícios.</p></div>';
        }
      }
    }
  }
  // Botão finalizar — sempre habilitado (exercícios sempre reiniciam zerados)
  const btnFinalizar = document.getElementById("finish-workout-btn");
  if (btnFinalizar) {
    const total = document.querySelectorAll('[id^="excard-"]').length;
    const jaFeito = letraCompletadaHoje
      ? "↪️ Refazer Treino "
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> ';
    btnFinalizar.innerHTML = jaFeito + "Finalizar Treino";
    btnFinalizar.disabled = total === 0;
    btnFinalizar.onclick = function () {
      finalizarTreino(alunoState.uid);
    };
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
    // Conquistas (apenas alunos independentes)
    await renderConquistasPerfil();
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

  // Verifica conquistas (todos os alunos) e progressão de fase (só independentes)
  setTimeout(() => verificarProgressaoAposTreino(), 1600);
}

function fecharCelebracao() {
  const modal = document.getElementById("modal-celebracao");
  if (modal) modal.classList.remove("open");
  // Auto-navega para o próximo treino (ciclo) ao fechar o modal de celebração
  if (typeof alunoState !== "undefined" && alunoState.treinoAtual) {
    const proxLetra = alunoState.treinoAtual;
    document
      .querySelectorAll(".workout-tab-btn")
      .forEach((b) => b.classList.remove("active"));
    const btn = document.querySelector(
      `.workout-tab-btn[data-letra="${proxLetra}"]`,
    );
    if (btn) btn.classList.add("active");
    if (typeof mostrarTreino === "function") mostrarTreino(proxLetra);
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

/* ── Renderização de exercícios pré-definidos ──────────────
   Usa o mesmo layout exercise-check-card do fluxo de professor
   para UX consistente em todos os tipos de plano.
   ─────────────────────────────────────────────────────────── */
function renderExerciciosPreDefinidos(
  exercicios,
  historico = {},
  letraRenderizada = null,
) {
  const completados = historico.exerciciosCompletos || {};
  const seriesCompletas = historico.seriesCompletas || {};

  return exercicios
    .map((ex, idx) => {
      const exId =
        "pre_" + idx + "_" + ex.nome.replace(/\s+/g, "_").toLowerCase();
      const done = !!completados[exId];
      const numSeries = Math.max(1, parseInt(ex.series) || 3);
      const exSeriesComp = seriesCompletas[exId] || {};

      // Extrai segundos de descanso para o timer
      const descansoSeg = (() => {
        const raw = String(ex.descanso || "");
        const m = raw.match(/(\d+)/);
        return m ? parseInt(m[1]) : 60;
      })();

      const seriesPillsHtml = Array.from({ length: numSeries }, (_, i) => {
        const serieKey = "s" + (i + 1);
        const serieFeita = !!exSeriesComp[serieKey];
        const repsLabel = ex.reps
          ? `<span class="serie-reps">${sanitize(ex.reps)}</span>`
          : "";
        return `<button class="serie-pill${serieFeita ? " serie-done" : ""}" id="spill-${exId}-${i}"
          onclick="event.stopPropagation(); toggleSeriePre(this, '${exId}', '${serieKey}', ${numSeries}, ${descansoSeg}, '${letraRenderizada || ""}')"
        ><span class="serie-num">S${i + 1}</span>${repsLabel}</button>`;
      }).join("");

      const expandArea = ex.dica
        ? `<div class="ex-expand-area hidden" id="expand-${exId}">
            <p class="ex-instrucoes-text">💡 <strong>Dica:</strong> ${sanitize(ex.dica)}</p>
          </div>`
        : "";

      const metaPartes = [
        `${numSeries} série${numSeries > 1 ? "s" : ""} × ${sanitize(ex.reps || "")}`,
        ex.descanso ? `${sanitize(ex.descanso)} descanso` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `
        <div class="exercise-check-card${done ? " completed" : ""}" id="excard-${exId}">
          <div class="ex-check-main" onclick="expandirCard('${exId}')">
            <div class="exercise-check-info">
              <div class="exercise-check-nome">${sanitize(ex.nome)}</div>
              <div class="exercise-check-meta">${metaPartes}</div>
              ${ex.grupoMuscular ? `<div class="exercise-check-obs">💪 ${sanitize(ex.grupoMuscular)}</div>` : ""}
            </div>
            <svg class="ex-expand-chevron${ex.dica ? "" : " invisible"}" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </div>
          ${expandArea}
          <div class="series-pills-row" onclick="event.stopPropagation()">
            ${seriesPillsHtml}
          </div>
        </div>`;
    })
    .join("");
}

/**
 * Marca/desmarca uma série de exercício pré-definido.
 * Estado mantido apenas localmente (_sessaoLocal); Firebase só é
 * escrito ao chamar finalizarTreino().
 */
function toggleSeriePre(
  btn,
  exId,
  serieKey,
  numSeries,
  descansoSeg,
  letraRenderizada,
) {
  if (navigator.vibrate) navigator.vibrate(25);
  const done = btn.classList.toggle("serie-done");

  // Usa a letra do treino renderizado na tela (passada pelo onclick),
  // com fallback para treinoAtual caso chamado por código legado.
  const letraAtiva = letraRenderizada || alunoState.treinoAtual || "A";

  // Atualiza estado local da sessão (sem Firebase)
  const sessao = _getSessaoLetra(letraAtiva);
  if (!sessao.seriesCompletas[exId]) sessao.seriesCompletas[exId] = {};
  if (done) sessao.seriesCompletas[exId][serieKey] = true;
  else delete sessao.seriesCompletas[exId][serieKey];

  // Verifica se todas as séries do exercício foram completadas
  const card = document.getElementById("excard-" + exId);
  if (!card) return;
  const doneBtns = card.querySelectorAll(".serie-pill.serie-done").length;
  const total = numSeries || card.querySelectorAll(".serie-pill").length;
  const allDone = doneBtns >= total;

  card.classList.toggle("completed", allDone);

  if (allDone) {
    sessao.exerciciosCompletos[exId] = true;
    // Animação de conclusão
    card.classList.add("just-completed");
    setTimeout(() => card.classList.remove("just-completed"), 450);
    // Timer de descanso
    const seg = descansoSeg || 60;
    if (seg > 0) iniciarTimerDescanso(seg);
  } else {
    delete sessao.exerciciosCompletos[exId];
  }

  atualizarProgressoTreino();
}

/**
 * Atualiza a barra de progresso do treino
 */
function atualizarProgressoTreino(feitos, total) {
  const allCards = document.querySelectorAll('[id^="excard-"]');
  const allDone = document.querySelectorAll('[id^="excard-"].completed');
  const t = total !== undefined ? total : allCards.length;
  const f = feitos !== undefined ? feitos : allDone.length;
  const pct = t > 0 ? Math.round((f / t) * 100) : 0;

  const progressEl = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const progressPct = document.getElementById("progress-pct");

  if (progressEl) {
    progressEl.style.width = pct + "%";
    progressEl.classList.toggle("done", pct === 100);
  }
  if (progressText) progressText.textContent = `${f} / ${t}`;
  if (progressPct) progressPct.textContent = pct + "%";

  const btnFinalizar = document.getElementById("finish-workout-btn");
  if (btnFinalizar) btnFinalizar.disabled = t === 0;
}

/**
 * Inicializa checkboxes de exercícios (compatibilidade)
 */
function initExercicioCheckboxes() {
  atualizarProgressoTreino();
}

/* ================================================================
   SISTEMA DE PROGRESSÃO DE FASES E CONQUISTAS
   Apenas para alunos que treinam de forma independente.
   ================================================================ */

/* -- Barra de Progresso no Início -------------------------------- */
async function loadProgressaoInicio() {
  const secEl = document.getElementById("progressao-fase-section");
  if (!secEl || alunoState.professorId) return;
  if (!alunoState.programaAtivo || typeof getFaseAtual === "undefined") return;

  try {
    const hiSnap = await db
      .ref("historicoTreinos/" + alunoState.uid)
      .once("value");
    const historico = hiSnap.val() || {};
    const total = Object.values(historico).filter((d) => d.completado).length;
    alunoState.treinosCompletos = total;
    alunoState.programaFase = getFaseAtual(total);

    const progresso = getProgressoFase(total);
    const faseInfo = FASES_INFO[progresso.fase];

    secEl.classList.remove("hidden");

    const badgeEl = document.getElementById("fase-badge");
    if (badgeEl) {
      badgeEl.textContent = "Fase " + progresso.fase + " — " + faseInfo.nome;
      badgeEl.style.cssText +=
        ";background:" +
        faseInfo.cor +
        "22;color:" +
        faseInfo.cor +
        ";border-color:" +
        faseInfo.cor +
        "55;";
    }

    const card = document.getElementById("progressao-fase-card");
    if (!card) return;

    if (progresso.proxima) {
      const pct = progresso.pct;
      const proxInfo = FASES_INFO[progresso.proxima];
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="font-size:1.9rem;line-height:1;">${faseInfo.icone}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:0.93rem;">${sanitize(faseInfo.desc)}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${total} treino${total !== 1 ? "s" : ""} completo${total !== 1 ? "s" : ""}</div>
          </div>
          <div style="text-align:right;white-space:nowrap;">
            <div style="font-size:0.72rem;color:var(--text-muted);">Próxima fase</div>
            <div style="font-weight:700;font-size:0.9rem;color:${proxInfo.cor};">${progresso.faltam} treino${progresso.faltam !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div class="progresso-fase-track">
          <div class="progresso-fase-fill" style="width:${pct}%;background:${faseInfo.cor};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.73rem;color:var(--text-muted);">
          <span>${faseInfo.icone} Fase ${progresso.fase}</span>
          <span>${proxInfo.icone} Fase ${progresso.proxima} em ${FASE_THRESHOLDS[progresso.proxima - 1]} treinos</span>
        </div>`;
    } else {
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:2.2rem;line-height:1;">⚡</span>
          <div>
            <div style="font-weight:700;font-size:0.95rem;">Nível Máximo Alcançado!</div>
            <div style="font-size:0.82rem;color:var(--text-muted);">${total} treinos — você é elite! 👑</div>
          </div>
        </div>`;
    }
  } catch (e) {
    console.error("[Aluno] Erro ao carregar progressão:", e);
  }
}

/* -- Conquistas no Perfil ----------------------------------------
   Conquistas são cumulativas: uma vez desbloqueadas, ficam para sempre.
   Por isso unimos "ganhas agora" (baseado em total/streak/fase atuais)
   com "ganhas no passado" (lidas de conquistas/{uid}/ no Firebase).
   ---------------------------------------------------------------- */
function _renderGridConquistas(ganhas) {
  const grid = document.getElementById("conquistas-grid");
  if (!grid) return;
  grid.innerHTML = CONQUISTAS_DEFS.map((c) => {
    const earned = ganhas.includes(c.id);
    return `
      <div class="conquista-item ${earned ? "earned" : "locked"}" title="${sanitize(c.desc)}">
        <span class="conquista-emoji">${earned ? c.emoji : "🔒"}</span>
        <span class="conquista-nome">${sanitize(c.nome)}</span>
      </div>`;
  }).join("");
}

async function renderConquistasPerfil() {
  const card = document.getElementById("conquistas-card");
  if (!card) return;
  if (typeof CONQUISTAS_DEFS === "undefined") {
    card.style.display = "none";
    return;
  }

  card.style.display = "";

  // Render imediato com todas locked — evita ficar preso no spinner
  // se o Firebase demorar/falhar ou se o usuário não tiver UID ainda.
  _renderGridConquistas([]);
  const totalEl = document.getElementById("conquistas-total");
  if (totalEl) totalEl.textContent = "0/" + CONQUISTAS_DEFS.length;

  if (!alunoState.uid) return;

  try {
    const [hiSnap, conquSnap] = await Promise.all([
      db.ref("historicoTreinos/" + alunoState.uid).once("value"),
      db.ref("conquistas/" + alunoState.uid).once("value"),
    ]);
    const historico = hiSnap.val() || {};
    const total = Object.values(historico).filter((d) => d.completado).length;
    const streak = await calcularEExibirStreak();
    const fase = typeof getFaseAtual === "function" ? getFaseAtual(total) : 1;
    const ganhasAgora = getConquistasGanhas(total, streak, fase);
    const ganhasNoPassado = Object.keys(conquSnap.val() || {});
    // União: conquista uma vez desbloqueada não se perde (mesmo se streak quebrar)
    const ganhas = Array.from(new Set([...ganhasAgora, ...ganhasNoPassado]));

    // Persiste qualquer conquista nova detectada agora que ainda não foi gravada
    const novasParaSalvar = ganhasAgora.filter(
      (id) => !ganhasNoPassado.includes(id),
    );
    if (novasParaSalvar.length) {
      const updates = {};
      novasParaSalvar.forEach((id) => {
        const def = CONQUISTAS_DEFS.find((c) => c.id === id);
        if (def) {
          updates["conquistas/" + alunoState.uid + "/" + id] = {
            nome: def.nome,
            data: Date.now(),
          };
        }
      });
      db.ref()
        .update(updates)
        .catch(() => {});
    }

    if (totalEl)
      totalEl.textContent = ganhas.length + "/" + CONQUISTAS_DEFS.length;
    _renderGridConquistas(ganhas);
  } catch (e) {
    console.error("[Aluno] Erro ao carregar conquistas:", e);
    // Mantém o grid com todas locked (já renderizado acima) — sem spinner preso.
  }
}

/* -- Verificar Progressão após Finalizar Treino ------------------ */
async function verificarProgressaoAposTreino() {
  if (!alunoState.uid) return;
  if (typeof CONQUISTAS_DEFS === "undefined") return;

  // Conquistas valem para TODOS os alunos. Progressão de fase só p/ independentes.
  const temProgressaoFase =
    !!alunoState.programaAtivo &&
    !alunoState.professorId &&
    typeof getFaseAtual === "function";

  try {
    const [hiSnap, conquSnap] = await Promise.all([
      db.ref("historicoTreinos/" + alunoState.uid).once("value"),
      db.ref("conquistas/" + alunoState.uid).once("value"),
    ]);
    const historico = hiSnap.val() || {};
    const total = Object.values(historico).filter((d) => d.completado).length;
    const streak = await calcularEExibirStreak();
    const novaFase = temProgressaoFase ? getFaseAtual(total) : 1;
    const conquistasSalvas = Object.keys(conquSnap.val() || {});
    const novas = getNovasConquistas(total, streak, novaFase, conquistasSalvas);
    const faseMudou =
      temProgressaoFase && novaFase > (alunoState.programaFase || 1);

    // Atualiza state
    alunoState.treinosCompletos = total;
    if (temProgressaoFase) alunoState.programaFase = novaFase;

    // Avança treinoAtual para a próxima letra do programa (só independentes)
    if (
      temProgressaoFase &&
      alunoState.programaAtivo === "ia-custom" &&
      alunoState.treinoGerado
    ) {
      // IA: cicla circularmente pelas letras disponíveis
      const letrasIA = Object.keys(
        alunoState.treinoGerado.treinos || {},
      ).sort();
      if (letrasIA.length > 1) {
        const letraHojeSnap = await db
          .ref("historicoTreinos/" + alunoState.uid + "/" + getDateKey())
          .once("value");
        const letraHoje =
          (letraHojeSnap.val() || {}).letra || alunoState.treinoAtual;
        const idxIA = letrasIA.indexOf(letraHoje);
        const proxIA =
          idxIA !== -1 ? letrasIA[(idxIA + 1) % letrasIA.length] : letrasIA[0];
        alunoState.treinoAtual = proxIA;
        await db.ref("alunos/" + alunoState.uid + "/treinoAtual").set(proxIA);
      }
    } else if (
      temProgressaoFase &&
      alunoState.programaAtivo !== "ia-custom" &&
      typeof proximaLetraPrograma !== "undefined"
    ) {
      const hiHojeSnap = await db
        .ref("historicoTreinos/" + alunoState.uid + "/" + getDateKey())
        .once("value");
      const letraHoje =
        (hiHojeSnap.val() || {}).letra || alunoState.treinoAtual;
      const proxLetra = proximaLetraPrograma(
        alunoState.programaAtivo,
        letraHoje,
      );
      if (proxLetra !== letraHoje) {
        await db
          .ref("alunos/" + alunoState.uid + "/treinoAtual")
          .set(proxLetra);
        alunoState.treinoAtual = proxLetra;
      }
    }

    // Persiste fase, treinos e novas conquistas no Firebase
    const updates = {
      ["users/" + alunoState.uid + "/treinosCompletos"]: total,
      ["alunos/" + alunoState.uid + "/treinosCompletos"]: total,
    };
    if (temProgressaoFase) {
      updates["users/" + alunoState.uid + "/programaFase"] = novaFase;
      updates["alunos/" + alunoState.uid + "/programaFase"] = novaFase;
    }
    novas.forEach((c) => {
      updates["conquistas/" + alunoState.uid + "/" + c.id] = {
        nome: c.nome,
        data: Date.now(),
      };
    });
    await db.ref().update(updates);

    // Celebração de fase desbloqueada (prioridade máxima)
    if (faseMudou) {
      fecharCelebracao();
      setTimeout(() => mostrarFaseDesbloqueada(novaFase), 400);
      return;
    }

    // Toast para novas conquistas (exceto as de fase, que têm modal próprio)
    const conquistasNaoFase = novas.filter(
      (c) => c.id !== "fase-2" && c.id !== "fase-3",
    );
    conquistasNaoFase.forEach((c, i) => {
      setTimeout(
        () =>
          showToast(
            c.emoji + " Conquista desbloqueada: " + c.nome + "!",
            "success",
            4000,
          ),
        i * 1200,
      );
    });
  } catch (e) {
    console.error("[Aluno] Erro ao verificar progressão:", e);
  }
}

/* -- Modal Fase Desbloqueada ------------------------------------- */
function mostrarFaseDesbloqueada(fase) {
  const modal = document.getElementById("modal-fase-desbloqueada");
  if (!modal || typeof FASES_INFO === "undefined") return;
  const info = FASES_INFO[fase];
  if (!info) return;

  const iconeEl = document.getElementById("fase-unlock-icone");
  const badgeEl = document.getElementById("fase-unlock-badge");
  const tituloEl = document.getElementById("fase-unlock-titulo");
  const descEl = document.getElementById("fase-unlock-desc");
  const infoEl = document.getElementById("fase-unlock-info");

  if (iconeEl) iconeEl.textContent = info.icone;
  if (badgeEl) {
    badgeEl.textContent = "Fase " + fase + " — " + info.nome;
    badgeEl.style.cssText +=
      ";background:" +
      info.cor +
      "22;color:" +
      info.cor +
      ";border-color:" +
      info.cor +
      "55;";
  }
  if (tituloEl) tituloEl.textContent = "Fase " + fase + " Desbloqueada! 🎉";
  if (descEl) descEl.textContent = info.desc + " — seu treino evoluiu!";

  if (infoEl) {
    const mod = typeof FASE_MODS !== "undefined" ? FASE_MODS[fase] : null;
    if (mod) {
      infoEl.innerHTML = `
        <div class="fase-unlock-changes">
          <div class="fase-change-item"><span class="fase-change-icon">➕</span><span>${mod.seriesBonus} série extra por exercício</span></div>
          <div class="fase-change-item"><span class="fase-change-icon">⏱️</span><span>${mod.restReducao}s a menos de descanso entre séries</span></div>
          <div class="fase-change-item"><span class="fase-change-icon">💪</span><span>Exercício bônus desbloqueado por dia de treino</span></div>
        </div>`;
    }
  }
  modal.classList.add("open");
}

function fecharFaseDesbloqueada() {
  const modal = document.getElementById("modal-fase-desbloqueada");
  if (modal) modal.classList.remove("open");
  // Recarrega a seção de treino para mostrar os novos exercícios
  alunoNavigate("treino");
}
