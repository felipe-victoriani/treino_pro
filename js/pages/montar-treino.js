/* ============================================================
   TREINO PRO - Montar Treino
   Coleta preferências e gera plano personalizado localmente
   (sem dependência de APIs externas)
   ============================================================ */

const NIVEL_LABELS = {
  INICIANTE: { label: "Iniciante", icon: "🌱" },
  INTERMEDIARIO: { label: "Intermediário", icon: "💪" },
  AVANCADO: { label: "Experiente", icon: "🔥" },
};

/* ---------- Auth guard ---------- */
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const snap = await db.ref("alunos/" + user.uid).once("value");
  const userData = snap.val() || {};

  // Se já tem plano, manda direto para o dashboard
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

/* ---------- Gerar treino (gerador local) ---------- */
async function gerarTreino(user, nivel) {
  const objetivo = document.getElementById("objetivo-val").value;
  const dias = parseInt(document.getElementById("dias-val").value, 10);
  const equipamentos = document.getElementById("equip-val").value;

  /* Mostrar loading */
  document.getElementById("form-state").style.display = "none";
  const loadingEl = document.getElementById("loading-state");
  loadingEl.classList.add("active");
  animateLoadingSteps();

  /* Delay artificial para que a animação de carregamento seja exibida */
  await new Promise((resolve) => setTimeout(resolve, 3500));

  try {
    const planData = gerarPlanoLocal(nivel, objetivo, dias, equipamentos);
    loadingEl.classList.remove("active");
    mostrarPreview(planData, user, nivel, objetivo, dias, equipamentos);
  } catch (err) {
    loadingEl.classList.remove("active");
    document.getElementById("form-state").style.display = "";
    console.error("[MontarTreino]", err);
    if (typeof showToast === "function") {
      showToast("Erro ao gerar treino. Tente novamente.", "error", 5000);
    } else {
      alert("Erro ao gerar treino:\n" + err.message);
    }
  }
}

/* ---------- Loading animation ---------- */
function animateLoadingSteps() {
  const steps = document.querySelectorAll("#loading-steps .loading-step");
  steps.forEach((s) => s.classList.remove("current"));
  if (steps[0]) steps[0].classList.add("current");
  let i = 0;
  const iv = setInterval(() => {
    if (i < steps.length - 1) {
      steps[i].classList.remove("current");
      i++;
      steps[i].classList.add("current");
    } else {
      clearInterval(iv);
    }
  }, 1200);
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

/* ---------- Prompt builder (removido — gerador local não usa prompt) ----------
function buildPrompt(nivelStr, objetivo, dias, equipamentos) {
  return `Você é um personal trainer expert em musculação. Sua tarefa é gerar um plano de treino personalizado em formato JSON estruturado, com base no nível de experiência do aluno.

## REGRAS DE DIVISÃO POR NÍVEL:

### INICIANTE (0–6 meses de treino)
- Divisão: A/B ou A/B/C
- Foco: aprender o movimento, full body ou push-pull-legs simples
- Séries: 3 séries por exercício
- Repetições: 10–15 reps
- Exercícios por treino: 5–7
- Descanso: 60–90s

### INTERMEDIÁRIO (6 meses–2 anos)
- Divisão: A/B/C/D (Upper/Lower ou Push/Pull/Legs/Full)
- Foco: hipertrofia com mais volume
- Séries: 3–4 séries por exercício
- Repetições: 8–12 reps
- Exercícios por treino: 6–8
- Descanso: 60–90s

### AVANÇADO (2+ anos)
- Divisão: A/B/C/D/E ou A/B/C/D/E/F (por grupo muscular isolado)
- Foco: volume alto, técnicas avançadas (drop set, bi-set, etc.)
- Séries: 4–5 séries por exercício
- Repetições: 6–12 reps (variado)
- Exercícios por treino: 7–10
- Descanso: 45–90s

---

## ENTRADA DO USUÁRIO:
- Nível: ${nivelStr}
- Objetivo: ${objetivo}
- Dias disponíveis por semana: ${dias}
- Equipamentos: ${equipamentos}

---

## SAÍDA ESPERADA (JSON):

{
  "nivel": "...",
  "objetivo": "...",
  "divisao": "A/B/C",
  "dias_por_semana": ${dias},
  "treinos": [
    {
      "treino": "A",
      "nome": "Peito e Tríceps",
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "series": 4,
          "repeticoes": "10–12",
          "descanso": "60s",
          "observacao": "Mantenha os pés no chão e escápulas retraídas"
        }
      ]
    }
  ]
}

---

## INSTRUÇÕES ADICIONAIS:
- Sempre gere exercícios reais e apropriados para o nível
- Para INICIANTE: priorize exercícios compostos e máquinas
- Para INTERMEDIÁRIO: misture compostos e isolados
- Para AVANÇADO: inclua variações técnicas (unilaterais, cabos, técnicas de intensidade)
- Adapte os exercícios ao equipamento disponível
- Inclua o campo "observacao" com dica de execução para cada exercício
- Não repita o mesmo grupo muscular em dias consecutivos
- O número de treinos (A, B, C...) DEVE ser exatamente ${dias}, correspondendo aos dias por semana informados
- Retorne APENAS o JSON, sem explicações adicionais`;
}
// ------------------------------------------------------------ */

/* ---------- Helper: sanitize para HTML ---------- */
function safe(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
