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
  const EQUIPAMENTOS_MAP = {
    "Academia completa": [
      "Barra",
      "Halteres",
      "Cabo / Pulley",
      "Máquina",
      "Kettlebell",
      "Barra W",
      "Peso Corporal",
    ],
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

  // ── Compatibilidade com schema antigo (seed) ─────────────
  // Grupo muscular: novo formato → antigo
  const MUSCULO_NEW_TO_OLD = {
    Peitoral: "peito",
    Costas: "costas",
    Pernas: "pernas",
    Ombros: "ombros",
    Bíceps: "biceps",
    Tríceps: "triceps",
    Abdômen: "abdomen",
    Glúteos: "gluteos",
    Panturrilha: "panturrilha",
    Antebraço: "antebraco",
  };

  // Nível: antigo → novo
  const NIVEL_OLD_TO_NEW = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
  };

  // Equipamento: antigo → novo
  const EQUIP_OLD_TO_NEW = {
    barra: "Barra",
    barra_w: "Barra W",
    haltere: "Halteres",
    cabo: "Cabo / Pulley",
    maquina: "Máquina",
    kettlebell: "Kettlebell",
    sem_equipamento: "Sem Equipamento",
    peso_corporal: "Peso Corporal",
    funcional: "Peso Corporal",
  };

  /* ── 1. Buscar exercícios do Firebase ───────────────────── */

  async function _buscarExercicios({ grupoMuscular, equipamentos, nivel }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;
    const niveisOk = NIVEIS_PERMITIDOS[nivelPT] || Object.values(NIVEL_PT);
    const equipFiltro = EQUIPAMENTOS_MAP[equipamentos] ?? null;

    // Valor equivalente no schema antigo (ex: "Peitoral" → "peito")
    const grupoOld =
      MUSCULO_NEW_TO_OLD[grupoMuscular] || grupoMuscular.toLowerCase();

    // Carrega todos os exercícios e filtra em memória para suportar
    // tanto o schema novo (musculo_principal) quanto o antigo (grupoMuscular)
    const snap = await db.ref("exercicios").once("value");

    const lista = [];
    snap.forEach((child) => {
      const val = child.val();

      const musculoMatch =
        val.musculo_principal === grupoMuscular ||
        val.grupoMuscular === grupoOld;
      if (!musculoMatch) return;

      // Normaliza campos do schema antigo para o novo formato
      lista.push({
        id: child.key,
        ...val,
        nome_original: val.nome_original || val.nome,
        nivel: NIVEL_OLD_TO_NEW[val.nivel] || val.nivel,
        equipamento: EQUIP_OLD_TO_NEW[val.equipamento] || val.equipamento,
        musculo_principal: val.musculo_principal || grupoMuscular,
      });
    });

    return lista.filter((ex) => {
      if (ex.ativo === false) return false;
      // Se o exercício não tem nível definido, aceita (não penaliza por dado ausente)
      if (ex.nivel && !niveisOk.includes(ex.nivel)) return false;
      // Se o exercício não tem equipamento definido, aceita
      if (
        equipFiltro &&
        ex.equipamento &&
        !equipFiltro.includes(ex.equipamento)
      )
        return false;
      return true;
    });
  }

  /* ── 2. Montar o prompt ─────────────────────────────────── */

  function _construirPrompt({ nivel, objetivo, grupoMuscular, exercicios }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;

    const listaStr = exercicios
      .map(
        (ex) =>
          `• ID: "${ex.id}" | NomeOriginal: "${ex.nome_original}" | ` +
          `Equipamento: "${ex.equipamento || "?"}" | ` +
          `Mecânica: "${ex.mecanica || "?"}" | ` +
          `Força: "${ex.forca || "?"}" | ` +
          `Nível: "${ex.nivel || "?"}"`,
      )
      .join("\n");

    return `Você é um personal trainer certificado (CREF) com especialização em musculação e fisiologia do exercício. Responda SEMPRE em português do Brasil.

INSTRUÇÃO CRÍTICA — TRADUÇÃO OBRIGATÓRIA:
- O campo "nome" no JSON DEVE ser a tradução para português do campo NomeOriginal
- NUNCA use nomes em inglês no campo "nome"
- Exemplos:
  "Barbell Bench Press" → "Supino Reto com Barra"
  "Dumbbell Curl" → "Rosca Direta com Halteres"
  "Pull-Up" → "Barra Fixa"
  "Squat" → "Agachamento Livre"
  "Deadlift" → "Levantamento Terra"
  "Shoulder Press" → "Desenvolvimento de Ombros"
  "Lat Pulldown" → "Puxada na Polia Alta"
  "Leg Press" → "Leg Press 45°"
  "Tricep Pushdown" → "Tríceps Polia Alta"
  "Dumbbell Fly" → "Crucifixo com Halteres"
  "Romanian Deadlift" → "Levantamento Terra Romeno"
  "Incline Bench Press" → "Supino Inclinado"
  "Cable Row" → "Remada na Polia Baixa"
  "Leg Curl" → "Mesa Flexora"
  "Leg Extension" → "Cadeira Extensora"

Monte um treino usando APENAS os exercícios da lista abaixo.
NUNCA invente exercícios fora desta lista.

DADOS DO ALUNO:
- Nível: ${nivelPT}
- Objetivo: ${objetivo}
- Grupo muscular do dia: ${grupoMuscular}

EXERCÍCIOS DISPONÍVEIS (${exercicios.length} no total):
${listaStr}

METODOLOGIA PROFISSIONAL — SELEÇÃO DE EXERCÍCIOS:
1. Use SOMENTE exercícios da lista acima (campo ID exatamente como está)
2. Não repita o mesmo exercício
3. Ordem obrigatória: multi-articulares/compostos primeiro → mono-articulares/isoladores por último
4. Varie os ângulos de estímulo (ex: supino reto + supino inclinado + crucifixo)
5. Inclua ao menos 1 exercício de força livre (barra ou halter) quando disponível
6. Para Avançado: aplique princípios de sobrecarga progressiva (inclua 1 drop-set ou superset na dica_execucao)

VOLUME E INTENSIDADE POR NÍVEL (respeite exatamente):
- Iniciante:    EXATAMENTE 6 exercícios | 3 séries | 12-15 reps | Ênfase em aprendizado motor
- Intermediário: EXATAMENTE 7 exercícios | 4 séries | 8-12 reps  | Ênfase em hipertrofia
- Avançado:     EXATAMENTE 8 exercícios | 4-5 séries | 6-15 reps | Periodização ondulatória (varie rep range entre os exercícios)

DESCANSO ENTRE SÉRIES:
- Exercício composto (multi-articular): 90-120s
- Exercício isolador (mono-articular): 45-60s
- Avançado em superset: 30s entre exercícios do par, 90s após completar o par

DICA DE EXECUÇÃO (campo dica_execucao):
- Iniciante: foco em postura, respiração e amplitude de movimento
- Intermediário: foco em contração máxima e controle excêntrico (3s na fase de descida)
- Avançado: técnicas avançadas (drop-set, rest-pause, superset antagonista) quando aplicável

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
