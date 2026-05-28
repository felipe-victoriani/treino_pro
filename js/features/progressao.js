/* ============================================================
   TREINO PRO — Sistema de Progressão e Conquistas
   Para alunos independentes (sem professor).
   ============================================================ */

/* ── Fases ─────────────────────────────────────────────────── */

const FASES_INFO = {
  1: {
    nome: "Iniciante",
    cor: "#6B35C3",
    icone: "🌱",
    desc: "Construindo a base",
  },
  2: {
    nome: "Intermediário",
    cor: "#2196F3",
    icone: "🔥",
    desc: "Intensidade aumentada",
  },
  3: {
    nome: "Avançado",
    cor: "#FF6B35",
    icone: "⚡",
    desc: "Nível elite alcançado",
  },
};

// Nº de treinos completos para desbloquear cada fase
const FASE_THRESHOLDS = [0, 12, 30];

/**
 * Retorna a fase atual (1, 2 ou 3) baseada no total de treinos completos
 */
function getFaseAtual(totalTreinos) {
  if (totalTreinos >= FASE_THRESHOLDS[2]) return 3;
  if (totalTreinos >= FASE_THRESHOLDS[1]) return 2;
  return 1;
}

/**
 * Retorna dados de progresso para a próxima fase
 */
function getProgressoFase(totalTreinos) {
  const fase = getFaseAtual(totalTreinos);
  if (fase >= 3) {
    return { fase, proxima: null, faltam: 0, pct: 100, total: totalTreinos };
  }
  const inicio = FASE_THRESHOLDS[fase - 1];
  const fim = FASE_THRESHOLDS[fase];
  const atual = totalTreinos - inicio;
  const meta = fim - inicio;
  return {
    fase,
    proxima: fase + 1,
    faltam: fim - totalTreinos,
    pct: Math.min(99, Math.round((atual / meta) * 100)),
    total: totalTreinos,
  };
}

/**
 * Retorna a próxima letra de treino dentro de um programa pré-definido,
 * corrigindo a rotação para alunos que não usam o path de professor.
 */
function proximaLetraPrograma(programaId, letraAtual) {
  if (typeof getProgramaById !== "function") return letraAtual;
  const programa = getProgramaById(programaId);
  if (!programa) return letraAtual;
  const letras = Object.keys(programa.treinos).sort();
  const idx = letras.indexOf(letraAtual);
  if (idx === -1) return letras[0] || letraAtual;
  return letras[(idx + 1) % letras.length];
}

/* ── Modificadores por fase ──────────────────────────────────── */

const FASE_MODS = {
  2: { seriesBonus: 1, restReducao: 15 },
  3: { seriesBonus: 2, restReducao: 30 },
};

/* ── Exercícios bônus desbloqueados por fase ─────────────────── */

