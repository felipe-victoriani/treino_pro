/* ============================================================
   TREINO PRO - Dietas
   Dieta semanal: professor edita por dia, aluno visualiza
   Estrutura Firebase: dietas/{alunoId}/dias/{dia}/refeicoes/{id}
   ============================================================ */

const DIAS_SEMANA = [
  { key: "segunda", label: "Seg", full: "Segunda-feira" },
  { key: "terca", label: "Ter", full: "Terça-feira" },
  { key: "quarta", label: "Qua", full: "Quarta-feira" },
  { key: "quinta", label: "Qui", full: "Quinta-feira" },
  { key: "sexta", label: "Sex", full: "Sexta-feira" },
  { key: "sabado", label: "Sáb", full: "Sábado" },
  { key: "domingo", label: "Dom", full: "Domingo" },
];

// Mapeia JS Date.getDay() → key
const DIA_INDEX = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

let dietaAlunoAtual = null;
let dietaDiaSelecionado = "segunda";
let dietaRefeicaoCount = 0;

/* -- Professor: Editor de Dieta ----------------------------- */

async function loadDietaProfessor(alunoId) {
  dietaAlunoAtual = alunoId;

  // Preenche metadados (titulo/objetivo/obs) e carrega quais dias têm dados
  let diasComDados = {};
  try {
    const snap = await db.ref(`dietas/${alunoId}`).once("value");
    const data = snap.val() || {};
    const el = document.getElementById("diet-titulo");
    if (el) el.value = sanitize(data.titulo || "");
    const elObj = document.getElementById("diet-objetivo");
    if (elObj) elObj.value = sanitize(data.objetivo || "");
    const elObs = document.getElementById("diet-obs");
    if (elObs) elObs.value = sanitize(data.obs || "");
    // Mapeia quais dias têm pelo menos uma refeição salva
    if (data.dias) {
      DIAS_SEMANA.forEach((d) => {
        const refs = data.dias[d.key]?.refeicoes;
        diasComDados[d.key] = !!(refs && Object.keys(refs).length > 0);
      });
    }
  } catch (_) {}

  // Monta as abas dos dias (passando quais têm dados)
  _renderDiaTabs(diasComDados);

  // Carrega o dia padrão (hoje ou segunda)
  const hoje = DIA_INDEX[new Date().getDay()];
  dietaDiaSelecionado = hoje;
  _activateDiaTab(hoje);
  await _loadRefeicoesDia(alunoId, hoje);
}

function _renderDiaTabs(diasComDados = {}) {
  const container = document.getElementById("diet-dias-tabs");
  if (!container) return;
  container.innerHTML = DIAS_SEMANA.map((d) => {
    const classes = ["diet-dia-btn"];
    if (d.key === dietaDiaSelecionado) classes.push("active");
    if (diasComDados[d.key]) classes.push("has-data");
    return `<button class="${classes.join(" ")}" data-dia="${d.key}">${d.label}</button>`;
  }).join("");
  container.querySelectorAll(".diet-dia-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      dietaDiaSelecionado = btn.dataset.dia;
      _activateDiaTab(dietaDiaSelecionado);
      await _loadRefeicoesDia(dietaAlunoAtual, dietaDiaSelecionado);
    });
  });
}

function _activateDiaTab(dia) {
  document.querySelectorAll(".diet-dia-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.dia === dia);
  });
  const fullLabel = DIAS_SEMANA.find((d) => d.key === dia)?.full || dia;
  const el = document.getElementById("diet-dia-label");
  if (el) el.textContent = fullLabel;
}

async function _loadRefeicoesDia(alunoId, dia) {
  const listEl = document.getElementById("refeicoes-list");
  if (!listEl) return;
  dietaRefeicaoCount = 0;
  listEl.innerHTML =
    '<div class="loading-inline"><div class="spinner-sm"></div><p>Carregando...</p></div>';
  try {
    const snap = await db
      .ref(`dietas/${alunoId}/dias/${dia}/refeicoes`)
      .once("value");
    const data = snap.val();
    listEl.innerHTML = "";
    if (data) {
      const refeicoes = Object.entries(data)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
      refeicoes.forEach((r) => adicionarRefeicaoCard(r));
    }
    if (dietaRefeicaoCount === 0) {
      listEl.innerHTML = `
        <div class="empty-state" id="empty-refeicoes">
          <p>Nenhuma refeição para este dia.</p>
          <p>Clique em "+ Adicionar refeição" para começar.</p>
        </div>`;
    }
  } catch (e) {
    listEl.innerHTML =
      '<div class="empty-state"><p>Erro ao carregar refeições.</p></div>';
    console.error(e);
  }
}

