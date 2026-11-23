/* ============================================================
   TREINO PRO — Serviço de Geração de Treino com IA (Claude Haiku)
   Fluxo:
     1. Busca exercícios do Firebase filtrados por músculo,
        equipamento e nível do aluno (um ou vários grupos por treino)
     2. Divide o total do nível entre os grupos e monta o prompt
     3. Chama a Cloud Function gerarTreino (1 chamada por treino)
     4. Completa grupos que a IA deixou de fora
     5. Salva o treino gerado em /treinos/{uid}/{data}/{musculos}
     6. Retorna o treino para exibição no app
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

  // O catálogo inteiro é baixado uma vez e reaproveitado por 5 min:
  // um plano de 5 dias com 2 grupos/dia faria ~7 downloads sem isso.
  const CACHE_MS = 5 * 60 * 1000;
  let _cacheCatalogo = null; // { em: timestamp, promessa: Promise<snapshot> }

  function _catalogo() {
    if (!_cacheCatalogo || Date.now() - _cacheCatalogo.em > CACHE_MS) {
      const promessa = db.ref("exercicios").once("value");
      _cacheCatalogo = { em: Date.now(), promessa };
      // falhou → não guarda o erro; a próxima chamada tenta de novo
      promessa.catch(() => {
        if (_cacheCatalogo?.promessa === promessa) _cacheCatalogo = null;
      });
    }
    return _cacheCatalogo.promessa;
  }

  async function _buscarExercicios({
    grupoMuscular,
    equipamentos,
    nivel,
    incluirInativos = false,
  }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;
    const niveisOk = NIVEIS_PERMITIDOS[nivelPT] || Object.values(NIVEL_PT);
    const equipFiltro = EQUIPAMENTOS_MAP[equipamentos] ?? null;

    // Valor equivalente no schema antigo (ex: "Peitoral" → "peito")
    const grupoOld =
      MUSCULO_NEW_TO_OLD[grupoMuscular] || grupoMuscular.toLowerCase();

    // Carrega todos os exercícios e filtra em memória para suportar
    // tanto o schema novo (musculo_principal) quanto o antigo (grupoMuscular)
    const snap = await _catalogo();

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
      // inativos = import em inglês (fora da busca do professor). A IA
      // traduz o nome, então servem quando o catálogo PT é pequeno.
      if (ex.ativo === false && !incluirInativos) return false;
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

  // Total de exercícios por treino, por nível
  const TOTAL_POR_NIVEL = { Iniciante: 6, Intermediário: 7, Avançado: 8 };

  // Parâmetros usados quando o app completa um grupo que a IA esqueceu
  const PARAMS_COMPLEMENTO = {
    Iniciante: { series: 3, repeticoes: "12-15" },
    Intermediário: { series: 4, repeticoes: "8-12" },
    Avançado: { series: 4, repeticoes: "8-12" },
  };

  // Teto de exercícios enviados ao Claude (prompt menor e mais barato)
  const MAX_EXERCICIOS = 25;

  /**
   * Divide o total de exercícios do dia entre os grupos, proporcional ao
   * peso de cada um (maiores restos primeiro) e limitado ao que existe no
   * catálogo. O que sobrar de um grupo sem exercícios vai para os outros.
   * Ex.: Costas peso 2 + Bíceps peso 1, total 6 → Costas 4, Bíceps 2.
   */
  function _distribuirQuantidades(grupos, total) {
    const ativos = grupos.filter((g) => g.disponiveis.length > 0);
    const qtd = new Map(ativos.map((g) => [g.musculo, 0]));
    let restante = Math.min(
      total,
      ativos.reduce((s, g) => s + g.disponiveis.length, 0),
    );

    while (restante > 0) {
      // grupos que ainda têm exercício sobrando no catálogo
      const comVaga = ativos.filter(
        (g) => qtd.get(g.musculo) < g.disponiveis.length,
      );
      const somaPesos = comVaga.reduce((s, g) => s + g.peso, 0);
      const ideais = comVaga.map((g) => ({
        g,
        ideal: (restante * g.peso) / somaPesos,
      }));
      let distribuido = 0;
      ideais.forEach(({ g, ideal }) => {
        const vaga = g.disponiveis.length - qtd.get(g.musculo);
        const n = Math.min(Math.floor(ideal), vaga);
        qtd.set(g.musculo, qtd.get(g.musculo) + n);
        distribuido += n;
      });
      restante -= distribuido;
      // sobra da divisão: um por vez para os maiores restos
      ideais
        .sort((a, b) => (b.ideal % 1) - (a.ideal % 1))
        .forEach(({ g }) => {
          if (restante > 0 && qtd.get(g.musculo) < g.disponiveis.length) {
            qtd.set(g.musculo, qtd.get(g.musculo) + 1);
            restante--;
          }
        });
    }
    return ativos
      .map((g) => ({ ...g, qtd: qtd.get(g.musculo) }))
      .filter((g) => g.qtd > 0);
  }

  // Embaralha e corta a lista (sem alterar o array original)
  function _amostra(lista, n) {
    if (lista.length <= n) return lista;
    return lista
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, n);
  }

  function _linhaExercicio(ex) {
    return (
      `• ID: "${ex.id}" | NomeOriginal: "${ex.nome_original}" | ` +
      `Equipamento: "${ex.equipamento || "?"}" | ` +
      `Mecânica: "${ex.mecanica || "?"}" | ` +
      `Força: "${ex.forca || "?"}" | ` +
      `Nível: "${ex.nivel || "?"}"`
    );
  }

  /**
   * @param {object[]} grupos - [{ musculo, qtd, lista }] já distribuídos;
   *   `lista` é a amostra de exercícios do grupo enviada ao Claude.
   */
  function _construirPrompt({ nivel, objetivo, grupos }) {
    const nivelPT = NIVEL_PT[nivel] || nivel;
    const total = grupos.reduce((s, g) => s + g.qtd, 0);
    const nomeDia = grupos.map((g) => g.musculo).join(" + ");

    const listaStr = grupos
      .map(
        (g) =>
          `### ${g.musculo} — escolha EXATAMENTE ${g.qtd} desta lista\n` +
          g.lista.map(_linhaExercicio).join("\n"),
      )
      .join("\n\n");

    const distribuicao = grupos
      .map((g) => `${g.qtd} de ${g.musculo}`)
      .join(", ");

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
- Grupo(s) muscular(es) do dia: ${nomeDia}

EXERCÍCIOS DISPONÍVEIS, POR GRUPO:
${listaStr}

QUANTIDADE OBRIGATÓRIA: EXATAMENTE ${total} exercícios no total — ${distribuicao}.
Cada grupo listado acima DEVE aparecer no treino com a quantidade indicada.

METODOLOGIA PROFISSIONAL — SELEÇÃO DE EXERCÍCIOS:
1. Use SOMENTE exercícios das listas acima (campo ID exatamente como está)
2. Não repita o mesmo exercício
3. Ordem obrigatória: grupos na ordem listada acima; dentro de cada grupo, multi-articulares/compostos primeiro → mono-articulares/isoladores por último
4. Varie os ângulos de estímulo (ex: supino reto + supino inclinado + crucifixo)
5. Inclua ao menos 1 exercício de força livre (barra ou halter) quando disponível
6. Para Avançado: aplique princípios de sobrecarga progressiva (inclua 1 drop-set ou superset na dica_execucao)

INTENSIDADE POR NÍVEL (o aluno é ${nivelPT}):
- Iniciante:     3 séries | 12-15 reps | Ênfase em aprendizado motor
- Intermediário: 4 séries | 8-12 reps  | Ênfase em hipertrofia
- Avançado:      4-5 séries | 6-15 reps | Periodização ondulatória (varie rep range entre os exercícios)

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
    // "Costas + B\u00edceps" \u2192 "costas_biceps"
    const musculoKey = grupoMuscular
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
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
   * @param {string} [params.grupoMuscular] - Um grupo só, ex: "Peitoral" (formato antigo)
   * @param {{musculo: string, peso?: number}[]} [params.grupos]
   *   Vários grupos no mesmo treino, ex: [{musculo:"Costas",peso:2},{musculo:"Bíceps",peso:1}].
   *   O peso define a proporção de exercícios de cada grupo.
   * @param {string} params.equipamentos  - "Academia completa" | "Halteres" | "Sem equipamento"
   *
   * @returns {Promise<object>} Objeto treino retornado pelo Claude
   */
  async function gerar({
    uid,
    nivel,
    objetivo,
    grupoMuscular,
    grupos,
    equipamentos,
    excluir,
    salvar = true,
  }) {
    if (!uid) throw new Error("uid é obrigatório");
    if (!objetivo) throw new Error("objetivo é obrigatório");
    const pedidos =
      Array.isArray(grupos) && grupos.length
        ? grupos.map((g) => ({
            musculo: g.musculo,
            peso: g.peso || 1,
            qtdFixa: Number.isInteger(g.qtd) && g.qtd > 0 ? g.qtd : null,
          }))
        : grupoMuscular
          ? [{ musculo: grupoMuscular, peso: 1, qtdFixa: null }]
          : null;
    if (!pedidos || pedidos.some((g) => !g.musculo)) {
      throw new Error("grupoMuscular ou grupos é obrigatório");
    }

    nivel = nivel || "INICIANTE";
    const nivelPT = NIVEL_PT[nivel] || "Iniciante";
    const nomeDia = pedidos.map((g) => g.musculo).join(" + ");

    // exercícios que o aluno já faz: evitados (por ID e por nome)
    const idsEvitar = new Set(excluir?.ids || []);
    const nomesEvitar = new Set((excluir?.nomes || []).map(_normNome));
    const evitar = (ex) =>
      idsEvitar.has(ex.id) ||
      nomesEvitar.has(_normNome(ex.nome)) ||
      nomesEvitar.has(_normNome(ex.nome_original));

    // 1. Buscar exercícios filtrados do Firebase (um grupo por vez).
    // Ao trocar exercícios (excluir), amplia a busca em etapas até ter
    // novos suficientes: PT do nível → + importados → + outros níveis.
    const etapas = excluir
      ? [
          { nivel, incluirInativos: false },
          { nivel, incluirInativos: true },
          { nivel: "AVANCADO", incluirInativos: true },
        ]
      : [{ nivel, incluirInativos: false }];

    for (const g of pedidos) {
      const precisa = g.qtdFixa || 1;
      let todos = [];
      let novos = [];
      for (const etapa of etapas) {
        todos = await _buscarExercicios({
          grupoMuscular: g.musculo,
          equipamentos: equipamentos || "Academia completa",
          ...etapa,
        });
        novos = todos.filter((ex) => !evitar(ex));
        if (novos.length >= precisa) break;
      }
      // ainda faltou: completa só o que falta com antigos (repetição mínima)
      const faltam = Math.max(0, precisa - novos.length);
      g.disponiveis = faltam
        ? [...novos, ...todos.filter(evitar).slice(0, faltam)]
        : novos;
    }

    const totalDisponivel = pedidos.reduce(
      (s, g) => s + g.disponiveis.length,
      0,
    );
    if (totalDisponivel < 3) {
      throw new Error(
        `Exercícios insuficientes para "${nomeDia}" com os filtros atuais ` +
          `(encontrados: ${totalDisponivel}). Tente mudar o equipamento ou nível.`,
      );
    }

    // 2. Quantidade por grupo: fixa (quando pedida) ou dividida pelo peso
    const fixas = pedidos.every((g) => g.qtdFixa);
    const distribuidos = fixas
      ? pedidos
          .map((g) => ({ ...g, qtd: Math.min(g.qtdFixa, g.disponiveis.length) }))
          .filter((g) => g.qtd > 0)
      : _distribuirQuantidades(pedidos, TOTAL_POR_NIVEL[nivelPT] || 6);
    const tetoPorGrupo = Math.max(
      6,
      Math.floor(MAX_EXERCICIOS / distribuidos.length),
    );
    distribuidos.forEach((g) => {
      g.lista = _amostra(g.disponiveis, Math.max(tetoPorGrupo, g.qtd + 2));
    });

    const prompt = _construirPrompt({ nivel, objetivo, grupos: distribuidos });

    // 3. Chamar Cloud Function → Claude
    const treino = await _chamarCloudFunction(prompt);

    // 4. Garantir que nenhum grupo ficou de fora (a IA às vezes ignora)
    _completarGrupos(treino, distribuidos, nivelPT);
    treino.grupo_muscular = nomeDia;

    // 5. Salvar resultado no Firebase (histórico em /treinos/{uid}/{data}).
    // Quem atualiza o treino de outro aluno passa salvar:false — /treinos
    // de aluno com professor guarda as letras A–E, não pode misturar.
    if (salvar) await _salvarTreino({ uid, treino, grupoMuscular: nomeDia });

    // 6. Retornar treino para o app
    return treino;
  }

  /**
   * Conta quantos exercícios de cada grupo vieram (pelo ID do catálogo) e,
   * se algum grupo veio abaixo da cota, completa com exercícios do catálogo
   * que ainda não estão no treino. Altera `treino.exercicios` no lugar.
   */
  function _completarGrupos(treino, grupos, nivelPT) {
    const grupoDoId = new Map();
    grupos.forEach((g) =>
      g.disponiveis.forEach((ex) => grupoDoId.set(ex.id, g.musculo)),
    );

    // remove repetidos (mesmo ID duas vezes) e o que passar da cota de
    // cada grupo (a IA às vezes enche o treino com o primeiro grupo)
    const cota = new Map(grupos.map((g) => [g.musculo, g.qtd]));
    const usados = new Map();
    const vistos = new Set();
    treino.exercicios = treino.exercicios.filter((ex) => {
      if (!ex.id) return true;
      if (vistos.has(ex.id)) return false;
      const grupo = grupoDoId.get(ex.id);
      if (grupo) {
        const n = (usados.get(grupo) || 0) + 1;
        if (n > cota.get(grupo)) return false;
        usados.set(grupo, n);
      }
      vistos.add(ex.id);
      return true;
    });

    const params = PARAMS_COMPLEMENTO[nivelPT] || PARAMS_COMPLEMENTO.Iniciante;
    grupos.forEach((g) => {
      const tem = treino.exercicios.filter(
        (ex) => grupoDoId.get(ex.id) === g.musculo,
      ).length;
      const faltam = g.qtd - tem;
      if (faltam <= 0) return;

      // prioriza os que a IA viu no prompt, depois o resto do catálogo
      const candidatos = [...g.lista, ...g.disponiveis].filter(
        (ex) => !vistos.has(ex.id),
      );
      candidatos.slice(0, faltam).forEach((ex) => {
        vistos.add(ex.id);
        treino.exercicios.push({
          id: ex.id,
          nome: ex.nome || ex.nome_original,
          musculo_principal: g.musculo,
          series: params.series,
          repeticoes: params.repeticoes,
          descanso_segundos: 60,
          dica_execucao: "",
        });
      });
      console.warn(
        `[TreinoIA] IA trouxe ${tem}/${g.qtd} de ${g.musculo}; completado pelo app.`,
      );
    });

    // marca o grupo de cada exercício (usado para trocar no lugar certo)
    treino.exercicios.forEach((ex) => {
      const grupo = grupoDoId.get(ex.id);
      if (grupo) ex.grupo = grupo;
    });
  }

  // "Rosca Direta" / "rosca direta " → "rosca direta" (sem acento)
  function _normNome(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  // grupo do catálogo (novo ou antigo) → nome usado na geração
  const MUSCULO_OLD_TO_NEW = Object.fromEntries(
    Object.entries(MUSCULO_NEW_TO_OLD).map(([novo, velho]) => [velho, novo]),
  );
  function normalizarGrupo(valor) {
    if (!valor) return null;
    if (MUSCULO_NEW_TO_OLD[valor]) return valor; // já no formato novo
    return MUSCULO_OLD_TO_NEW[_normNome(valor)] || null;
  }

  /**
   * Retorna apenas a lista de exercícios disponíveis para um grupo muscular,
   * sem gerar treino. Útil para pré-visualização ou debug.
   */
  async function listarExercicios({ grupoMuscular, equipamentos, nivel }) {
    return _buscarExercicios({ grupoMuscular, equipamentos, nivel });
  }

  return {
    gerar,
    listarExercicios,
    // usados pelo "Atualizar exercícios" (professor/adm)
    catalogo: _catalogo,
    normalizarGrupo,
    grupoAntigo: (novo) => MUSCULO_NEW_TO_OLD[novo] || "",
    normNome: _normNome,
  };
})();
