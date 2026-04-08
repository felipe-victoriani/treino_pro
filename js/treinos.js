/* ============================================================
   TREINO PRO - Treinos
   CRUD completo de treinos (professor edita, aluno visualiza)
   ============================================================ */

/* Mapa: letra → exercícios renderizados localmente */
const treinoCache = {};

/* Listener ativo */
let treinoListener = null;
let treinoAlunoAtual = null;
let treinoLetraAtual = "A";

/* ── Helpers ─────────────────────────────────────────────── */

function treinoLetras() {
  return ["A", "B", "C", "D", "E"];
}

/* ── Carregar treinos (professor / editor) ────────────────── */

/**
 * Carrega os dados de um treino e renderiza no editor do professor
 * @param {string} alunoId
 * @param {string} letra
 */
function loadTreinoProfessor(alunoId, letra) {
  if (!alunoId || !letra) return;

  treinoAlunoAtual = alunoId;
  treinoLetraAtual = letra;

  db.ref(`treinos/${alunoId}/${letra}`)
    .once("value")
    .then((snap) => {
      const data = snap.val() || { foco: "", exercicios: {} };
      renderTreinoEditor(letra, data);
    })
    .catch((err) => {
      console.error(
        "[Treinos] Erro ao carregar treino:",
        err.code,
        err.message,
      );
      showToast(
        "Erro ao carregar treino (" + (err.code || err.message) + ")",
        "error",
      );
    });
}

/**
 * Renderiza o editor de treino para o professor
 * @param {string} letra
 * @param {Object} data  { foco, exercicios }
 */
function renderTreinoEditor(letra, data) {
  // Foco
  const focoEl = document.getElementById("treino-foco");
  if (focoEl) focoEl.value = sanitize(data.foco || "");

  // Lista de exercícios
  const listEl = document.getElementById("prof-exercise-list");
  if (!listEl) return;

  const exercicios = data.exercicios
    ? Object.entries(data.exercicios)
        .map(([id, ex]) => ({ id, ...ex }))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    : [];

  if (!exercicios.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum exercício ainda</h3>
        <p>Use o formulário abaixo para adicionar exercícios ao Treino ${sanitize(letra)}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = exercicios
    .map((ex, i) => {
      const grupoLabel = ex.grupoMuscular
        ? `<span class="ex-badge-card ex-badge-muscle">${sanitize(ex.grupoMuscular)}</span>`
        : "";
      const tipoLabel = ex.tipo
        ? `<span class="ex-badge-card ex-badge-type">${sanitize(ex.tipo.replace("_", " "))}</span>`
        : "";
      const temVideo = !!ex.videoUrl;
      return `
    <div class="exercise-card-prof" data-id="${sanitize(ex.id)}">
      <div class="exercise-card-prof-header">
        <span class="drag-handle" title="Arrastar para reordenar">⠿</span>
        <span class="exercise-number">${i + 1}</span>
        <div class="exercise-info" style="flex:1;min-width:0">
          <strong style="display:block;font-size:0.93rem;color:var(--text-white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(ex.nome || "")}</strong>
          <div class="exercise-badges">${grupoLabel}${tipoLabel}</div>
          <span class="exercise-meta-text">
            ${sanitize(ex.series || "")} séries × ${sanitize(ex.repeticoes || "")}${ex.carga ? " · " + sanitize(ex.carga) : ""}${ex.descanso ? " · " + sanitize(ex.descanso) + "s desc." : ""}
          </span>
          ${ex.observacoes ? `<span class="exercise-obs">${sanitize(ex.observacoes)}</span>` : ""}
        </div>
        <div class="exercise-actions-top">
          <button class="btn-icon" onclick="editarExercicio('${sanitize(ex.id)}')" title="Editar exercício">✏️</button>
          <button class="btn-icon" onclick="duplicarExercicio('${sanitize(ex.id)}')" title="Duplicar">📋</button>
          <button class="btn-icon btn-danger-icon" onclick="removerExercicio('${sanitize(ex.id)}')" title="Remover">🗑️</button>
        </div>
      </div>
      <div class="exercise-card-prof-footer">
        <button class="btn-video-ex${temVideo ? " has-video" : ""}" onclick="abrirUploadVideo('${sanitize(ex.id)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          ${temVideo ? "🎬 Alterar vídeo" : "📹 Adicionar vídeo"}
        </button>
      </div>
    </div>`;
    })
    .join("");

  // Inicializa drag-and-drop
  if (typeof Sortable !== "undefined") {
    if (listEl._sortable) listEl._sortable.destroy();
    listEl._sortable = Sortable.create(listEl, {
      handle: ".drag-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      onEnd: async function () {
        const cards = listEl.querySelectorAll(".exercise-card-prof");
        const updates = {};
        cards.forEach((card, idx) => {
          const id = card.dataset.id;
          if (id)
            updates[
              `treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${id}/ordem`
            ] = idx;
          // Atualiza número visual
          const numEl = card.querySelector(".exercise-number");
          if (numEl) numEl.textContent = idx + 1;
        });
        try {
          await db.ref().update(updates);
        } catch (e) {
          showToast("Erro ao salvar ordem", "error");
        }
      },
    });
  }
}

/**
 * Salva o foco do treino atual
 */
async function salvarFoco() {
  const focoEl = document.getElementById("treino-foco");
  const foco = focoEl ? focoEl.value.trim() : "";
  if (!treinoAlunoAtual || !treinoLetraAtual) return;

  try {
    await db
      .ref(`treinos/${treinoAlunoAtual}/${treinoLetraAtual}/foco`)
      .set(foco);
    showToast("Foco salvo!", "success");
  } catch (e) {
    showToast("Erro ao salvar foco", "error");
  }
}

/* ── Adicionar / Editar / Remover Exercício ──────────────── */