function adicionarRefeicaoCard(refeicao = null) {
  const listEl = document.getElementById("refeicoes-list");
  if (!listEl) return;
  document.getElementById("empty-refeicoes")?.remove();

  const idx = ++dietaRefeicaoCount;
  const id = refeicao?.id || `ref_${Date.now()}_${idx}`;

  const alimentos = refeicao?.alimentos
    ? Object.entries(refeicao.alimentos)
        .map(
          ([aid, a]) => `
          <div class="alimento-row" data-aid="${sanitize(aid)}">
            <input type="text" class="alimento-nome" placeholder="Alimento (ex: Arroz)"
                   value="${sanitize(a.nome || "")}" />
            <input type="text" class="alimento-qtd" placeholder="Qtd (ex: 100g)"
                   value="${sanitize(a.quantidade || "")}" />
            <button class="btn-icon btn-danger-icon" onclick="removerAlimentoRow(this)" title="Remover">&times;</button>
          </div>`,
        )
        .join("")
    : "";

  const card = document.createElement("div");
  card.className = "refeicao-edit-card";
  card.dataset.id = id;
  card.innerHTML = `
    <div class="refeicao-edit-header">
      <h4>🍽 Refeição ${idx}</h4>
      <button class="btn-icon btn-danger-icon" onclick="removerRefeicaoCard(this)" title="Remover">🗑️</button>
    </div>
    <div class="refeicao-edit-fields">
      <div class="form-group">
        <label>Nome da Refeição</label>
        <input type="text" class="refeicao-nome" placeholder="Ex: Café da Manhã"
               value="${sanitize(refeicao?.nome || "")}" />
      </div>
      <div class="form-group">
        <label>Horário</label>
        <input type="time" class="refeicao-horario" value="${sanitize(refeicao?.horario || "")}" />
      </div>
    </div>
    <div class="alimentos-section">
      <div class="alimentos-header">
        <span>Alimentos</span>
        <button class="btn-sm btn-outline" onclick="adicionarAlimentoRow(this)">+ Alimento</button>
      </div>
      <div class="alimentos-list">${alimentos}</div>
    </div>`;
  listEl.appendChild(card);
}

function removerRefeicaoCard(btn) {
  btn.closest(".refeicao-edit-card")?.remove();
  const listEl = document.getElementById("refeicoes-list");
  if (listEl && !listEl.querySelector(".refeicao-edit-card")) {
    listEl.innerHTML = `
      <div class="empty-state" id="empty-refeicoes">
        <p>Nenhuma refeição para este dia.</p>
        <p>Clique em "+ Adicionar refeição" para começar.</p>
      </div>`;
    dietaRefeicaoCount = 0;
  }
}

function adicionarAlimentoRow(btn) {
  const list = btn
    .closest(".alimentos-section")
    .querySelector(".alimentos-list");
  const row = document.createElement("div");
  row.className = "alimento-row";
  row.innerHTML = `
    <input type="text" class="alimento-nome" placeholder="Alimento (ex: Arroz)" />
    <input type="text" class="alimento-qtd" placeholder="Qtd (ex: 100g)" />
    <button class="btn-icon btn-danger-icon" onclick="removerAlimentoRow(this)" title="Remover">&times;</button>`;
  list.appendChild(row);
}

function removerAlimentoRow(btn) {
  btn.closest(".alimento-row")?.remove();
}

async function salvarDieta() {
  if (!dietaAlunoAtual) {
    showToast("Selecione um aluno", "warning");
    return;
  }

  const titulo = document.getElementById("diet-titulo")?.value.trim() || "";
  const objetivo = document.getElementById("diet-objetivo")?.value.trim() || "";
  const obs = document.getElementById("diet-obs")?.value.trim() || "";

  // Coleta refeições do dia selecionado
  const cards = document.querySelectorAll(".refeicao-edit-card");
  const refeicoes = {};
  cards.forEach((card) => {
    const id =
      card.dataset.id ||
      `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nome = card.querySelector(".refeicao-nome")?.value.trim() || "";
    const horario = card.querySelector(".refeicao-horario")?.value.trim() || "";
    const alimentos = {};
    card.querySelectorAll(".alimento-row").forEach((row) => {
      const alNome = row.querySelector(".alimento-nome")?.value.trim() || "";
      const alQtd = row.querySelector(".alimento-qtd")?.value.trim() || "";
      if (alNome) {
        const aid = `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        alimentos[aid] = { nome: alNome, quantidade: alQtd };
      }
    });
    if (nome || horario || Object.keys(alimentos).length > 0) {
      refeicoes[id] = { nome, horario, alimentos };
    }
  });

  showLoading("Salvando dieta...");
  try {
    // Salva metadados (uma vez) e refeições do dia selecionado
    const updates = {};
    updates[`dietas/${dietaAlunoAtual}/titulo`] = titulo;
    updates[`dietas/${dietaAlunoAtual}/objetivo`] = objetivo;
    updates[`dietas/${dietaAlunoAtual}/obs`] = obs;
    updates[`dietas/${dietaAlunoAtual}/updatedAt`] = Date.now();
    updates[`dietas/${dietaAlunoAtual}/dias/${dietaDiaSelecionado}/refeicoes`] =
      refeicoes;
    await db.ref().update(updates);
    const diaFull =
      DIAS_SEMANA.find((d) => d.key === dietaDiaSelecionado)?.full ||
      dietaDiaSelecionado;
    showToast(`${diaFull} salvo!`, "success");
    // Marca o botão do dia como preenchido (verde) se houver refeições
    const btnDia = document.querySelector(
      `.diet-dia-btn[data-dia="${dietaDiaSelecionado}"]`,
    );
    if (btnDia) {
      if (Object.keys(refeicoes).length > 0) {
        btnDia.classList.add("has-data");
      } else {
        btnDia.classList.remove("has-data");
      }
    }
  } catch (e) {
    console.error("[Dietas] Erro ao salvar:", e.code, e.message, e);
    showToast(
      "Erro ao salvar (" + (e.code || e.message || "desconhecido") + ")",
      "error",
    );
  } finally {
    hideLoading();
  }
}

