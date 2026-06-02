/* ============================================================
   TREINO PRO — Serviço de Geração de Treino com IA (Claude Haiku)
   Fluxo:
     1. Busca exercícios do Firebase filtrados por músculo,
        equipamento e nível do aluno
     2. Monta o prompt para o Claude
     3. Chama a Cloud Function gerarTreino
     4. Salva o treino gerado em /treinos/{uid}/{data}/{musculo}
     5. Retorna o treino para exibição no app
   ============================================================ */

const TreinoIAService = (() => {
  /* ── Mapeamentos ────────────────────────────────────────── */

  // Formato do app → português do Firebase
  const NIVEL_PT = {
    INICIANTE: "Iniciante",
    INTERMEDIARIO: "Intermediário",
    AVANCADO: "Avançado",
  };

  // Quais níveis de exercício cada aluno pode usar
  const NIVEIS_PERMITIDOS = {
    Iniciante: ["Iniciante"],
    Intermediário: ["Iniciante", "Intermediário"],
    Avançado: ["Iniciante", "Intermediário", "Avançado"],
  };

  // Equipamentos permitidos por escolha do aluno
  // null = sem filtro (tudo disponível)
  const EQUIPAMENTOS_MAP = {
    "Academia completa": null,
    Halteres: [
      "Halteres",
      "Barra",
      "Barra W",
      "Peso Corporal",
      "Cabo / Pulley",
      "Máquina",
    ],
    "Sem equipamento": ["Peso Corporal", "Sem Equipamento"],
  };

  /* ── 1. Buscar exercícios do Firebase ───────────────────── */

  async function _buscarExercicios({ grupoMuscular, equipamentos, nivel }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;
    const niveisOk = NIVEIS_PERMITIDOS[nivelPT] || Object.values(NIVEL_PT);
    const equipFiltro = EQUIPAMENTOS_MAP[equipamentos] ?? null;

    const snap = await db
      .ref("exercicios")
      .orderByChild("musculo_principal")
      .equalTo(grupoMuscular)
      .once("value");

    const lista = [];
    snap.forEach((child) => lista.push(child.val()));

    return lista.filter((ex) => {
      if (ex.ativo === false) return false;
      if (!niveisOk.includes(ex.nivel)) return false;
      if (equipFiltro && !equipFiltro.includes(ex.equipamento)) return false;
      return true;
    });
  }

  /* ── 2. Montar o prompt ─────────────────────────────────── */

  function _construirPrompt({ nivel, objetivo, grupoMuscular, exercicios }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;

    const listaStr = exercicios
      .map(
        (ex) =>
          `• ID: "${ex.id}" | Nome: "${ex.nome_original}" | ` +
          `Equipamento: "${ex.equipamento || "?"}" | ` +
          `Mecânica: "${ex.mecanica || "?"}" | ` +
          `Força: "${ex.forca || "?"}" | ` +
          `Nível: "${ex.nivel || "?"}"`,
      )
      .join("\n");

    return `Você é um personal trainer especialista.
Monte um treino usando APENAS os exercícios da lista abaixo.
NUNCA invente exercícios fora desta lista.

DADOS DO ALUNO:
- Nível: ${nivelPT}
- Objetivo: ${objetivo}
- Grupo muscular: ${grupoMuscular}

EXERCÍCIOS DISPONÍVEIS (${exercicios.length} no total):
${listaStr}

REGRAS OBRIGATÓRIAS:
1. Use SOMENTE exercícios da lista acima (use o campo ID exatamente como está na lista)
2. Nunca repita o mesmo padrão de movimento
3. Máximo 1 exercício por ângulo (reto, inclinado, declinado)
4. Comece sempre com exercício composto (mecanica: Composto)
5. Finalize com isoladores (mecanica: Isolador)
6. Não coloque dois exercícios com mesmo equipamento seguidos

VOLUME:
- Iniciante: 3 exercícios, 3 séries, 12-15 reps
- Intermediário: 4-5 exercícios, 3-4 séries, 10-12 reps
- Avançado: 5-6 exercícios, 4 séries, 6-12 reps

DESCANSO:
- Exercício Composto: 90-120s
- Exercício Isolador: 60s

VALIDAÇÃO ANTES DE RESPONDER:
✓ Todos os exercícios estão na lista fornecida?
✓ Existe algum exercício redundante? Se sim, troque.
✓ A ordem está correta (composto → isolador)?
✓ Há variação de equipamentos?

Retorne APENAS este JSON, sem texto adicional:
{
  "treino": {
    "nivel": "",
    "objetivo": "",
    "grupo_muscular": "",
    "exercicios": [
      {
        "id": "",
        "nome": "",
        "musculo_principal": "",
        "musculo_secundario": "",
        "series": 0,
        "repeticoes": "",
        "descanso_segundos": 0,
        "tipo": "composto | isolador",
        "dica_execucao": ""
      }
    ]
  }
}`;
  }

  /* ── 3. Chamar Cloud Function ───────────────────────────── */

  async function _chamarCloudFunction(prompt) {
    if (!window.functions) {
      throw new Error(
        "Firebase Functions não está inicializado. " +
          "Certifique-se de que o SDK firebase-functions-compat.js está carregado.",
      );
    }

    const fn = window.functions.httpsCallable("gerarTreino", {
      timeout: 60000,
    });

    const result = await fn({ prompt });

    const treino = result.data?.treino;
    if (!treino || !Array.isArray(treino.exercicios)) {
      throw new Error("A Cloud Function não retornou um treino válido.");
    }

    return treino;
  }

  /* ── 4. Salvar treino no Firebase ───────────────────────── */

  async function _salvarTreino({ uid, treino, grupoMuscular }) {
    const data = new Date().toISOString().split("T")[0]; // "2026-06-02"
    const musculoKey = grupoMuscular
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();

    await db.ref(`treinos/${uid}/${data}/${musculoKey}`).set({
      ...treino,
      geradoEm: Date.now(),
      uid,
    });
  }

  /* ── API pública ────────────────────────────────────────── */

  /**
   * Gera um treino para o aluno usando exercícios do Firebase + Claude.
   *
   * @param {object} params
   * @param {string} params.uid           - UID do aluno no Firebase Auth
   * @param {string} params.nivel         - "INICIANTE" | "INTERMEDIARIO" | "AVANCADO"
   * @param {string} params.objetivo      - ex: "Hipertrofia", "Emagrecimento"
   * @param {string} params.grupoMuscular - Grupo em português, ex: "Peitoral", "Costas"
   * @param {string} params.equipamentos  - "Academia completa" | "Halteres" | "Sem equipamento"
   *
   * @returns {Promise<object>} Objeto treino retornado pelo Claude
   */
  async function gerar({ uid, nivel, objetivo, grupoMuscular, equipamentos }) {
    if (!uid) throw new Error("uid é obrigatório");
    if (!grupoMuscular) throw new Error("grupoMuscular é obrigatório");
    if (!objetivo) throw new Error("objetivo é obrigatório");

    // 1. Buscar exercícios filtrados do Firebase
    const exercicios = await _buscarExercicios({
      grupoMuscular,
      equipamentos: equipamentos || "Academia completa",
      nivel: nivel || "INICIANTE",
    });

    if (exercicios.length < 3) {
      throw new Error(
        `Exercícios insuficientes para "${grupoMuscular}" com os filtros atuais ` +
          `(encontrados: ${exercicios.length}). Tente mudar o equipamento ou nível.`,
      );
    }

    // 2. Montar prompt
    const prompt = _construirPrompt({
      nivel,
      objetivo,
      grupoMuscular,
      exercicios,
    });

    // 3. Chamar Cloud Function → Claude
    const treino = await _chamarCloudFunction(prompt);

    // 4. Salvar resultado no Firebase
    await _salvarTreino({ uid, treino, grupoMuscular });

    // 5. Retornar treino para o app
    return treino;
  }

  /**
   * Retorna apenas a lista de exercícios disponíveis para um grupo muscular,
   * sem gerar treino. Útil para pré-visualização ou debug.
   */
  async function listarExercicios({ grupoMuscular, equipamentos, nivel }) {
    return _buscarExercicios({ grupoMuscular, equipamentos, nivel });
  }

  return { gerar, listarExercicios };
})();
