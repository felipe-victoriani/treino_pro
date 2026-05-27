/* ============================================================
   TREINO PRO — Seletor de Programas Pré-Definidos
   Permite ao usuário escolher seu programa de treino
   sem necessidade de professor.
   ============================================================ */

/* ── Estado ─────────────────────────────────────────────── */
let programaSelecionadoId = null;
let filtroAtivo = "todos";
let programasExibidos = [];

/* ── Inicialização ──────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticação
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Verificar se o usuário já tem um programa selecionado
    const snap = await db
      .ref(`usuarios/${user.uid}/programaAtivo`)
      .once("value");

    const programaExistente = snap.val();
    if (programaExistente) {
      // Se já tem programa, vai direto para o dashboard
      window.location.href = "aluno.html";
      return;
    }

    // Inicializa a interface
    renderProgramas();
    initFiltros();
    initBotaoConfirmar(user);
  });
});

/* ── Render dos cards de programa ──────────────────────── */
function renderProgramas(filtro = "todos") {
  const grid = document.getElementById("programas-grid");

  // Filtragem
  programasExibidos = PROGRAMAS_PREDEFINIDOS.filter((p) => {
    switch (filtro) {
      case "iniciante":
        return p.nivel === "iniciante";
      case "hipertrofia":
        return p.objetivo === "hipertrofia";
      case "emagrecimento":
        return p.objetivo === "emagrecimento";
      case "feminino":
        return p.sexo === "feminino";
      case "3x":
        return p.frequencia === 3;
      case "4x":
        return p.frequencia === 4;
      default:
        return true;
    }
  });

  if (!programasExibidos.length) {
    grid.innerHTML = `
      <div class="empty-filter">
        <h3>Nenhum programa encontrado</h3>
        <p>Tente outro filtro ou selecione "Todos".</p>
      </div>`;
    return;
  }

  grid.innerHTML = programasExibidos.map((p) => renderCardPrograma(p)).join("");

  // Eventos dos cards
  grid.querySelectorAll(".programa-card").forEach((card) => {
    const id = card.dataset.id;

    // Clique no card = selecionar
    card.addEventListener("click", (e) => {
      // Se clicou no botão "Ver detalhes", não selecionar
      if (e.target.closest(".btn-ver-detalhes")) return;
      selecionarPrograma(id);
    });

    // Botão "Ver detalhes"
    const btnDetalhes = card.querySelector(".btn-ver-detalhes");
    if (btnDetalhes) {
      btnDetalhes.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirDetalhes(id);
      });
    }
  });
}

/* ── Render de um card individual ──────────────────────── */
function renderCardPrograma(programa) {
  const treinos = Object.entries(programa.treinos);
  const objetivoClass = `objetivo-${programa.objetivo}`;
  const nivelLabel =
    programa.nivel === "iniciante" ? "Iniciante" : "Intermediário";
  const objetivoLabel =
    {
      hipertrofia: "💪 Hipertrofia",
      emagrecimento: "🔥 Emagrecimento",
      condicionamento: "⚡ Condicionamento",
    }[programa.objetivo] || programa.objetivo;

  const treinosPills = treinos
    .map(
      ([letra, t]) => `
      <div class="treino-pill">
        <span class="treino-pill-letra">${sanitize(letra)}</span>
        ${sanitize(t.icone)} ${sanitize(t.foco)}
      </div>`,
    )
    .join("");

  const badgeHtml = programa.destaque
    ? `<span class="programa-card-badge">⭐ Popular</span>`
    : "";

  const selecionado =
    programaSelecionadoId === programa.id ? " selecionado" : "";

  return `
    <div class="programa-card${selecionado}" data-id="${sanitize(programa.id)}" role="button" tabindex="0" aria-label="Selecionar ${sanitize(programa.nome)}">
      ${badgeHtml}
      <div class="programa-card-header">
        <div class="programa-card-icone">${sanitize(treinos[0][1].icone)}</div>
        <div class="programa-card-titulo">
          <h3>${sanitize(programa.nome)}</h3>
          <p>${sanitize(programa.descricao)}</p>
        </div>
      </div>
      <div class="programa-card-meta">
        <span class="meta-tag">${sanitize(nivelLabel)}</span>
        <span class="meta-tag ${objetivoClass}">${sanitize(objetivoLabel)}</span>
        <span class="meta-tag">${programa.frequencia}x / semana</span>
        <span class="meta-tag">${programa.duracao} semanas</span>
      </div>
      <div class="programa-card-treinos">
        ${treinosPills}
      </div>
      <button class="btn-ver-detalhes" style="
        margin-top: 14px;
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid var(--border-blue);
        border-radius: var(--radius-md);
        color: var(--blue-400);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(37,99,235,0.1)'"
         onmouseout="this.style.background='transparent'">
        Ver exercícios →
      </button>
    </div>`;
}

