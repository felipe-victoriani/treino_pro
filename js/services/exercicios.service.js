/* ============================================================
   TREINO PRO — Exercícios Service
   Gerencia a biblioteca de exercícios no Firebase Realtime DB.
   Responsabilidades:
     - Carregar e cachear todos os exercícios (read-once)
     - Pesquisa fuzzy via Fuse.js
     - Favoritos por professor
     - Recentes por professor (últimos 20, exibe 8)
     - Criar exercícios personalizados
   ============================================================ */

const ExerciciosService = (() => {
  /* ── Estado privado ────────────────────────────────────────── */
  let _cache = null; // { id: {...exercicio} } ativos + custom — seletor/busca
  let _todos = null; // { id: {...exercicio} } catálogo inteiro — só p/ resolver mídia
  let _loading = null; // Promise em andamento (evita chamadas paralelas)

  /* ── Carregar exercícios do Firebase ───────────────────────── */

  function _load() {
    if (_cache) return Promise.resolve(_cache);
    if (_loading) return _loading;

    // Lê o catálogo inteiro: os itens inativos (import em inglês do
    // free-exercise-db) ficam fora do seletor, mas a mídia deles é usada
    // por treinos que guardam o id do catálogo.
    _loading = db
      .ref("exercicios")
      .once("value")
      .then(async (snap) => {
        _cache = {};
        _todos = {};
        snap.forEach((child) => {
          const ex = { id: child.key, ...child.val() };
          _todos[child.key] = ex;
          if (ex.ativo === true) _cache[child.key] = ex;
        });
        // Carregar também exercícios customizados do professor logado
        try {
          const uid = firebase.auth().currentUser?.uid;
          if (uid) {
            const custSnap = await db
              .ref("exerciciosCustom/" + uid)
              .once("value");
            custSnap.forEach((child) => {
              const ex = { id: child.key, ...child.val() };
              _cache[child.key] = ex;
              _todos[child.key] = ex;
            });
          }
        } catch (_) {}
        _loading = null;
        return _cache;
      })
      .catch((err) => {
        _loading = null;
        console.error("[ExerciciosService] Erro ao carregar:", err);
        _cache = {};
        _todos = {};
        return _cache;
      });

    return _loading;
  }

  /* ── API: getAll ───────────────────────────────────────────── */

  async function getAll() {
    const cache = await _load();
    return Object.values(cache);
  }

  /* ── API: search (Fuse.js fuzzy, + filtros booleanos) ──────── */

  async function search(query, filters = {}) {
    const cache = await _load();
    let results = Object.values(cache);

    /* Filtros diretos (igualdade) */
    if (filters.grupoMuscular)
      results = results.filter(
        (e) => e.grupoMuscular === filters.grupoMuscular,
      );
    if (filters.equipamento)
      results = results.filter((e) => e.equipamento === filters.equipamento);
    if (filters.tipo) results = results.filter((e) => e.tipo === filters.tipo);
    if (filters.nivel)
      results = results.filter((e) => e.nivel === filters.nivel);

    /* Sem query → retorna todos os filtrados (max 40) */
    const q = (query || "").trim();
    if (q.length === 0) return results.slice(0, 40);

    /* Busca fuzzy no conjunto já filtrado */
    const fuse = new Fuse(results, {
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

    return fuse.search(q).map((r) => r.item);
  }

  /* ── API: Favoritos ────────────────────────────────────────── */

  async function getFavoritos(professorId) {
    if (!professorId) return {};
    const snap = await db
      .ref(`favoritosProfessor/${professorId}`)
      .once("value");
    return snap.val() || {};
  }

  async function toggleFavorito(professorId, exercicioId) {
    if (!professorId || !exercicioId) return false;
    const ref = db.ref(`favoritosProfessor/${professorId}/${exercicioId}`);
    const snap = await ref.once("value");
    if (snap.exists()) {
      await ref.remove();
      return false;
    } else {
      await ref.set(true);
      return true;
    }
  }

  /* ── API: Recentes ─────────────────────────────────────────── */

  async function getRecentes(professorId) {
    if (!professorId) return [];
    const snap = await db
      .ref(`recentesProfessor/${professorId}`)
      .orderByChild("dataUso")
      .limitToLast(8)
      .once("value");
    const items = [];
    snap.forEach((child) =>
      items.unshift({ _recentKey: child.key, ...child.val() }),
    );
    return items;
  }

  async function registrarRecente(professorId, exercicio) {
    if (!professorId || !exercicio) return;
    try {
      const ref = db.ref(`recentesProfessor/${professorId}`).push();
      await ref.set({
        exercicioId: exercicio.id,
        nome: exercicio.nome || "",
        grupoMuscular: exercicio.grupoMuscular || "",
        dataUso: firebase.database.ServerValue.TIMESTAMP,
      });

      /* Mantém apenas os últimos 20 registros */
      const all = await db
        .ref(`recentesProfessor/${professorId}`)
        .orderByChild("dataUso")
        .once("value");

      const keys = [];
      all.forEach((child) => keys.push(child.key));

      if (keys.length > 20) {
        const extra = keys.slice(0, keys.length - 20);
        const updates = {};
        extra.forEach((k) => {
          updates[k] = null;
        });
        await db.ref(`recentesProfessor/${professorId}`).update(updates);
      }
    } catch (err) {
      /* Registrar recente é não-crítico — silencia erros */
      console.warn("[ExerciciosService] registrarRecente:", err);
    }
  }

  /* ── API: Exercício personalizado ──────────────────────────── */

  async function criarCustomizado(professorId, dados) {
    if (!professorId) throw new Error("professorId obrigatório");

    // Salva em exerciciosCustom/{professorId}/ para evitar conflito de permissão
    const ref = db.ref("exerciciosCustom/" + professorId).push();
    const exercicio = {
      nome: (dados.nome || "").trim(),
      grupoMuscular: dados.grupoMuscular || "",
      equipamento: dados.equipamento || "",
      tipo: dados.tipo || "peso_livre",
      nivel: dados.nivel || "intermediario",
      foco: dados.foco || "hipertrofia",
      instrucoes: dados.instrucoes || "",
      videoUrl: "",
      gifUrl: "",
      ativo: true,
      customizado: true,
      criadoPor: professorId,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    };

    await ref.set(exercicio);
    const id = ref.key;
    const obj = { id, ...exercicio };

    /* Atualiza cache local imediatamente */
    if (_cache) _cache[id] = obj;

    return obj;
  }

  /* ── API: Invalidar cache (ex.: após update externo) ──────── */

  function invalidateCache() {
    _cache = null;
    _todos = null;
    _loading = null;
  }

  /* ── Acesso direto ao cache (sync, após load) ──────────────── */

  function _getCacheSync() {
    return _cache || {};
  }

  /* ── Mídia (GIF/foto) de um exercício de treino ────────────────
     Ordem de busca, da mais confiável para a menos:
       1. mídia própria do exercício (vídeo do professor ou gifUrl salvo)
       2. id do catálogo (exercicioId / id) — treinos da IA e do professor
       3. apelido PT → catálogo (EXERCICIOS_ALIAS) — programas prontos
       4. nome exato no catálogo (nome PT ou nome_original)
     Sem busca aproximada: mídia de outro exercício é pior que nenhuma. */

  let _indiceMidia = null; // { cacheRef, porNome: { nomeNormalizado: url } }

  function _normNome(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function _indice() {
    const cache = _todos || {};
    if (_indiceMidia && _indiceMidia.cacheRef === cache) return _indiceMidia;
    const porNome = {};
    Object.values(cache).forEach((e) => {
      if (!e.gifUrl) return;
      [e.nome, e.nome_original].forEach((n) => {
        const k = _normNome(n);
        if (k && !porNome[k]) porNome[k] = e.gifUrl;
      });
    });
    _indiceMidia = { cacheRef: cache, porNome };
    return _indiceMidia;
  }

  /**
   * Retorna a URL de mídia de um exercício de treino, ou null.
   * Síncrono: requer getAll() já resolvido.
   * @param {{nome?: string, id?: string, exercicioId?: string, gifUrl?: string}} ex
   * @returns {string|null}
   */
  function resolverMidia(ex) {
    if (!ex) return null;
    if (ex.gifUrl) return ex.gifUrl;

    const cache = _todos || {};
    for (const id of [ex.exercicioId, ex.id]) {
      if (id && cache[id]?.gifUrl) return cache[id].gifUrl;
    }

    const { porNome } = _indice();
    const chave = _normNome(ex.nome);
    if (!chave) return null;

    if (typeof EXERCICIOS_ALIAS !== "undefined") {
      const alvo = Object.keys(EXERCICIOS_ALIAS).find(
        (k) => _normNome(k) === chave,
      );
      if (alvo && porNome[_normNome(EXERCICIOS_ALIAS[alvo])]) {
        return porNome[_normNome(EXERCICIOS_ALIAS[alvo])];
      }
    }

    return porNome[chave] || null;
  }

  /**
   * Devolve a lista com gifUrl preenchido onde houver mídia resolvível.
   * @param {Array<object>} exercicios
   * @returns {Array<object>}
   */
  function enriquecerComMidia(exercicios) {
    return (exercicios || []).map((ex) => {
      if (ex.gifUrl || ex.videoUrl) return ex;
      const gifUrl = resolverMidia(ex);
      return gifUrl ? { ...ex, gifUrl } : ex;
    });
  }

  /* ── API Pública ───────────────────────────────────────────── */
  return {
    getAll,
    search,
    getFavoritos,
    toggleFavorito,
    getRecentes,
    registrarRecente,
    criarCustomizado,
    invalidateCache,
    resolverMidia,
    enriquecerComMidia,
    _getCacheSync,
  };
})();
