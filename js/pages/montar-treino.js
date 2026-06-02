/* ============================================================
   TREINO PRO - Montar Treino
   Gera plano semanal personalizado usando IA (Claude via Cloud Function).
   Exclusivo para alunos SEM vínculo com professor (treino autônomo).
   ============================================================ */

const NIVEL_LABELS = {
  INICIANTE: { label: "Iniciante", icon: "🌱" },
  INTERMEDIARIO: { label: "Intermediário", icon: "💪" },
  AVANCADO: { label: "Experiente", icon: "🔥" },
};

/* Divisão de treinos por número de dias → grupo muscular principal */
const SPLITS_POR_DIA = {
  2: [
    { treino: "A", nome: "Superior", musculo: "Peitoral" },
    { treino: "B", nome: "Inferior", musculo: "Pernas" },
  ],
  3: [
    { treino: "A", nome: "Peito + Tríceps", musculo: "Peitoral" },
    { treino: "B", nome: "Costas + Bíceps", musculo: "Costas" },
    { treino: "C", nome: "Pernas", musculo: "Pernas" },
  ],
  4: [
    { treino: "A", nome: "Peito", musculo: "Peitoral" },
    { treino: "B", nome: "Costas", musculo: "Costas" },
    { treino: "C", nome: "Pernas", musculo: "Pernas" },
    { treino: "D", nome: "Ombros + Braços", musculo: "Ombros" },
  ],
  5: [
    { treino: "A", nome: "Peito", musculo: "Peitoral" },
    { treino: "B", nome: "Costas", musculo: "Costas" },
    { treino: "C", nome: "Pernas", musculo: "Pernas" },
    { treino: "D", nome: "Ombros", musculo: "Ombros" },
    { treino: "E", nome: "Braços", musculo: "Tríceps" },
  ],
  6: [
    { treino: "A", nome: "Peito", musculo: "Peitoral" },
    { treino: "B", nome: "Costas", musculo: "Costas" },
    { treino: "C", nome: "Pernas", musculo: "Pernas" },
    { treino: "D", nome: "Ombros", musculo: "Ombros" },
    { treino: "E", nome: "Tríceps", musculo: "Tríceps" },
    { treino: "F", nome: "Bíceps", musculo: "Bíceps" },
  ],
};

/* ---------- Auth guard ---------- */
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const snap = await db.ref("alunos/" + user.uid).once("value");
  const userData = snap.val() || {};

  // Usuário vinculado a professor → não usa geração IA autônoma
  if (userData.professorId) {
    window.location.replace("aluno.html");
    return;
  }

  // Já tem plano ativo → vai direto pro dashboard
  if (userData.programaAtivo) {
    window.location.replace("aluno.html");
    return;
  }

  const nivel = userData.nivel || "INICIANTE";
  const info = NIVEL_LABELS[nivel] || NIVEL_LABELS.INICIANTE;
  const badgeEl = document.getElementById("nivel-badge");
  if (badgeEl) badgeEl.textContent = `${info.icon} ${info.label}`;

  initPage(user, nivel);
});

/* ---------- Init page ---------- */
function initPage(user, nivel) {
  /* Option cards (objetivo + equipamentos) */
  document.querySelectorAll(".opt-card").forEach((card) => {
    card.addEventListener("click", () => {
      const group = card.dataset.group;
      document
        .querySelectorAll(`.opt-card[data-group="${group}"]`)
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const inputId = group === "objetivo" ? "objetivo-val" : "equip-val";
      document.getElementById(inputId).value = card.dataset.value;
    });
  });

  /* Dias selector */
  let dias = 3;
  const diasDisplay = document.getElementById("dias-display");
  const diasInput = document.getElementById("dias-val");

  document.getElementById("dias-minus").addEventListener("click", () => {
    if (dias > 2) {
      dias--;
      diasDisplay.textContent = dias;
      diasInput.value = dias;
    }
  });
  document.getElementById("dias-plus").addEventListener("click", () => {
    if (dias < 6) {
      dias++;
      diasDisplay.textContent = dias;
      diasInput.value = dias;
    }
  });

  /* Gerar button */
  document
    .getElementById("btn-gerar")
    .addEventListener("click", () => gerarTreino(user, nivel));
}