let editandoExercicioId = null;
/** Arquivo de vídeo selecionado inline no formulário */
let _inlineVideoFile = null;
/** Flag para indicar que o vídeo atual deve ser removido */
let _inlineVideoRemover = false;

/**
 * Adiciona ou atualiza exercício no Firebase
 */
async function salvarExercicio() {
  const alunoId = treinoAlunoAtual;
  const letra = treinoLetraAtual;
  if (!alunoId || !letra) {
    showToast("Selecione um aluno e treino", "error");
    return;
  }

  const nome = document.getElementById("ex-nome")?.value.trim();
  const exercicioId =
    document.getElementById("ex-exercicio-id")?.value.trim() || "";
  const grupoMuscular =
    document.getElementById("ex-grupo-muscular")?.value.trim() || "";
  const tipo = document.getElementById("ex-tipo")?.value.trim() || "";
  const instrucoes =
    document.getElementById("ex-instrucoes")?.value.trim() || "";
  const series = document.getElementById("ex-series")?.value.trim();
  const repeticoes = document.getElementById("ex-reps")?.value.trim();
  const carga = document.getElementById("ex-carga")?.value.trim();
  const descanso = document.getElementById("ex-descanso")?.value.trim();
  const observacoes = document.getElementById("ex-obs")?.value.trim();
  const videoLegenda =
    document.getElementById("ex-video-legenda")?.value.trim() || "";

  if (!nome) {
    showToast("Selecione um exercício na biblioteca", "warning");
    return;
  }
  if (!series) {
    showToast("Insira o número de séries", "warning");
    return;
  }
  if (!repeticoes) {
    showToast("Insira as repetições", "warning");
    return;
  }

  showLoading("Salvando exercício...");
  try {
    // Conta exercícios existentes para definir ordem
    let ordem = 0;
    if (!editandoExercicioId) {
      const snap = await db
        .ref(`treinos/${alunoId}/${letra}/exercicios`)
        .once("value");
      ordem = snap.exists() ? Object.keys(snap.val()).length : 0;
    }

    const exercicioData = {
      nome,
      exercicioId,
      grupoMuscular,
      tipo,
      instrucoes,
      series,
      repeticoes,
      carga: carga || "",
      descanso: descanso || "",
      observacoes: observacoes || "",
      videoLegenda,
      ordem,
    };

    let exRef;
    if (editandoExercicioId) {
      exRef = db.ref(
        `treinos/${alunoId}/${letra}/exercicios/${editandoExercicioId}`,
      );
      await exRef.update(exercicioData);
    } else {
      exRef = await db
        .ref(`treinos/${alunoId}/${letra}/exercicios`)
        .push(exercicioData);
    }

    const exId = editandoExercicioId || exRef.key;

    // Remover vídeo existente se solicitado
    if (_inlineVideoRemover) {
      try {
        const snap = await db
          .ref(`treinos/${alunoId}/${letra}/exercicios/${exId}/videoUrl`)
          .once("value");
        const oldUrl = snap.val();
        if (oldUrl && window.storage) {
          await window.storage
            .refFromURL(oldUrl)
            .delete()
            .catch(() => {});
        }
      } catch (_) {}
      await db
        .ref(`treinos/${alunoId}/${letra}/exercicios/${exId}`)
        .update({ videoUrl: null });
    }

    // Upload de novo vídeo inline
    if (_inlineVideoFile && window.storage) {
      const professorId =
        typeof profState !== "undefined" ? profState.uid : null;
      if (!professorId) throw new Error("Professor não identificado");

      const ext = _inlineVideoFile.name.includes(".")
        ? "." + _inlineVideoFile.name.split(".").pop().toLowerCase()
        : "";
      const path = `exerciciosVideos/${professorId}/${alunoId}/${letra}/${exId}${ext}`;
      const storageRef = window.storage.ref(path);

      // Mostra barra de progresso
      document.getElementById("ex-video-progress")?.classList.remove("hidden");
      const uploadTask = storageRef.put(_inlineVideoFile);

      await new Promise((resolve, reject) => {
        const bar = document.getElementById("ex-video-bar");
        const pct = document.getElementById("ex-video-pct");
        uploadTask.on(
          "state_changed",
          (snap) => {
            const p = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100,
            );
            if (bar) bar.style.width = p + "%";
            if (pct) pct.textContent = p + "%";
          },
          reject,
          resolve,
        );
      });

      const videoUrl = await storageRef.getDownloadURL();
      await db
        .ref(`treinos/${alunoId}/${letra}/exercicios/${exId}`)
        .update({ videoUrl });
    }

    showToast(
      editandoExercicioId ? "Exercício atualizado!" : "Exercício adicionado!",
      "success",
    );
    limparFormExercicio();
    loadTreinoProfessor(alunoId, letra);
    document.getElementById("exercise-form")?.classList.add("hidden");
  } catch (e) {
    console.error("[Treinos] Erro ao salvar exercício:", e.code, e.message, e);
    showToast(
      "Erro ao salvar (" + (e.code || e.message || "desconhecido") + ")",
      "error",
    );
  } finally {
    hideLoading();
    editandoExercicioId = null;
  }
}

/**
 * Preenche o formulário com dados do exercício para edição
 */