const FASE_BONUS_EXERCICIOS = {
  "iniciante-abc-3x": {
    2: {
      A: {
        nome: "Mergulho entre Bancos (Triceps Dip)",
        grupoMuscular: "triceps",
        series: 4,
        reps: "12-15",
        descanso: "60s",
        dica: "🔓 Fase 2! Mãos no banco atrás, pés estendidos. Desça até cotovelos a 90°.",
      },
      B: {
        nome: "Remada Curvada com Barra",
        grupoMuscular: "costas",
        series: 4,
        reps: "10-12",
        descanso: "75s",
        dica: "🔓 Fase 2! Torso a 45°. Puxe até o umbigo, cotovelos para trás.",
      },
      C: {
        nome: "Agachamento Goblet com Halter",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "12",
        descanso: "75s",
        dica: "🔓 Fase 2! Halter no peito. Joelhos para fora, desça fundo.",
      },
    },
    3: {
      A: {
        nome: "Supino Declinado com Halteres",
        grupoMuscular: "peito",
        series: 5,
        reps: "8-10",
        descanso: "60s",
        dica: "⚡ Fase 3! Banco a -15°. Ativa peitoral inferior. Excêntrica em 3s.",
      },
      B: {
        nome: "Barra Fixa (Pegada Aberta)",
        grupoMuscular: "costas",
        series: 4,
        reps: "Máx",
        descanso: "90s",
        dica: "⚡ Fase 3! Queixo acima da barra. Use elástico se precisar.",
      },
      C: {
        nome: "Passada com Halteres (Walking Lunge)",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "12/lado",
        descanso: "75s",
        dica: "⚡ Fase 3! Joelho traseiro quase no chão. Tronco ereto.",
      },
    },
  },
  "full-body-iniciante-3x": {
    2: {
      A: {
        nome: "Flexão Diamante",
        grupoMuscular: "triceps",
        series: 4,
        reps: "10-12",
        descanso: "60s",
        dica: "🔓 Fase 2! Dedos em diamante. Cotovelos para trás na descida.",
      },
      B: {
        nome: "Elevação de Quadril (Hip Thrust)",
        grupoMuscular: "gluteos",
        series: 4,
        reps: "15",
        descanso: "60s",
        dica: "🔓 Fase 2! Ombros no banco. Eleva o quadril até coxa paralela.",
      },
      C: {
        nome: "Burpee",
        grupoMuscular: "fullbody",
        series: 3,
        reps: "10",
        descanso: "75s",
        dica: "🔓 Fase 2! Explosão no salto. Prancha firme na descida.",
      },
    },
    3: {
      A: {
        nome: "Pullover com Halter",
        grupoMuscular: "dorsais",
        series: 4,
        reps: "10",
        descanso: "60s",
        dica: "⚡ Fase 3! Deitado, halter atrás da cabeça. Cotovelos levemente dobrados.",
      },
      B: {
        nome: "Agachamento com Salto (Jump Squat)",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "12",
        descanso: "75s",
        dica: "⚡ Fase 3! Explosão máxima. Pouso suave com joelhos dobrados.",
      },
      C: {
        nome: "Push-Up com Pés Elevados",
        grupoMuscular: "peito",
        series: 4,
        reps: "10-12",
        descanso: "60s",
        dica: "⚡ Fase 3! Pés no banco. Ativa peitoral superior com intensidade máxima.",
      },
    },
  },
  "emagrecimento-3x": {
    2: {
      A: {
        nome: "Mountain Climber",
        grupoMuscular: "core",
        series: 3,
        reps: "20/lado",
        descanso: "45s",
        dica: "🔓 Fase 2! Joelhos alternados ao peito em ritmo rápido. Core contraído.",
      },
      B: {
        nome: "Burpee Modificado",
        grupoMuscular: "fullbody",
        series: 3,
        reps: "10",
        descanso: "60s",
        dica: "🔓 Fase 2! Ritmo contínuo. Frequência cardíaca elevada.",
      },
      C: {
        nome: "Agachamento com Salto",
        grupoMuscular: "quadriceps",
        series: 3,
        reps: "10",
        descanso: "75s",
        dica: "🔓 Fase 2! Aterrisse suave. Potência máxima no salto.",
      },
    },
    3: {
      A: {
        nome: "Tabata: Burpee + Agachamento",
        grupoMuscular: "fullbody",
        series: 4,
        reps: "20s/10s",
        descanso: "60s",
        dica: "⚡ Fase 3! 4 rounds alternando burpee e agachamento. Intensidade máxima!",
      },
      B: {
        nome: "Battle Rope (ou Pulos com Corda)",
        grupoMuscular: "fullbody",
        series: 4,
        reps: "30s",
        descanso: "45s",
        dica: "⚡ Fase 3! Movimentos explosivos. Frequência cardíaca no limite.",
      },
      C: {
        nome: "Sprints Intervalados",
        grupoMuscular: "cardio",
        series: 6,
        reps: "30s sprint / 30s walk",
        descanso: "0s",
        dica: "⚡ Fase 3! Velocidade máxima no sprint. Pouso suave ao retornar.",
      },
    },
  },
  "gluteos-pernas-feminino-4x": {
    2: {
      A: {
        nome: "Agachamento Sumo com Halter",
        grupoMuscular: "gluteos",
        series: 4,
        reps: "15",
        descanso: "60s",
        dica: "🔓 Fase 2! Pés bem abertos, halter no centro. Desça fundo sentindo o glúteo.",
      },
      B: {
        nome: "Hip Thrust com Halter",
        grupoMuscular: "gluteos",
        series: 4,
        reps: "12",
        descanso: "75s",
        dica: "🔓 Fase 2! Ombros no banco. Esprema glúteo no topo por 1s.",
      },
      C: {
        nome: "Abdução com Elástico (Clamshell)",
        grupoMuscular: "gluteo-medio",
        series: 4,
        reps: "15/lado",
        descanso: "45s",
        dica: "🔓 Fase 2! Deitada de lado, abre como concha. Elástico acima dos joelhos.",
      },
      D: {
        nome: "Passada Lateral com Elástico",
        grupoMuscular: "gluteos",
        series: 3,
        reps: "12/lado",
        descanso: "60s",
        dica: "🔓 Fase 2! Elástico nos tornozelos. Ativa o médio glúteo com precisão.",
      },
    },
    3: {
      A: {
        nome: "Agachamento Búlgaro (Split Squat)",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "12/perna",
        descanso: "90s",
        dica: "⚡ Fase 3! Pé traseiro elevado. Coxa paralela ao chão. Potência unilateral.",
      },
      B: {
        nome: "Hip Thrust com Pausa (3s topo)",
        grupoMuscular: "gluteos",
        series: 4,
        reps: "10",
        descanso: "75s",
        dica: "⚡ Fase 3! Pause 3s com quadril elevado. Hipertrofia máxima.",
      },
      C: {
        nome: "RDL com Halteres",
        grupoMuscular: "posterior",
        series: 4,
        reps: "12",
        descanso: "90s",
        dica: "⚡ Fase 3! Joelhos levemente dobrados. Sinta o isquiotibial na descida.",
      },
      D: {
        nome: "Elevação de Panturrilha no Step",
        grupoMuscular: "panturrilha",
        series: 4,
        reps: "20",
        descanso: "45s",
        dica: "⚡ Fase 3! Amplitude total: desce ao máximo, sobe na ponta dos pés.",
      },
    },
  },
  "hipertrofia-abcd-4x": {
    2: {
      A: {
        nome: "Supino Inclinado com Barra",
        grupoMuscular: "peito",
        series: 4,
        reps: "8-10",
        descanso: "90s",
        dica: "🔓 Fase 2! Pegada larga. Barra desce 2cm do peito superior. Explosão na subida.",
      },
      B: {
        nome: "Barra Fixa (Pegada Aberta)",
        grupoMuscular: "costas",
        series: 4,
        reps: "Máx",
        descanso: "90s",
        dica: "🔓 Fase 2! Cotovelos para baixo e trás. Use elástico se necessário.",
      },
      C: {
        nome: "Agachamento Hack (Máquina)",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "10-12",
        descanso: "90s",
        dica: "🔓 Fase 2! Posicionamento correto dos pés. Ative o quadríceps em toda amplitude.",
      },
      D: {
        nome: "Desenvolvimento com Halteres em Pé",
        grupoMuscular: "ombros",
        series: 4,
        reps: "10-12",
        descanso: "75s",
        dica: "🔓 Fase 2! Core estabilizado. Empurra sem travar cotovelos no topo.",
      },
    },
    3: {
      A: {
        nome: "Crossover no Cabo (Superset)",
        grupoMuscular: "peito",
        series: 4,
        reps: "12 superset",
        descanso: "60s",
        dica: "⚡ Fase 3! Imediatamente após o supino. Pré-exaustão total do peitoral.",
      },
      B: {
        nome: "Remada T-Bar",
        grupoMuscular: "costas",
        series: 5,
        reps: "8",
        descanso: "90s",
        dica: "⚡ Fase 3! Costas neutras. Cotovelos altos. Puxe com dorsal, não bíceps.",
      },
      C: {
        nome: "Leg Press + Drop Set Final",
        grupoMuscular: "quadriceps",
        series: 4,
        reps: "10 + 15 drop",
        descanso: "90s",
        dica: "⚡ Fase 3! Último set: reduza 30% e faça 15 reps extras sem parar.",
      },
      D: {
        nome: "Face Pull com Corda",
        grupoMuscular: "ombros",
        series: 4,
        reps: "15",
        descanso: "60s",
        dica: "⚡ Fase 3! Puxe para o rosto, cotovelos para os lados. Saúde do ombro.",
      },
    },
  },
};