/* -- Aluno: Visualizador de Dieta --------------------------- */

async function loadDietaAluno(alunoId, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML =
    '<div class="loading-inline"><div class="spinner-sm"></div><p>Carregando dieta...</p></div>';

  try {
    const snap = await db.ref(`dietas/${alunoId}`).once("value");
    const data = snap.val();

    if (!data || !data.dias) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🥗</div>
          <h3>Dieta ainda não configurada</h3>
          <p>Seu professor ainda não cadastrou sua dieta. Aguarde!</p>
        </div>`;
      return;
    }

    // Dia de hoje
    const diaHojeKey = DIA_INDEX[new Date().getDay()];
    const diaHojeFull =
      DIAS_SEMANA.find((d) => d.key === diaHojeKey)?.full || diaHojeKey;

    // Abas dos dias
    const tabsHtml = DIAS_SEMANA.map((d) => {
      const temData = !!(
        data.dias?.[d.key]?.refeicoes &&
        Object.keys(data.dias[d.key].refeicoes).length
      );
      const isHoje = d.key === diaHojeKey;
      return `<button class="diet-dia-btn-aluno${isHoje ? " active" : ""}${temData ? " has-data" : " empty-day"}"
                      data-dia="${d.key}" data-full="${d.full}">${d.label}${isHoje ? '<span class="hoje-badge">hoje</span>' : ""}</button>`;
    }).join("");

    // Metadados
    const metaHtml =
      data.titulo || data.objetivo
        ? `
      <div class="dieta-meta-card">
        ${data.titulo ? `<h2 class="dieta-titulo">${sanitize(data.titulo)}</h2>` : ""}
        ${data.objetivo ? `<p class="dieta-objetivo">🎯 ${sanitize(data.objetivo)}</p>` : ""}
        ${data.obs ? `<p class="dieta-obs">💡 ${sanitize(data.obs)}</p>` : ""}
      </div>`
        : "";

    el.innerHTML = `
      ${metaHtml}
      <div class="diet-dias-tabs-aluno" id="diet-dias-tabs-aluno">${tabsHtml}</div>
      <div class="diet-dia-nome-aluno" id="diet-dia-nome-aluno">${diaHojeFull}</div>
      <div id="aluno-refeicoes-container"></div>`;

    // Renderiza o dia de hoje
    _renderRefeicoesAluno(data.dias, diaHojeKey);

    // Clique nas abas
    el.querySelectorAll(".diet-dia-btn-aluno").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.querySelectorAll(".diet-dia-btn-aluno").forEach((b) =>
          b.classList.remove("active"),
        );
        btn.classList.add("active");
        document.getElementById("diet-dia-nome-aluno").textContent =
          btn.dataset.full;
        _renderRefeicoesAluno(data.dias, btn.dataset.dia);
      });
    });
  } catch (e) {
    el.innerHTML =
      '<div class="empty-state"><h3>Erro ao carregar dieta</h3></div>';
    console.error(e);
  }
}

function _renderRefeicoesAluno(dias, diaKey) {
  const container = document.getElementById("aluno-refeicoes-container");
  if (!container) return;
  const refeicoesDia = dias?.[diaKey]?.refeicoes;
  if (!refeicoesDia || Object.keys(refeicoesDia).length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top:24px">
        <div class="empty-state-icon">🍽</div>
        <p>Sem refeições cadastradas para este dia.</p>
      </div>`;
    return;
  }
  const refeicoes = Object.values(refeicoesDia).sort((a, b) =>
    (a.horario || "").localeCompare(b.horario || ""),
  );
  container.innerHTML = refeicoes
    .map((r) => {
      const alimentosHtml = r.alimentos
        ? Object.values(r.alimentos)
            .map(
              (a) => `
          <div class="alimento-item">
            <span class="alimento-nome-view">${sanitize(a.nome || "")}</span>
            <span class="alimento-qtd-view">${sanitize(a.quantidade || "")}</span>
          </div>`,
            )
            .join("")
        : '<p class="no-foods">Sem alimentos registrados</p>';
      return `
      <div class="refeicao-card-aluno">
        <div class="refeicao-card-header">
          <span class="refeicao-card-nome">🍽 ${sanitize(r.nome || "Refeição")}</span>
          ${r.horario ? `<span class="refeicao-card-hora">🕐 ${sanitize(r.horario)}</span>` : ""}
        </div>
        <div class="refeicao-card-alimentos">${alimentosHtml}</div>
      </div>`;
    })
    .join("");
}