async function editarExercicio(exId) {
  const snap = await db
    .ref(`treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${exId}`)
    .once("value");
  const ex = snap.val();
  if (!ex) return;

  /* Garante que o autocomplete esteja inicializado */
  if (
    window.ExercicioAutocomplete &&
    typeof profState !== "undefined" &&
    profState.uid
  ) {
    await ExercicioAutocomplete.init(profState.uid);
  }

  /* Preenche parâmetros editáveis */
  document.getElementById("ex-series").value = ex.series || "";
  document.getElementById("ex-reps").value = ex.repeticoes || "";
  document.getElementById("ex-carga").value = ex.carga || "";
  document.getElementById("ex-descanso").value = ex.descanso || "";
  document.getElementById("ex-obs").value = ex.observacoes || "";

  /* Preenche legenda do vídeo */
  const legendaEl = document.getElementById("ex-video-legenda");
  if (legendaEl) legendaEl.value = ex.videoLegenda || "";

  /* Mostra vídeo atual se existir */
  const atualWrap = document.getElementById("ex-video-atual-wrap");
  const atualVideoEl = document.getElementById("ex-video-atual-el");
  const atualGifEl = document.getElementById("ex-gif-atual-el");
  if (atualWrap) {
    if (ex.videoUrl) {
      atualWrap.classList.remove("hidden");
      if (_isGifUrl(ex.videoUrl)) {
        if (atualVideoEl) atualVideoEl.style.display = "none";
        if (atualGifEl) {
          atualGifEl.src = ex.videoUrl;
          atualGifEl.style.display = "";
        }
      } else {
        if (atualGifEl) atualGifEl.style.display = "none";
        if (atualVideoEl) {
          atualVideoEl.src = ex.videoUrl;
          atualVideoEl.style.display = "";
        }
      }
    } else {
      atualWrap.classList.add("hidden");
    }
  }
  _inlineVideoFile = null;
  _inlineVideoRemover = false;

  /* Pré-seleciona o exercício no autocomplete */
  if (window.ExercicioAutocomplete) {
    ExercicioAutocomplete.preselect(ex.exercicioId || "", ex);
  } else {
    /* Fallback: preenche o campo hidden diretamente */
    const nomeEl = document.getElementById("ex-nome");
    if (nomeEl) nomeEl.value = ex.nome || "";
  }

  editandoExercicioId = exId;

  /* Abre o form se estiver fechado */
  const formEl = document.getElementById("exercise-form");
  if (formEl) formEl.classList.remove("hidden");

  const titleEl = document.getElementById("exercise-form-title-text");
  if (titleEl) titleEl.textContent = "Editar exercício";

  const saveBtn = document.getElementById("save-exercise-btn");
  if (saveBtn) saveBtn.textContent = "✅ Atualizar exercício";

  /* Scroll suave até o formulário */
  setTimeout(() => {
    formEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
  showToast("✏️ Edite os campos abaixo e clique em Atualizar", "info");
}

/**
 * Remove exercício do Firebase
 */
async function removerExercicio(exId) {
  if (!confirm("Remover este exercício?")) return;
  try {
    await db
      .ref(`treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${exId}`)
      .remove();
    showToast("Exercício removido", "success");
    loadTreinoProfessor(treinoAlunoAtual, treinoLetraAtual);
  } catch (e) {
    showToast("Erro ao remover", "error");
  }
}

/**
 * Duplica um exercício existente no treino atual
 */
async function duplicarExercicio(exId) {
  const alunoId = treinoAlunoAtual;
  const letra = treinoLetraAtual;
  if (!alunoId || !letra) return;
  try {
    const snap = await db
      .ref(`treinos/${alunoId}/${letra}/exercicios/${exId}`)
      .once("value");
    const ex = snap.val();
    if (!ex) return;
    const countSnap = await db
      .ref(`treinos/${alunoId}/${letra}/exercicios`)
      .once("value");
    const ordem = countSnap.exists() ? Object.keys(countSnap.val()).length : 0;
    await db
      .ref(`treinos/${alunoId}/${letra}/exercicios`)
      .push({ ...ex, ordem, nome: ex.nome + " (cópia)" });
    showToast("Exercício duplicado!", "success");
    loadTreinoProfessor(alunoId, letra);
  } catch (e) {
    showToast("Erro ao duplicar", "error");
    console.error(e);
  }
}

/**
 * Limpa o formulário de exercício
 */
function limparFormExercicio() {
  /* Parâmetros editáveis */
  [
    "ex-series",
    "ex-reps",
    "ex-carga",
    "ex-descanso",
    "ex-obs",
    "ex-video-legenda",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  /* Campos hidden da biblioteca */
  [
    "ex-nome",
    "ex-exercicio-id",
    "ex-grupo-muscular",
    "ex-tipo",
    "ex-instrucoes",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  editandoExercicioId = null;
  _inlineVideoFile = null;
  _inlineVideoRemover = false;

  /* Resetar área de upload inline */
  const fileInput = document.getElementById("ex-video-file");
  if (fileInput) fileInput.value = "";
  document.getElementById("ex-video-placeholder")?.classList.remove("hidden");
  document.getElementById("ex-video-preview-wrap")?.classList.add("hidden");
  document.getElementById("ex-video-atual-wrap")?.classList.add("hidden");
  document.getElementById("ex-video-progress")?.classList.add("hidden");
  const uploadArea = document.getElementById("ex-video-upload-area");
  if (uploadArea) uploadArea.classList.remove("has-file");
  const barEl = document.getElementById("ex-video-bar");
  if (barEl) barEl.style.width = "0%";

  /* Resetar autocomplete */
  if (window.ExercicioAutocomplete) ExercicioAutocomplete.reset();

  /* Restaurar label do botão */
  const saveBtn = document.getElementById("save-exercise-btn");
  if (saveBtn) saveBtn.textContent = "Salvar exercício";
  const titleEl = document.getElementById("exercise-form-title-text");
  if (titleEl) titleEl.textContent = "Novo exercício";
}

/* ── Aluno: visualizar e marcar exercícios ───────────────── */

/**
 * Carrega o treino de uma letra específica para o aluno
 * @param {string} alunoId
 * @param {string} letra
 * @param {string} listContainerId
 * @param {Object} historico  { exerciciosCompletos: {}, seriesCompletas: {}, cargaUsada: {} }
 */
async function loadTreinoAluno(
  alunoId,
  letra,
  listContainerId,
  historico = {},
) {
  const listEl = document.getElementById(listContainerId);
  if (!listEl) return;

  // Skeleton loading
  listEl.innerHTML = [1, 2, 3]
    .map(
      () => `
    <div class="skeleton-ex-card">
      <div class="skeleton-line sk-title"></div>
      <div class="skeleton-line sk-meta"></div>
      <div class="sk-pills-row">
        <div class="skeleton-pill"></div>
        <div class="skeleton-pill"></div>
        <div class="skeleton-pill"></div>
      </div>
    </div>`,
    )
    .join("");

  try {
    const snap = await db.ref(`treinos/${alunoId}/${letra}`).once("value");
    const data = snap.val();

    if (!data || !data.exercicios) {
      listEl.innerHTML = `
        <div class="onboarding-card">
          <div class="onboarding-icon">🏋️</div>
          <h3>Treino ${sanitize(letra)} aguardando!</h3>
          <p>Seu professor ainda não adicionou exercícios aqui.</p>
          <div class="onboarding-steps">
            <div class="onboarding-step">
              <span class="step-num">1</span>
              <span>Aguarde o professor configurar o treino</span>
            </div>
            <div class="onboarding-step">
              <span class="step-num">2</span>
              <span>Marque cada série à medida que completar</span>
            </div>
            <div class="onboarding-step">
              <span class="step-num">3</span>
              <span>Finalize o treino para registrar sua evolução</span>
            </div>
          </div>
        </div>`;
      return;
    }

    const completados = historico.exerciciosCompletos || {};
    const seriesCompletas = historico.seriesCompletas || {};
    const cargasUsadas = historico.cargaUsada || {};
    const exercicios = Object.entries(data.exercicios)
      .map(([id, ex]) => ({ id, ...ex }))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    renderExerciciosAluno(
      listEl,
      exercicios,
      completados,
      alunoId,
      letra,
      cargasUsadas,
      seriesCompletas,
    );
    atualizarProgressoTreino(
      Object.keys(completados).length,
      exercicios.length,
    );
  } catch (e) {
    listEl.innerHTML =
      '<div class="empty-state"><h3>Erro ao carregar treino</h3></div>';
    console.error(e);
  }
}

/**
 * Renderiza a checklist de exercícios para o aluno (com séries, carga e instruções expansíveis)
 */
function renderExerciciosAluno(
  container,
  exercicios,
  completados,
  alunoId,
  letra,
  cargasUsadas = {},
  seriesCompletas = {},
) {
  container.innerHTML = exercicios
    .map((ex) => {
      const done = !!completados[ex.id];
      const exIdSafe = ex.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const numSeries = Math.max(1, parseInt(ex.series) || 3);
      const exSeriesComp = seriesCompletas[ex.id] || {};
      const cargaUsada = cargasUsadas[ex.id] || "";
      const descanso = parseInt(ex.descanso) || 0;

      const seriesPillsHtml = Array.from({ length: numSeries }, (_, i) => {
        const sdone = !!exSeriesComp[`s${i}`];
        return `<button class="serie-pill${sdone ? " serie-done" : ""}" id="spill-${exIdSafe}-${i}"
          onclick="event.stopPropagation(); toggleSerie('${exIdSafe}','${sanitize(alunoId)}','${sanitize(letra)}',${i},${numSeries},${descanso})">S${i + 1}</button>`;
      }).join("");

      const expandArea = ex.instrucoes
        ? `<div class="ex-expand-area hidden" id="expand-${exIdSafe}">
            <p class="ex-instrucoes-text">💡 <strong>Como fazer:</strong> ${sanitize(ex.instrucoes)}</p>
          </div>`
        : "";

      const hasInstrucoes = !!ex.instrucoes;

      return `
      <div class="exercise-check-card${done ? " completed" : ""}" id="excard-${exIdSafe}">
        <div class="ex-check-main" onclick="expandirCard('${exIdSafe}')">
          <div class="exercise-check-info">
            <div class="exercise-check-nome">${sanitize(ex.nome)}</div>
            <div class="exercise-check-meta">
              ${sanitize(ex.series)} séries × ${sanitize(ex.repeticoes)}${ex.descanso ? " · " + sanitize(ex.descanso) + "s descanso" : ""}
            </div>
            ${ex.observacoes ? `<div class="exercise-check-obs">📌 ${sanitize(ex.observacoes)}</div>` : ""}
          </div>
          <svg class="ex-expand-chevron${hasInstrucoes ? "" : " invisible"}" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
        ${expandArea}
        <div class="series-pills-row" onclick="event.stopPropagation()">
          ${seriesPillsHtml}
        </div>
        <div class="carga-nota-wrap" onclick="event.stopPropagation()">
          <input class="carga-nota-input" type="text"
            placeholder="Carga usada (ex: 20kg, barra 40kg…)"
            value="${sanitize(cargaUsada)}"
            onchange="salvarCargaUsada('${exIdSafe}','${sanitize(alunoId)}',this.value)">
          <button class="btn-carga-chart" title="Histórico de cargas"
            onclick="event.stopPropagation(); verHistoricoCargas('${exIdSafe}','${sanitize(ex.nome)}','${sanitize(alunoId)}')">📊</button>
        </div>
        ${
          ex.videoUrl
            ? `<button class="btn-ver-video" data-video-url="${ex.videoUrl.replace(/"/g, "&quot;")}" data-video-nome="${sanitize(ex.nome)}" onclick="event.stopPropagation(); verVideoExercicio(this.dataset.videoUrl, this.dataset.videoNome)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          ${ex.videoLegenda ? sanitize(ex.videoLegenda) : "Ver vídeo do exercício"}
        </button>`
            : ""
        }
      </div>`;
    })
    .join("");
}

/**
 * Expande/recolhe a área de instruções de um exercício
 */
function expandirCard(exId) {
  const expandArea = document.getElementById(`expand-${exId}`);
  const card = document.getElementById(`excard-${exId}`);
  if (!expandArea) return;
  const isOpen = !expandArea.classList.contains("hidden");
  expandArea.classList.toggle("hidden", isOpen);
  card?.classList.toggle("expanded", !isOpen);
}

/**
 * Alterna o estado de uma série individual de um exercício
 */
async function toggleSerie(
  exId,
  alunoId,
  letra,
  serieIdx,
  totalSeries,
  descanso,
) {
  if (navigator.vibrate) navigator.vibrate(25);

  const today = getDateKey();
  const histRef = db.ref(`historicoTreinos/${alunoId}/${today}`);
  const snap = await histRef.once("value");
  const historico = snap.val() || {};

  const seriesCompletas = { ...(historico.seriesCompletas || {}) };
  const exSeries = { ...(seriesCompletas[exId] || {}) };
  const key = `s${serieIdx}`;
  const wasDone = !!exSeries[key];

  if (wasDone) {
    delete exSeries[key];
  } else {
    exSeries[key] = true;
  }

  const numDone = Object.keys(exSeries).length;
  const allDone = numDone >= totalSeries;

  const completados = { ...(historico.exerciciosCompletos || {}) };
  if (allDone) {
    completados[exId] = true;
  } else {
    delete completados[exId];
  }

  // Atualiza Firebase
  await histRef.update({
    letra,
    completado: false,
    exerciciosCompletos: completados,
  });
  const serieRef = db.ref(
    `historicoTreinos/${alunoId}/${today}/seriesCompletas/${exId}`,
  );
  if (Object.keys(exSeries).length > 0) {
    await serieRef.set(exSeries);
  } else {
    await serieRef.remove();
  }

  // Atualiza UI: pílula
  const pill = document.getElementById(`spill-${exId}-${serieIdx}`);
  if (pill) pill.classList.toggle("serie-done", !wasDone);

  // Atualiza UI: card completed
  const card = document.getElementById(`excard-${exId}`);
  if (card) card.classList.toggle("completed", allDone);

  // Atualiza progresso
  const total = document.querySelectorAll('[id^="excard-"]').length;
  const concluidos = document.querySelectorAll(
    ".exercise-check-card.completed",
  ).length;
  atualizarProgressoTreino(concluidos, total);

  // Inicia timer de descanso ao marcar série (não ao desmarcar)
  if (!wasDone && descanso > 0) {
    if (typeof iniciarTimerDescanso === "function") {
      iniciarTimerDescanso(descanso);
    }
  }
}

/**
 * Salva a carga utilizada durante o treino
 */
async function salvarCargaUsada(exId, alunoId, valor) {
  const today = getDateKey();
  try {
    if (valor && valor.trim()) {
      await db
        .ref(`historicoTreinos/${alunoId}/${today}/cargaUsada/${exId}`)
        .set(valor.trim());
    } else {
      await db
        .ref(`historicoTreinos/${alunoId}/${today}/cargaUsada/${exId}`)
        .remove();
    }
  } catch (e) {
    console.error("[Treinos] Erro ao salvar carga:", e);
  }
}

/**
 * Alterna o estado de conclusão de um exercício no Firebase
 */
async function toggleExercicio(exId, alunoId, letra) {
  if (navigator.vibrate) navigator.vibrate(30);

  const today = getDateKey();
  const ref = db.ref(`historicoTreinos/${alunoId}/${today}`);
  const snap = await ref.once("value");
  const historico = snap.val() || {};

  const completados = { ...(historico.exerciciosCompletos || {}) };
  const done = !completados[exId];

  if (done) completados[exId] = true;
  else delete completados[exId];

  await ref.update({
    letra,
    exerciciosCompletos: completados,
    completado: false,
  });

  // Atualiza UI localmente
  const card = document.getElementById(`excard-${exId}`);
  const icon = card?.querySelector(".ex-check-icon");
  if (card) {
    card.classList.toggle("completed", done);
    if (icon) icon.classList.toggle("done", done);
  }

  // Atualiza progresso
  const total = document.querySelectorAll('[id^="excard-"]').length;
  const concluidos = document.querySelectorAll(
    ".exercise-check-card.completed",
  ).length;
  atualizarProgressoTreino(concluidos, total);
}

/**
 * Atualiza a barra de progresso do treino
 */
function atualizarProgressoTreino(concluidos, total) {
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const barEl = document.getElementById("progress-fill");
  const textEl = document.getElementById("progress-text");

  if (barEl) barEl.style.width = pct + "%";
  if (textEl) textEl.textContent = `${concluidos} / ${total}`;
}

/**
 * Finaliza o treino do dia e salva no Firebase
 * Avança automaticamente para a próxima letra com exercícios
 */
async function finalizarTreino(alunoId) {
  const today = getDateKey();
  const hiRef = db.ref(`historicoTreinos/${alunoId}/${today}`);
  const hiSnap = await hiRef.once("value");
  const historico = hiSnap.val() || {};

  const completados = historico.exerciciosCompletos || {};
  const exerciciosConcluidos = Object.keys(completados).length;

  // Conta total de exercícios no treino
  const letra = historico.letra || "A";
  const treinoSnap = await db
    .ref(`treinos/${alunoId}/${letra}/exercicios`)
    .once("value");
  const totalExercicios = treinoSnap.exists()
    ? Object.keys(treinoSnap.val()).length
    : 0;

  const pct =
    totalExercicios > 0
      ? Math.round((exerciciosConcluidos / totalExercicios) * 100)
      : 0;
  if (
    pct < 50 &&
    !confirm(
      `Você completou apenas ${pct}% dos exercícios. Deseja finalizar mesmo assim?`,
    )
  )
    return;

  showLoading("Finalizando treino...");
  try {
    await hiRef.update({
      completado: true,
      exerciciosConcluidos,
      totalExercicios,
      timestamp: Date.now(),
    });

    // Avança treinoAtual para próxima letra com exercícios
    const proxLetra = await proximaLetraComExercicios(alunoId, letra);
    if (proxLetra) {
      await db.ref(`alunos/${alunoId}/treinoAtual`).set(proxLetra);
    }

    // Exibe modal de celebração se disponível, senão toast
    if (typeof mostrarCelebracao === "function") {
      await mostrarCelebracao(
        letra,
        proxLetra,
        exerciciosConcluidos,
        totalExercicios,
      );
    } else {
      showToast(
        `Treino ${letra} finalizado! 🎉 Próximo: ${proxLetra || letra}`,
        "success",
      );
    }

    // Exibe botão desabilitado
    const btnFinalizar = document.getElementById("finish-workout-btn");
    if (btnFinalizar) {
      btnFinalizar.innerHTML = "✅ Treino Concluído Hoje!";
      btnFinalizar.disabled = true;
    }
  } catch (e) {
    showToast("Erro ao finalizar treino", "error");
    console.error(e);
  } finally {
    hideLoading();
  }
}

/**
 * Retorna a próxima letra que tem exercícios cadastrados
 */
async function proximaLetraComExercicios(alunoId, letraAtual) {
  const letras = treinoLetras();
  const idx = letras.indexOf(letraAtual);
  const ordem = [...letras.slice(idx + 1), ...letras.slice(0, idx + 1)];

  for (const l of ordem) {
    const snap = await db
      .ref(`treinos/${alunoId}/${l}/exercicios`)
      .once("value");
    if (snap.exists()) return l;
  }
  return letraAtual;
}

/**
 * Carrega o histórico de treinos do aluno
 * @param {string} alunoId
 * @param {string} containerId
 * @param {number} limite   - Qtd de dias a exibir
 */
async function loadHistoricoTreinos(alunoId, containerId, limite = 14) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML =
    '<div class="loading-inline"><div class="spinner-sm"></div><p>Carregando histórico...</p></div>';

  try {
    const snap = await db
      .ref(`historicoTreinos/${alunoId}`)
      .orderByKey()
      .limitToLast(limite)
      .once("value");
    const data = snap.val();

    if (!data) {
      el.innerHTML =
        '<div class="empty-state"><h3>Nenhum treino registrado</h3><p>Complete seu primeiro treino!</p></div>';
      return;
    }

    const items = Object.entries(data)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([data, h]) => {
        const pct =
          h.totalExercicios > 0
            ? Math.round(
                ((h.exerciciosConcluidos || 0) / h.totalExercicios) * 100,
              )
            : 0;
        const statusClass = h.completado ? "status-ok" : "status-partial";
        const statusText = h.completado ? "✅ Completo" : `${pct}% concluído`;
        return `
          <div class="historico-item">
            <div class="historico-letra">${sanitize(h.letra || "?")}</div>
            <div class="historico-info">
              <div class="historico-data">${formatDate(data)}</div>
              <div class="historico-exs">${h.exerciciosConcluidos || 0} / ${h.totalExercicios || 0} exercícios</div>
            </div>
            <div class="historico-status ${statusClass}">${statusText}</div>
          </div>`;
      })
      .join("");

    el.innerHTML = items;
  } catch (e) {
    el.innerHTML =
      '<div class="empty-state"><h3>Erro ao carregar histórico</h3></div>';
    console.error(e);
  }
}