/* ---------- Gerar treino com IA ---------- */
async function gerarTreino(user, nivel) {
  const objetivo = document.getElementById("objetivo-val").value;
  const dias = parseInt(document.getElementById("dias-val").value, 10);
  const equipamentos = document.getElementById("equip-val").value;

  /* Validação antes de abrir o loading */
  if (!objetivo) {
    if (typeof showToast === "function")
      showToast("Selecione um objetivo antes de continuar.", "error", 4000);
    else alert("Selecione um objetivo antes de continuar.");
    return;
  }
  if (!equipamentos) {
    if (typeof showToast === "function")
      showToast("Selecione o equipamento disponível.", "error", 4000);
    else alert("Selecione o equipamento disponível.");
    return;
  }

  const split = SPLITS_POR_DIA[dias] || SPLITS_POR_DIA[3];

  /* Ocultar form e mostrar loading */
  document.getElementById("form-state").style.display = "none";
  const loadingEl = document.getElementById("loading-state");
  loadingEl.classList.add("active");

  /* Atualizar título do loading */
  const titleEl = loadingEl.querySelector(".loading-title");
  if (titleEl) {
    titleEl.textContent =
      `Gerando ${split.length} treinos com IA… ` +
      `(pode levar até ${split.length * 12}s)`;
  }

  /* Montar steps dinâmicos baseados no split real */
  const stepLabels = [
    "🤖 Analisando seu perfil...",
    ...split.map((s) => `🏋️ Gerando Treino ${s.treino} — ${s.nome}...`),
    "✅ Finalizando seu plano...",
  ];
  const stepsEl = document.getElementById("loading-steps");
  stepsEl.innerHTML = stepLabels
    .map(
      (label, i) =>
        `<p class="loading-step${i === 0 ? " current" : ""}" id="ls-${i}">${label}</p>`,
    )
    .join("");

  function setLoadingStep(i) {
    stepsEl
      .querySelectorAll(".loading-step")
      .forEach((el) => el.classList.remove("current"));
    const el = document.getElementById(`ls-${i}`);
    if (el) el.classList.add("current");
  }

  try {
    setLoadingStep(0);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const treinos = [];

    for (let i = 0; i < split.length; i++) {
      const day = split[i];
      setLoadingStep(i + 1);

      const treinoIA = await TreinoIAService.gerar({
        uid: user.uid,
        nivel,
        objetivo,
        grupoMuscular: day.musculo,
        equipamentos,
      });

      /* Normaliza para o formato do app */
      treinos.push({
        treino: day.treino,
        nome: day.nome,
        exercicios: (treinoIA.exercicios || []).map((ex) => ({
          nome: ex.nome,
          series: ex.series,
          repeticoes: ex.repeticoes,
          descanso: ex.descanso_segundos ? `${ex.descanso_segundos}s` : "60s",
          observacao: ex.dica_execucao || "",
        })),
      });
    }

    setLoadingStep(stepLabels.length - 1);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const planData = {
      nivel: NIVEL_LABELS[nivel]?.label || nivel,
      objetivo,
      divisao: split.map((s) => s.treino).join("/"),
      dias_por_semana: dias,
      treinos,
    };

    loadingEl.classList.remove("active");
    mostrarPreview(planData, user, nivel, objetivo, dias, equipamentos);
  } catch (err) {
    loadingEl.classList.remove("active");
    document.getElementById("form-state").style.display = "";
    console.error("[MontarTreino]", err);
    if (typeof showToast === "function") {
      showToast("Erro ao gerar treino: " + err.message, "error", 7000);
    } else {
      alert("Erro ao gerar treino:\n" + err.message);
    }
  }
}

/* ---------- Preview result ---------- */
function mostrarPreview(planData, user, nivel, objetivo, dias, equipamentos) {
  const resultEl = document.getElementById("result-state");
  resultEl.classList.add("active");

  /* Summary card */
  const summaryEl = document.getElementById("plan-summary");
  summaryEl.innerHTML = `
    <h3>🤖 Seu Plano Personalizado</h3>
    <div class="plan-tags">
      <span class="plan-tag">${safe(planData.nivel || nivel)}</span>
      <span class="plan-tag">🎯 ${safe(planData.objetivo || objetivo)}</span>
      <span class="plan-tag">📅 ${planData.dias_por_semana || dias}x / semana</span>
      <span class="plan-tag">Divisão ${safe(planData.divisao || "")}</span>
    </div>
  `;

  /* Treinos accordion */
  const treinosEl = document.getElementById("treinos-preview");
  const treinos = planData.treinos || [];

  treinosEl.innerHTML = treinos
    .map(
      (t) => `
      <div class="treino-card">
        <div class="treino-card-header"
             onclick="this.nextElementSibling.classList.toggle('open')">
          <strong>Treino ${safe(t.treino)} — ${safe(t.nome)}</strong>
          <span class="treino-badge">${t.exercicios?.length || 0} exerc.</span>
        </div>
        <div class="treino-card-body">
          ${(t.exercicios || [])
            .map(
              (ex) => `
            <div class="ex-row">
              <strong>${safe(ex.nome)}</strong>
              <span>${ex.series}x ${safe(ex.repeticoes)} · ${safe(ex.descanso)}</span>
              ${ex.observacao ? `<span style="display:block;font-size:.75rem;color:#64748b;margin-top:2px">💡 ${safe(ex.observacao)}</span>` : ""}
            </div>`,
            )
            .join("")}
        </div>
      </div>`,
    )
    .join("");

  /* Salvar ao clicar */
  document
    .getElementById("btn-comecar")
    .addEventListener("click", () =>
      salvarESair(planData, user, nivel, equipamentos),
    );
}

/* ---------- Salvar no Firebase e redirecionar ---------- */
async function salvarESair(planData, user, nivel, equipamentos) {
  const btn = document.getElementById("btn-comecar");
  btn.textContent = "Salvando...";
  btn.disabled = true;

  try {
    /* Converter array de treinos → objeto Firebase-friendly */
    const treinosObj = {};
    (planData.treinos || []).forEach((t) => {
      treinosObj[t.treino] = {
        nome: t.nome || "Treino " + t.treino,
        exercicios: t.exercicios || [],
      };
    });

    const treinoGerado = {
      nivel: planData.nivel || nivel,
      objetivo: planData.objetivo || "",
      divisao: planData.divisao || "",
      dias_por_semana: planData.dias_por_semana || 3,
      equipamentos: equipamentos,
      treinos: treinosObj,
      geradoEm: Date.now(),
      geradoPor: "ia",
    };

    const updates = {};
    updates[`alunos/${user.uid}/treinoGerado`] = treinoGerado;
    updates[`users/${user.uid}/treinoGerado`] = treinoGerado;
    updates[`alunos/${user.uid}/programaAtivo`] = "ia-custom";
    updates[`users/${user.uid}/programaAtivo`] = "ia-custom";

    await db.ref().update(updates);
    window.location.replace("aluno.html");
  } catch (err) {
    btn.textContent = "🚀 Começar a Treinar!";
    btn.disabled = false;
    console.error("[MontarTreino] Erro ao salvar:", err);
    alert("Erro ao salvar o plano. Tente novamente.");
  }
}

/* ---------- Helper: sanitize para HTML ---------- */
function safe(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