/**
 * Aplica os modificadores de fase a um objeto treino pré-definido.
 * Retorna novo objeto com séries/descanso ajustados e exercício bônus adicionado.
 */
function aplicarFaseAoTreino(treino, programaId, letra, fase) {
  if (!treino || fase <= 1) return treino;
  const mod = FASE_MODS[fase] || FASE_MODS[2];

  const exerciciosModificados = (treino.exercicios || []).map((ex) => {
    const descansoNum =
      parseInt(String(ex.descanso || "60").replace(/[^0-9]/g, "")) || 60;
    const novoDescanso = Math.max(30, descansoNum - mod.restReducao);
    return {
      ...ex,
      series: (ex.series || 3) + mod.seriesBonus,
      descanso: novoDescanso + "s",
    };
  });

  // Adiciona exercício bônus desta fase (se existir para este programa/letra)
  const bonusEx = FASE_BONUS_EXERCICIOS[programaId]?.[fase]?.[letra];
  if (bonusEx && !exerciciosModificados.find((e) => e.nome === bonusEx.nome)) {
    exerciciosModificados.push({ ...bonusEx, _faseBloqueio: fase });
  }

  return { ...treino, exercicios: exerciciosModificados };
}

/* ── Conquistas ──────────────────────────────────────────────── */