/**
 * Formata dade no formato YYYY-MM-DD para exibição legível
 */
function formatDate(dataStr) {
  if (!dataStr) return "";
  const [y, m, d] = dataStr.split("-");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

/* ============================================================
   VÍDEOS POR EXERCÍCIO
   ============================================================ */

let _videoUploadExId = null;
let _videoUploadFile = null;

/**
 * Abre o modal de upload para um exercício específico
 */
function abrirUploadVideo(exId) {
  if (!treinoAlunoAtual || !treinoLetraAtual) return;
  _videoUploadExId = exId;
  _videoUploadFile = null;

  const modal = document.getElementById("modal-video-upload");
  if (!modal) return;

  // Reseta UI
  document
    .getElementById("video-upload-placeholder")
    ?.classList.remove("hidden");
  document.getElementById("video-preview-wrap")?.classList.add("hidden");
  document.getElementById("video-upload-progress")?.classList.add("hidden");
  document.getElementById("video-atual-wrap")?.classList.add("hidden");
  document.getElementById("btn-remover-video")?.classList.add("hidden");
  const saveBtn = document.getElementById("btn-salvar-video");
  if (saveBtn) saveBtn.disabled = true;
  const fileInput = document.getElementById("video-file-input");
  if (fileInput) fileInput.value = "";

  // Busca nome e vídeo existente
  db.ref(`treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${exId}`)
    .once("value")
    .then((snap) => {
      const ex = snap.val() || {};
      const nomeEl = document.getElementById("video-modal-ex-nome");
      if (nomeEl) nomeEl.textContent = ex.nome || "";

      if (ex.videoUrl) {
        document
          .getElementById("btn-remover-video")
          ?.classList.remove("hidden");
        const atualWrap = document.getElementById("video-atual-wrap");
        if (atualWrap) {
          atualWrap.classList.remove("hidden");
          _mostrarMidiaEl("video-atual-el", "gif-atual-el", ex.videoUrl);
        }
      }
    });

  modal.classList.remove("hidden");
}

/**
 * Detecta se URL é GIF e alterna entre <video> e <img>
 */
function _mostrarMidiaEl(videoId, gifId, url) {
  const isGif = _isGifUrl(url);
  const vEl = document.getElementById(videoId);
  const gEl = document.getElementById(gifId);
  if (isGif) {
    if (vEl) vEl.style.display = "none";
    if (gEl) {
      gEl.src = url;
      gEl.style.display = "";
    }
  } else {
    if (gEl) gEl.style.display = "none";
    if (vEl) {
      vEl.src = url;
      vEl.style.display = "";
    }
  }
}

function _isGifUrl(url) {
  try {
    const lower = url.toLowerCase();
    return (
      lower.includes(".gif") ||
      lower.includes("image%2Fgif") ||
      lower.includes("image/gif")
    );
  } catch (_) {
    return false;
  }
}

/**
 * Fecha o modal de upload
 */
function fecharUploadVideoModal() {
  document.getElementById("modal-video-upload")?.classList.add("hidden");
  // Pausa vídeo de preview se estiver tocando
  const vPrev = document.getElementById("video-preview-el");
  if (vPrev) {
    vPrev.pause();
    vPrev.src = "";
  }
  _videoUploadExId = null;
  _videoUploadFile = null;
}

/**
 * Valida duração do vídeo (máx 15s) via metadata API
 */
function _validarDuracaoVideo(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const blobUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(video.duration <= 15);
    };
    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(true); // permissivo se não conseguir validar
    };
    video.src = blobUrl;
  });
}

