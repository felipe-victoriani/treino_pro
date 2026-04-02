/* ============================================================
   TREINO PRO — Autocomplete de Exercícios
   Integra Tom Select (UI) + Fuse.js (fuzzy search) com a
   biblioteca de exercícios do Firebase.

   API pública (via window.ExercicioAutocomplete):
     init(professorId)         — carrega exercícios e monta Tom Select
     reset()                   — limpa seleção e filtros
     getSelected()             — retorna o exercício atualmente selecionado
     preselect(id, fallback)   — pré-seleciona exercício (modo edição)
     openCustomModal()         — abre modal de exercício personalizado
   ============================================================ */

(function () {
  /* ── Estado privado ──────────────────────────────────────── */
  let _ts = null; // instância Tom Select
  let _allExs = []; // todos os exercícios carregados
  let _filtered = []; // conjunto após filtros ativos
  let _fuse = null; // instância Fuse.js
  let _filters = {}; // { grupoMuscular?, tipo? }
  let _selected = null; // exercício selecionado
  let _favsMap = {}; // { exercicioId: true }
  let _profId = null; // uid do professor
  let _initialized = false; // exercícios foram carregados ao menos uma vez

  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */

  async function init(professorId) {
    _profId = professorId;

    /* Carrega exercícios apenas na primeira vez */
    if (!_initialized || !_allExs.length) {
      try {
        const [exs, favs] = await Promise.all([
          ExerciciosService.getAll(),
          ExerciciosService.getFavoritos(professorId),
        ]);
        _allExs = exs;
        _favsMap = favs || {};
        _initialized = true;
      } catch (err) {
        console.error("[Autocomplete] Erro ao carregar exercícios:", err);
        _allExs = [];
        _favsMap = {};
      }
    }

    _rebuildFiltered();
    _buildTomSelect();
    _setupFilterChips();
    _setupFavoriteBtn();
    _setupCustomModal();
  }

  /* ──────────────────────────────────────────────────────────
     FUSE + LISTA FILTRADA
  ────────────────────────────────────────────────────────── */

  function _rebuildFiltered() {
    _filtered = _allExs.filter((ex) => {
      if (_filters.grupoMuscular && ex.grupoMuscular !== _filters.grupoMuscular)
        return false;
      if (_filters.tipo && ex.tipo !== _filters.tipo) return false;
      return true;
    });

    _fuse = new Fuse(_filtered, {
      keys: [
        { name: "nome", weight: 0.55 },
        { name: "grupoMuscular", weight: 0.2 },
        { name: "equipamento", weight: 0.15 },
        { name: "foco", weight: 0.07 },
        { name: "tipo", weight: 0.03 },
      ],
      threshold: 0.42,
      minMatchCharLength: 1,
      includeScore: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     TOM SELECT
  ────────────────────────────────────────────────────────── */

  function _buildTomSelect() {
    if (_ts) {
      try {
        _ts.destroy();
      } catch (_) {}
      _ts = null;
    }

    const el = document.getElementById("ex-exercicio-select");
    if (!el) return;

    /* Limpa option nativa do select para evitar duplicatas */
    el.innerHTML = "";

    _ts = new TomSelect(el, {
      options: _filtered,
      valueField: "id",
      labelField: "nome",
      searchField: ["nome"] /* sobrescrito pelo score abaixo */,
      maxOptions: 30,
      openOnFocus: true,
      placeholder: "Buscar por nome, músculo ou equipamento...",
      closeAfterSelect: true,

      /* ── Pontuação fuzzy via Fuse.js ────────────────────── */
      score(search) {
        const q = (search || "").trim();
        if (!q) return () => 1;

        const results = _fuse.search(q);
        const map = new Map(
          results.map((r) => [r.item.id, Math.max(0.01, 1 - (r.score || 0))]),
        );
        return (item) => map.get(item.id) || 0;
      },

      render: {
        option: _renderOption,
        item: _renderItem,
        no_results: _renderNoResults,
      },

      onChange(value) {
        _onSelect(value || null);
      },
    });
  }

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */

  function _renderOption(data, escape) {
    const fav = _favsMap[data.id]
      ? '<span class="ts-tag ts-tag-fav">★</span>'
      : "";
    const cust = data.customizado
      ? '<span class="ts-tag ts-tag-custom">✨ Custom</span>'
      : "";
    return `
      <div class="ts-ex-option">
        <div class="ts-ex-name">${escape(data.nome || "")}</div>
        <div class="ts-ex-meta">
          ${data.grupoMuscular ? `<span class="ts-tag ts-tag-muscle">${escape(_fmtGrupo(data.grupoMuscular))}</span>` : ""}
          ${data.tipo ? `<span class="ts-tag ts-tag-type">${escape(_fmtTipo(data.tipo))}</span>` : ""}
          ${data.nivel ? `<span class="ts-tag ts-tag-level">${escape(_fmtNivel(data.nivel))}</span>` : ""}
          ${cust}${fav}
        </div>
      </div>`;
  }

  function _renderItem(data, escape) {
    return `
      <div class="ts-ex-item">
        <span>${escape(data.nome || "")}</span>
        ${
          data.grupoMuscular
            ? `<span class="ts-tag ts-tag-muscle ts-tag-sm">${escape(_fmtGrupo(data.grupoMuscular))}</span>`
            : ""
        }
      </div>`;
  }

  function _renderNoResults() {
    return `
      <div class="ts-no-results">
        <p>Nenhum exercício encontrado</p>
        <button type="button" class="btn-link ts-create-btn"
                onclick="ExercicioAutocomplete.openCustomModal()">
          + Criar exercício personalizado
        </button>
      </div>`;
  }

  /* ──────────────────────────────────────────────────────────
     SELEÇÃO
  ────────────────────────────────────────────────────────── */

  function _onSelect(id) {
    if (!id) {
      _selected = null;
      _hideInfoPanel();
      _clearHiddenFields();
      return;
    }

    const ex = _allExs.find((e) => e.id === id);
    if (!ex) return;

    _selected = ex;
    _fillHiddenFields(ex);
    _showInfoPanel(ex);

    /* Recente (fire-and-forget) */
    if (_profId) {
      ExerciciosService.registrarRecente(_profId, ex).catch(() => {});
    }
  }

  function _fillHiddenFields(ex) {
    _setVal("ex-nome", ex.nome || "");
    _setVal("ex-exercicio-id", ex.id || "");
    _setVal("ex-grupo-muscular", ex.grupoMuscular || "");
    _setVal("ex-tipo", ex.tipo || "");
    _setVal("ex-instrucoes", ex.instrucoes || "");
  }

  function _clearHiddenFields() {
    [
      "ex-nome",
      "ex-exercicio-id",
      "ex-grupo-muscular",
      "ex-tipo",
      "ex-instrucoes",
    ].forEach((id) => _setVal(id, ""));
  }

  /* ──────────────────────────────────────────────────────────
     PAINEL DE INFORMAÇÕES
  ────────────────────────────────────────────────────────── */

  function _showInfoPanel(ex) {
    const panel = document.getElementById("ex-info-panel");
    if (!panel) return;

    panel.classList.remove("hidden");
    _setText("ex-info-nome", ex.nome || "");
    _setText("ex-info-grupo", _fmtGrupo(ex.grupoMuscular));
    _setText("ex-info-tipo", _fmtTipo(ex.tipo));
    _setText("ex-info-nivel", _fmtNivel(ex.nivel));
    _setText(
      "ex-info-instrucoes",
      ex.instrucoes || "Sem instruções cadastradas.",
    );

    /* Botão favorito */
    const isFav = !!_favsMap[ex.id];
    const btn = document.getElementById("ex-fav-btn");
    if (btn) {
      btn.textContent = isFav ? "★" : "☆";
      btn.title = isFav ? "Remover dos favoritos" : "Adicionar aos favoritos";
      btn.classList.toggle("is-fav", isFav);
    }
  }

  function _hideInfoPanel() {
    document.getElementById("ex-info-panel")?.classList.add("hidden");
  }

  /* ──────────────────────────────────────────────────────────
     FILTROS (chips de grupo muscular e tipo)
  ────────────────────────────────────────────────────────── */

  function _setupFilterChips() {
    document.querySelectorAll(".ex-filter-chip").forEach((chip) => {
      /* Remove listener antigo clonando o nó */
      const fresh = chip.cloneNode(true);
      chip.parentNode.replaceChild(fresh, chip);

      fresh.addEventListener("click", () => {
        const key = fresh.dataset.filter;
        const val = fresh.dataset.value;

        if (_filters[key] === val) {
          /* Toggle off */
          delete _filters[key];
          fresh.classList.remove("active");
        } else {
          /* Desativa outros chips do mesmo grupo */
          document
            .querySelectorAll(`.ex-filter-chip[data-filter="${key}"]`)
            .forEach((c) => c.classList.remove("active"));
          _filters[key] = val;
          fresh.classList.add("active");
        }

        _rebuildFiltered();

        if (_ts) {
          _ts.clearOptions();
          _ts.addOptions(_filtered);
          _ts.refreshOptions(false);
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     FAVORITO
  ────────────────────────────────────────────────────────── */

  function _setupFavoriteBtn() {
    const btn = document.getElementById("ex-fav-btn");
    if (!btn) return;

    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    fresh.addEventListener("click", async () => {
      if (!_selected || !_profId) return;
      try {
        const isFav = await ExerciciosService.toggleFavorito(
          _profId,
          _selected.id,
        );
        _favsMap[_selected.id] = isFav || undefined;
        if (!isFav) delete _favsMap[_selected.id];

        fresh.textContent = isFav ? "★" : "☆";
        fresh.title = isFav
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos";
        fresh.classList.toggle("is-fav", isFav);

        showToast(
          isFav ? "Adicionado aos favoritos!" : "Removido dos favoritos",
          "success",
        );
      } catch (_) {
        showToast("Erro ao atualizar favorito", "error");
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     MODAL: EXERCÍCIO PERSONALIZADO
  ────────────────────────────────────────────────────────── */

  function _setupCustomModal() {
    const wire = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener("click", fn);
    };

    wire("btn-criar-custom", openCustomModal);
    wire("btn-close-custom-modal", closeCustomModal);
    wire("btn-cancel-custom", closeCustomModal);
    wire("btn-salvar-custom", _salvarCustom);

    /* Fechar clicando no overlay */
    const overlay = document.getElementById("custom-exercise-modal");
    if (overlay) {
      const fresh = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(fresh, overlay);
      fresh.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeCustomModal();
      });

      /* Re-wiring interno após cloneNode */
      fresh
        .querySelector("#btn-close-custom-modal")
        ?.addEventListener("click", closeCustomModal);
      fresh
        .querySelector("#btn-cancel-custom")
        ?.addEventListener("click", closeCustomModal);
      fresh
        .querySelector("#btn-salvar-custom")
        ?.addEventListener("click", _salvarCustom);
      fresh
        .querySelector("#btn-criar-custom-inside")
        ?.addEventListener("click", openCustomModal);
    }
  }

  function openCustomModal() {
    const modal = document.getElementById("custom-exercise-modal");
    if (modal) modal.classList.remove("hidden");
    document.getElementById("custom-ex-nome")?.focus();
  }

  function closeCustomModal() {
    document.getElementById("custom-exercise-modal")?.classList.add("hidden");
    /* Limpa campos do modal */
    ["custom-ex-nome", "custom-ex-instrucoes"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    [
      "custom-ex-grupo",
      "custom-ex-tipo",
      "custom-ex-nivel",
      "custom-ex-foco",
      "custom-ex-equipamento",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });
  }

  async function _salvarCustom() {
    if (!_profId) return;
    const nome = document.getElementById("custom-ex-nome")?.value.trim();
    if (!nome) {
      showToast("Informe o nome do exercício", "warning");
      return;
    }

    const dados = {
      nome,
      grupoMuscular: document.getElementById("custom-ex-grupo")?.value || "",
      equipamento:
        document.getElementById("custom-ex-equipamento")?.value || "",
      tipo: document.getElementById("custom-ex-tipo")?.value || "peso_livre",
      nivel:
        document.getElementById("custom-ex-nivel")?.value || "intermediario",
      foco: document.getElementById("custom-ex-foco")?.value || "hipertrofia",
      instrucoes: document.getElementById("custom-ex-instrucoes")?.value || "",
    };

    const saveBtn = document.getElementById("btn-salvar-custom");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Criando...";
    }

    try {
      const ex = await ExerciciosService.criarCustomizado(_profId, dados);
      _allExs.push(ex);
      _rebuildFiltered();

      if (_ts) {
        _ts.addOption(ex);
        _ts.setValue(ex.id); /* dispara onChange → _onSelect */
      }

      closeCustomModal();
      showToast("Exercício personalizado criado!", "success");
    } catch (err) {
      showToast("Erro ao criar exercício", "error");
      console.error("[Autocomplete] criarCustomizado:", err);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Criar exercício";
      }
    }
  }

  /* ──────────────────────────────────────────────────────────
     PRÉ-SELEÇÃO (modo edição)
  ────────────────────────────────────────────────────────── */

  /**
   * Pré-seleciona um exercício no Tom Select sem disparar registro de recente.
   * @param {string} exercicioId  — ID na biblioteca (pode ser null/vazio)
   * @param {Object} fallbackData — dados do exercício no treino (nome, etc.)
   */
  function preselect(exercicioId, fallbackData) {
    if (!_ts) return;

    _ts.clear(true); /* silent clear */

    /* Tenta encontrar pelo ID na biblioteca */
    if (exercicioId) {
      const found = _allExs.find((e) => e.id === exercicioId);
      if (found) {
        if (!_ts.options[exercicioId]) _ts.addOption(found, true);
        _ts.addItem(exercicioId, true); /* silent add */
        /* Preenche painel e campos hidden manualmente (sem registrar recente) */
        _selected = found;
        _fillHiddenFields(found);
        _showInfoPanel(found);
        return;
      }
    }

    /* Fallback: cria opção sintética com dados do treino */
    if (fallbackData && fallbackData.nome) {
      const synthId = "__presel__" + Date.now();
      const synth = {
        id: synthId,
        nome: fallbackData.nome || "",
        grupoMuscular: fallbackData.grupoMuscular || "",
        tipo: fallbackData.tipo || "",
        nivel: "",
        instrucoes: fallbackData.instrucoes || "",
        customizado: false,
      };
      _allExs.push(synth);
      _rebuildFiltered();

      _ts.addOption(synth, true);
      _ts.addItem(synthId, true);

      _selected = synth;
      _fillHiddenFields({ ...synth, id: fallbackData.exercicioId || "" });
      _showInfoPanel(synth);
    }
  }

  /* ──────────────────────────────────────────────────────────
     RESET (abrir form vazio)
  ────────────────────────────────────────────────────────── */

  function reset() {
    _selected = null;
    _filters = {};

    if (_ts) {
      _ts.clear(true);
      _ts.clearOptions();
      _ts.addOptions(_filtered);
    }

    _hideInfoPanel();
    _clearHiddenFields();

    document
      .querySelectorAll(".ex-filter-chip")
      .forEach((c) => c.classList.remove("active"));
  }

  /* ──────────────────────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────────────────────── */

  const _grupoLabel = {
    peito: "Peito",
    costas: "Costas",
    pernas: "Pernas",
    ombros: "Ombros",
    biceps: "Bíceps",
    triceps: "Tríceps",
    gluteos: "Glúteos",
    abdomen: "Abdômen",
    cardio: "Cardio",
    mobilidade: "Mobilidade",
  };
  const _tipoLabel = {
    peso_livre: "Peso Livre",
    maquina: "Máquina",
    cabo: "Cabo",
    cardio: "Cardio",
    funcional: "Funcional",
    alongamento: "Alongamento",
    mobilidade: "Mobilidade",
    peso_corporal: "Peso Corporal",
  };
  const _nivelLabel = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
  };

  function _fmtGrupo(v) {
    return _grupoLabel[v] || v || "";
  }
  function _fmtTipo(v) {
    return _tipoLabel[v] || v || "";
  }
  function _fmtNivel(v) {
    return _nivelLabel[v] || v || "";
  }

  function _setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  }
  function _setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt || "";
  }

  /* ──────────────────────────────────────────────────────────
     API PÚBLICA
  ────────────────────────────────────────────────────────── */

  window.ExercicioAutocomplete = {
    init,
    reset,
    preselect,
    getSelected: () => _selected,
    openCustomModal,
  };
})();
