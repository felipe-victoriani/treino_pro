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
      return `
    <div class="exercise-card-prof" data-id="${sanitize(ex.id)}">
      <div class="exercise-card-header">
        <span class="exercise-number">${i + 1}</span>
        <div class="exercise-info">
          <strong>${sanitize(ex.nome || "")}</strong>
          <div class="exercise-badges">${grupoLabel}${tipoLabel}</div>
          <span class="exercise-meta">
            ${sanitize(ex.series || "")} séries × ${sanitize(ex.repeticoes || "")} 
            ${ex.carga ? "| " + sanitize(ex.carga) : ""}
            ${ex.descanso ? "| " + sanitize(ex.descanso) + "s descanso" : ""}
          </span>
          ${ex.observacoes ? `<span class="exercise-obs">${sanitize(ex.observacoes)}</span>` : ""}
        </div>
        <div class="exercise-actions">
          <button class="btn-icon" onclick="duplicarExercicio('${sanitize(ex.id)}')" title="Duplicar">📋</button>
          <button class="btn-icon" onclick="editarExercicio('${sanitize(ex.id)}')" title="Editar">✏️</button>
          <button class="btn-icon btn-danger-icon" onclick="removerExercicio('${sanitize(ex.id)}')" title="Remover">🗑️</button>
        </div>
      </div>
    </div>`;
    })
    .join("");
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
      ordem,
    };

    if (editandoExercicioId) {
      await db
        .ref(`treinos/${alunoId}/${letra}/exercicios/${editandoExercicioId}`)
        .update(exercicioData);
      showToast("Exercício atualizado!", "success");
    } else {
      await db
        .ref(`treinos/${alunoId}/${letra}/exercicios`)
        .push(exercicioData);
      showToast("Exercício adicionado!", "success");
    }

    limparFormExercicio();
    loadTreinoProfessor(alunoId, letra);
    /* Ocultar form após salvar */
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

  formEl?.scrollIntoView({ behavior: "smooth" });
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
  ["ex-series", "ex-reps", "ex-carga", "ex-descanso", "ex-obs"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );
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
 * @param {Object} historico  { exerciciosCompletos: {} }
 */
async function loadTreinoAluno(
  alunoId,
  letra,
  listContainerId,
  historico = {},
) {
  const listEl = document.getElementById(listContainerId);
  if (!listEl) return;

  listEl.innerHTML =
    '<div class="loading-inline"><div class="spinner-sm"></div><p>Carregando exercícios...</p></div>';

  try {
    const snap = await db.ref(`treinos/${alunoId}/${letra}`).once("value");
    const data = snap.val();

    if (!data || !data.exercicios) {
      listEl.innerHTML = `
        <div class="empty-state">
          <h3>Treino ${sanitize(letra)} sem exercícios</h3>
          <p>Aguarde seu professor adicionar exercícios.</p>
        </div>`;
      return;
    }

    const completados = historico.exerciciosCompletos || {};
    const exercicios = Object.entries(data.exercicios)
      .map(([id, ex]) => ({ id, ...ex }))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    renderExerciciosAluno(listEl, exercicios, completados, alunoId, letra);
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
 * Renderiza a checklist de exercícios para o aluno
 */
function renderExerciciosAluno(
  container,
  exercicios,
  completados,
  alunoId,
  letra,
) {
  container.innerHTML = exercicios
    .map((ex) => {
      const done = !!completados[ex.id];
      const exIdSafe = ex.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      return `
      <div class="exercise-check-card ${done ? "completed" : ""}" id="excard-${exIdSafe}"
           onclick="toggleExercicio('${exIdSafe}', '${sanitize(alunoId)}', '${sanitize(letra)}')">
        <div class="ex-check-icon ${done ? "done" : ""}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="exercise-check-info">
          <div class="exercise-check-nome">${sanitize(ex.nome)}</div>
          <div class="exercise-check-meta">
            ${sanitize(ex.series)} séries × ${sanitize(ex.repeticoes)}
            ${ex.carga ? " · " + sanitize(ex.carga) : ""}
            ${ex.descanso ? " · " + sanitize(ex.descanso) + "s descanso" : ""}
          </div>
          ${ex.observacoes ? `<div class="exercise-check-obs">💡 ${sanitize(ex.observacoes)}</div>` : ""}
        </div>
      </div>`;
    })
    .join("");
}

/**
 * Alterna o estado de conclusão de um exercício no Firebase
 */
async function toggleExercicio(exId, alunoId, letra) {
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

    showToast(
      `Treino ${letra} finalizado! 🎉 Próximo: ${proxLetra || letra}`,
      "success",
    );

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