/**
 * Realiza o upload do vídeo/GIF para o Firebase Storage e salva URL no DB
 */
async function confirmarUploadVideo() {
  if (
    !_videoUploadFile ||
    !_videoUploadExId ||
    !treinoAlunoAtual ||
    !treinoLetraAtual
  )
    return;

  const storage = window.storage;
  if (!storage) {
    showToast(
      "Firebase Storage não disponível. Ative-o no console Firebase.",
      "error",
    );
    return;
  }

  const saveBtn = document.getElementById("btn-salvar-video");
  const progressWrap = document.getElementById("video-upload-progress");
  const progressBar = document.getElementById("video-upload-bar");
  const progressPct = document.getElementById("video-upload-pct");

  if (saveBtn) saveBtn.disabled = true;
  progressWrap?.classList.remove("hidden");

  const professorId = auth.currentUser?.uid || "";
  if (!professorId) {
    showToast("Sessão expirada. Faça login novamente.", "error");
    return;
  }

  const extMap = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "image/gif": ".gif",
  };
  const ext = extMap[_videoUploadFile.type] || ".mp4";
  const storagePath = `exerciciosVideos/${professorId}/${treinoAlunoAtual}/${treinoLetraAtual}/${_videoUploadExId}${ext}`;

  const storageRef = storage.ref(storagePath);
  const uploadTask = storageRef.put(_videoUploadFile, {
    contentType: _videoUploadFile.type,
    customMetadata: {
      professorId,
      exId: _videoUploadExId,
    },
  });

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const pct = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
      );
      if (progressBar) progressBar.style.width = pct + "%";
      if (progressPct) progressPct.textContent = pct + "%";
    },
    (err) => {
      console.error("[Video] Erro no upload:", err);
      showToast(
        "Erro no upload: " + (err.code || err.message || "desconhecido"),
        "error",
      );
      if (saveBtn) saveBtn.disabled = false;
      progressWrap?.classList.add("hidden");
    },
    async () => {
      try {
        const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
        await db
          .ref(
            `treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${_videoUploadExId}`,
          )
          .update({ videoUrl: downloadUrl });
        showToast("Vídeo salvo! 🎬 O aluno já pode visualizar.", "success");
        fecharUploadVideoModal();
        loadTreinoProfessor(treinoAlunoAtual, treinoLetraAtual);
      } catch (e) {
        console.error("[Video] Erro ao salvar URL:", e);
        showToast("Erro ao finalizar: " + (e.message || ""), "error");
        if (saveBtn) saveBtn.disabled = false;
      }
    },
  );
}