/* ── Selecionar programa ────────────────────────────────── */
function selecionarPrograma(id) {
  programaSelecionadoId = id;

  // Atualiza visual dos cards
  document.querySelectorAll(".programa-card").forEach((card) => {
    if (card.dataset.id === id) {
      card.classList.add("selecionado");
    } else {
      card.classList.remove("selecionado");
    }
  });

  // Atualiza botão de confirmar
  const programa = getProgramaById(id);
  const btn = document.getElementById("btn-confirmar");
  if (btn && programa) {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
      Começar: ${sanitize(programa.nome)}`;
  }
}

/* ── Botão confirmar ────────────────────────────────────── */
function initBotaoConfirmar(user) {
  const btn = document.getElementById("btn-confirmar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!programaSelecionadoId) return;
    abrirAvisoProfessor(user);
  });
}

/* ── Modal de aviso sobre professor ────────────────────── */
function abrirAvisoProfessor(user) {
  const overlay = document.getElementById("aviso-professor-overlay");
  if (!overlay) {
    // Fallback: confirma diretamente se o modal não existir no DOM
    confirmarPrograma(user);
    return;
  }
  overlay.classList.add("open");

  const btnContinuar = document.getElementById("btn-aviso-continuar");
  const btnVoltar = document.getElementById("btn-aviso-voltar");

  // Clones para remover listeners duplicados em chamadas repetidas
  const newContinuar = btnContinuar.cloneNode(true);
  const newVoltar = btnVoltar.cloneNode(true);
  btnContinuar.replaceWith(newContinuar);
  btnVoltar.replaceWith(newVoltar);

  newContinuar.addEventListener("click", () => {
    overlay.classList.remove("open");
    confirmarPrograma(user);
  });

  newVoltar.addEventListener("click", () => {
    overlay.classList.remove("open");
  });

  // Fecha ao clicar fora do sheet
  overlay.addEventListener(
    "click",
    (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    },
    { once: false },
  );
}

async function confirmarPrograma(user) {
  const btn = document.getElementById("btn-confirmar");
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = `<div class="spinner-ring" style="width:20px;height:20px;border-width:2px;"></div> Salvando...`;

  try {
    const agora = new Date().toISOString();
    const updates = {};
    // Escreve em ambos os caminhos (mesma convenção do cadastro)
    updates[`users/${user.uid}/programaAtivo`] = programaSelecionadoId;
    updates[`users/${user.uid}/programaSelecionadoEm`] = agora;
    updates[`alunos/${user.uid}/programaAtivo`] = programaSelecionadoId;
    updates[`alunos/${user.uid}/programaSelecionadoEm`] = agora;
    await db.ref().update(updates);

    // Redireciona para o dashboard
    window.location.href = "aluno.html";
  } catch (err) {
    console.error("[SelecionarPrograma] Erro ao salvar:", err);
    showToast("Erro ao salvar programa. Tente novamente.", "error");
    btn.disabled = false;
    selecionarPrograma(programaSelecionadoId); // Restaura botão
  }
}

/* ── Filtros ────────────────────────────────────────────── */
function initFiltros() {
  const container = document.getElementById("filtros-container");
  if (!container) return;

  container.querySelectorAll(".filtro-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container
        .querySelectorAll(".filtro-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroAtivo = btn.dataset.filtro;
      renderProgramas(filtroAtivo);
    });
  });
}

/* ── Modal de detalhes ──────────────────────────────────── */
function abrirDetalhes(id) {
  const programa = getProgramaById(id);
  if (!programa) return;

  const overlay = document.getElementById("detalhe-overlay");
  const content = document.getElementById("detalhe-content");

  const treinosHtml = Object.entries(programa.treinos)
    .map(([letra, treino]) => {
      const exerciciosHtml = treino.exercicios
        .map(
          (ex) => `
          <div class="detalhe-exercicio-item">
            <span class="detalhe-ex-nome">${sanitize(ex.nome)}</span>
            <span class="detalhe-ex-info">${ex.series}x ${sanitize(ex.reps)} · ${sanitize(ex.descanso)}</span>
          </div>`,
        )
        .join("");

      return `
        <div class="detalhe-treino">
          <div class="detalhe-treino-header">
            <span style="font-size:1.4rem">${sanitize(treino.icone)}</span>
            <h4>Treino ${sanitize(letra)} — ${sanitize(treino.foco)}</h4>
          </div>
          ${exerciciosHtml}
        </div>`;
    })
    .join("");

  content.innerHTML = `
    <h3 style="font-size:1.1rem;font-weight:800;color:var(--text-white);margin:0 0 6px;">${sanitize(programa.nome)}</h3>
    <p style="font-size:0.82rem;color:var(--text-muted);margin:0 0 20px;line-height:1.6;">${sanitize(programa.descricao)}</p>
    ${treinosHtml}
    <button onclick="fecharDetalhes();selecionarPrograma('${sanitize(programa.id)}')" style="
      width:100%;padding:14px;background:var(--gradient-primary);color:white;
      border:none;border-radius:var(--radius-xl);font-size:1rem;font-weight:700;
      cursor:pointer;margin-top:8px;
    ">
      Escolher este programa
    </button>
  `;

  overlay.classList.add("open");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharDetalhes();
  });
}

function fecharDetalhes() {
  document.getElementById("detalhe-overlay").classList.remove("open");
}

/* ── Sanitize helper local (segurança XSS) ──────────────── */
function sanitize(str) {
  if (typeof str !== "string") return str ?? "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