const CONQUISTAS_DEFS = [
  {
    id: "primeiro-treino",
    emoji: "🏁",
    nome: "Primeiro Passo",
    desc: "Completou o 1º treino",
    check: (t, s, f) => t >= 1,
  },
  {
    id: "tres-treinos",
    emoji: "🌱",
    nome: "Rotina Formando",
    desc: "3 treinos concluídos",
    check: (t, s, f) => t >= 3,
  },
  {
    id: "sete-streak",
    emoji: "🔥",
    nome: "Semana de Fogo",
    desc: "7 dias seguidos de treino",
    check: (t, s, f) => s >= 7,
  },
  {
    id: "dez-treinos",
    emoji: "💪",
    nome: "10 Treinos",
    desc: "10 treinos no histórico",
    check: (t, s, f) => t >= 10,
  },
  {
    id: "fase-2",
    emoji: "🔓",
    nome: "Próximo Nível",
    desc: "Desbloqueou a Fase 2",
    check: (t, s, f) => f >= 2,
  },
  {
    id: "vinte-treinos",
    emoji: "🎯",
    nome: "Consistência",
    desc: "20 treinos concluídos",
    check: (t, s, f) => t >= 20,
  },
  {
    id: "trinta-treinos",
    emoji: "🏆",
    nome: "30 Treinos",
    desc: "30 treinos no histórico",
    check: (t, s, f) => t >= 30,
  },
  {
    id: "fase-3",
    emoji: "⚡",
    nome: "Elite",
    desc: "Desbloqueou a Fase 3",
    check: (t, s, f) => f >= 3,
  },
  {
    id: "cinquenta",
    emoji: "👑",
    nome: "Campeão",
    desc: "50 treinos concluídos",
    check: (t, s, f) => t >= 50,
  },
  {
    id: "streak-30",
    emoji: "🌟",
    nome: "Mês Perfeito",
    desc: "30 dias consecutivos de treino",
    check: (t, s, f) => s >= 30,
  },
];

/**
 * Retorna IDs das conquistas ganhas com base nos dados atuais
 */
function getConquistasGanhas(totalTreinos, streak, fase) {
  return CONQUISTAS_DEFS.filter((c) => c.check(totalTreinos, streak, fase)).map(
    (c) => c.id,
  );
}

/**
 * Retorna objetos das conquistas recém-ganhas (ganhas mas ainda não salvas no Firebase)
 */
function getNovasConquistas(totalTreinos, streak, fase, conquistasSalvas) {
  const ganhas = getConquistasGanhas(totalTreinos, streak, fase);
  return ganhas
    .filter((id) => !conquistasSalvas.includes(id))
    .map((id) => CONQUISTAS_DEFS.find((c) => c.id === id));
}