/**
 * Remove o vídeo do Storage e do Realtime Database
 */
async function removerVideoExercicio() {
  if (!_videoUploadExId || !treinoAlunoAtual || !treinoLetraAtual) return;

  showLoading("Removendo vídeo...");
  try {
    await db
      .ref(
        `treinos/${treinoAlunoAtual}/${treinoLetraAtual}/exercicios/${_videoUploadExId}/videoUrl`,
      )
      .remove();

    // Tenta remover do Storage para cada extensão possível
    if (window.storage) {
      const professorId = auth.currentUser?.uid || "";
      for (const ext of [".mp4", ".webm", ".mov", ".gif"]) {
        try {
          await window.storage
            .ref(
              `exerciciosVideos/${professorId}/${treinoAlunoAtual}/${treinoLetraAtual}/${_videoUploadExId}${ext}`,
            )
            .delete();
          break;
        } catch (_) {
          /* extensão não encontrada, tenta próxima */
        }
      }
    }

    showToast("Vídeo removido com sucesso", "success");
    fecharUploadVideoModal();
    loadTreinoProfessor(treinoAlunoAtual, treinoLetraAtual);
  } catch (e) {
    console.error("[Video] Erro ao remover:", e);
    showToast("Erro ao remover vídeo", "error");
  } finally {
    hideLoading();
  }
}

