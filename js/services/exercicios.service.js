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
  let _cache = null; // { id: {...exercicio} }  — populado após _load()
  let _loading = null; // Promise em andamento (evita chamadas paralelas)

  /* ── Carregar exercícios do Firebase ───────────────────────── */

  function _load() {
    if (_cache) return Promise.resolve(_cache);
    if (_loading) return _loading;

    _loading = db
      .ref("exercicios")
      .orderByChild("ativo")
      .equalTo(true)
      .once("value")
      .then(async (snap) => {
        _cache = {};
        snap.forEach((child) => {
          _cache[child.key] = { id: child.key, ...child.val() };
        });
        // Carregar também exercícios customizados do professor logado
        try {
          const uid = firebase.auth().currentUser?.uid;
          if (uid) {
            const custSnap = await db
              .ref("exerciciosCustom/" + uid)
              .once("value");
            custSnap.forEach((child) => {
              _cache[child.key] = { id: child.key, ...child.val() };
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
    _loading = null;
  }

  /* ── Acesso direto ao cache (sync, após load) ──────────────── */

  function _getCacheSync() {
    return _cache || {};
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
    _getCacheSync,
  };
})();