/**
 * Abre o modal de player para o aluno visualizar o vídeo/GIF
 */
function verVideoExercicio(url, nome) {
  const modal = document.getElementById("modal-video-player");
  if (!modal) {
    console.error("[Video] Modal #modal-video-player não encontrado no DOM");
    return;
  }
  if (!url) {
    showToast("URL do vídeo não encontrada", "error");
    return;
  }

  console.log("[Video] Abrindo:", url);

  const titleEl = document.getElementById("video-player-title");
  if (titleEl) titleEl.textContent = nome || "Exercício";

  const videoEl = document.getElementById("video-player-el");
  const gifEl = document.getElementById("gif-player-el");

  if (_isGifUrl(url)) {
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.style.display = "none";
    }
    if (gifEl) {
      gifEl.src = url;
      gifEl.style.display = "";
    }
  } else {
    if (gifEl) {
      gifEl.src = "";
      gifEl.style.display = "none";
    }
    if (videoEl) {
      videoEl.onerror = () => {
        console.error("[Video] Erro ao carregar:", videoEl.error);
        showToast(
          "Não foi possível carregar o vídeo. Verifique sua conexão ou tente novamente.",
          "error",
        );
      };
      videoEl.src = url;
      videoEl.style.display = "";
      videoEl.load();
      videoEl.play().catch((e) => {
        console.warn("[Video] autoplay bloqueado, aguardando interação:", e);
      });
    }
  }

  modal.classList.remove("hidden");
}

/**
 * Fecha o player de vídeo do aluno
 */
function fecharVideoPlayer() {
  const modal = document.getElementById("modal-video-player");
  if (modal) modal.classList.add("hidden");
  const videoEl = document.getElementById("video-player-el");
  if (videoEl) {
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load(); // reseta o elemento para liberar recurso
    videoEl.style.display = "none";
    videoEl.onerror = null;
  }
  const gifEl = document.getElementById("gif-player-el");
  if (gifEl) {
    gifEl.src = "";
    gifEl.style.display = "none";
  }
}

/**
 * Inicializa listeners dos controles do modal de upload (chamado pelo professor.js)
 */
function initVideoUploadListeners() {
  // ── Listener do input inline no formulário ───────────────
  const inlineInput = document.getElementById("ex-video-file");
  if (inlineInput) {
    inlineInput.addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        showToast("Arquivo muito grande. Máximo permitido: 50 MB", "error");
        this.value = "";
        return;
      }
      const isGif = file.type === "image/gif";
      const isVideo = file.type.startsWith("video/");
      if (!isGif && !isVideo) {
        showToast("Formato inválido. Use MP4, WebM, MOV ou GIF", "error");
        this.value = "";
        return;
      }
      if (isVideo) {
        const ok = await _validarDuracaoVideo(file);
        if (!ok) {
          showToast("O vídeo deve ter no máximo 15 segundos ⏱️", "error");
          this.value = "";
          return;
        }
      }

      _inlineVideoFile = file;
      _inlineVideoRemover = false;

      // Mostra preview
      const blobUrl = URL.createObjectURL(file);
      document.getElementById("ex-video-placeholder")?.classList.add("hidden");
      document
        .getElementById("ex-video-preview-wrap")
        ?.classList.remove("hidden");
      const vPrev = document.getElementById("ex-video-preview-el");
      const gPrev = document.getElementById("ex-gif-preview-el");
      if (isGif) {
        if (vPrev) vPrev.style.display = "none";
        if (gPrev) {
          gPrev.src = blobUrl;
          gPrev.style.display = "";
        }
      } else {
        if (gPrev) gPrev.style.display = "none";
        if (vPrev) {
          vPrev.src = blobUrl;
          vPrev.style.display = "";
        }
      }
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const infoEl = document.getElementById("ex-video-file-info");
      if (infoEl) infoEl.textContent = `${file.name} · ${sizeMB} MB`;

      const uploadArea = document.getElementById("ex-video-upload-area");
      if (uploadArea) uploadArea.classList.add("has-file");
    });
  }

  // Botão remover vídeo atual (ao editar)
  document
    .getElementById("ex-btn-remover-video")
    ?.addEventListener("click", () => {
      if (!confirm("Remover o vídeo deste exercício?")) return;
      _inlineVideoRemover = true;
      _inlineVideoFile = null;
      document.getElementById("ex-video-atual-wrap")?.classList.add("hidden");
      showToast("Vídeo será removido ao salvar", "info");
    });

  // ── Listeners do modal legado de upload ──────────────────
  const fileInput = document.getElementById("video-file-input");
  if (!fileInput) return;

  fileInput.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    // Tamanho máximo: 50 MB
    if (file.size > 50 * 1024 * 1024) {
      showToast("Arquivo muito grande. Máximo permitido: 50 MB", "error");
      this.value = "";
      return;
    }

    const isGif = file.type === "image/gif";
    const isVideo = file.type.startsWith("video/");

    if (!isGif && !isVideo) {
      showToast("Formato inválido. Use MP4, WebM, MOV ou GIF", "error");
      this.value = "";
      return;
    }

    // Valida duração somente para vídeos
    if (isVideo) {
      const duracaoOk = await _validarDuracaoVideo(file);
      if (!duracaoOk) {
        showToast("O vídeo deve ter no máximo 15 segundos ⏱️", "error");
        this.value = "";
        return;
      }
    }

    _videoUploadFile = file;

    // Exibe preview
    const blobUrl = URL.createObjectURL(file);
    document
      .getElementById("video-upload-placeholder")
      ?.classList.add("hidden");
    document.getElementById("video-preview-wrap")?.classList.remove("hidden");

    const vPrev = document.getElementById("video-preview-el");
    const gPrev = document.getElementById("gif-preview-el");

    if (isGif) {
      if (vPrev) vPrev.style.display = "none";
      if (gPrev) {
        gPrev.src = blobUrl;
        gPrev.style.display = "";
      }
    } else {
      if (gPrev) gPrev.style.display = "none";
      if (vPrev) {
        vPrev.src = blobUrl;
        vPrev.style.display = "";
      }
    }

    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const fileInfo = document.getElementById("video-file-info");
    if (fileInfo) fileInfo.textContent = `${file.name} · ${sizeMB} MB`;

    const saveBtn = document.getElementById("btn-salvar-video");
    if (saveBtn) saveBtn.disabled = false;
  });

  document
    .getElementById("btn-close-video-modal")
    ?.addEventListener("click", fecharUploadVideoModal);
  document
    .getElementById("btn-cancelar-video")
    ?.addEventListener("click", fecharUploadVideoModal);
  document
    .getElementById("modal-video-upload")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) fecharUploadVideoModal();
    });

  document
    .getElementById("btn-salvar-video")
    ?.addEventListener("click", confirmarUploadVideo);

  document
    .getElementById("btn-remover-video")
    ?.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja remover o vídeo deste exercício?")) {
        removerVideoExercicio();
      }
    });
}
