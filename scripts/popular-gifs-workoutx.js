/**
 * popular-gifs-workoutx.js
 * Popula o campo gifUrl nos exercícios do Firebase usando a WorkoutX API
 * (https://workoutxapp.com) — GIFs animados reais, free tier sem cartão.
 *
 * Os nomes do catálogo (nome_original) estão em português; a WorkoutX só
 * busca em inglês, então este script traduz os nomes conhecidos do catálogo
 * antes de buscar (ver TRADUCOES abaixo). Exercícios fora dessa lista caem
 * num fallback ingênuo (primeira palavra), que tende a ter menos acerto —
 * para esses, preencha manualmente o campo "URL do GIF" no formulário de
 * criar/editar exercício.
 *
 * PRÉ-REQUISITOS:
 *   Nenhuma dependência extra — usa apenas fetch nativo + REST API do Firebase.
 *   1. Crie uma conta grátis em https://workoutxapp.com (dashboard.html#register)
 *      → 500 requisições/mês grátis, sem cartão.
 *   2. Pegue o Database Secret do projeto Firebase:
 *      Firebase Console → Configurações do projeto → Contas de serviço → Secrets do banco de dados
 *
 * USO (PowerShell):
 *   $env:DB_SECRET="seu_secret"; $env:WORKOUTX_KEY="sua_chave"; node scripts/popular-gifs-workoutx.js
 */

const DB_URL = "https://app-treino-academia-default-rtdb.firebaseio.com";
const DB_SECRET = process.env.DB_SECRET;
const WORKOUTX_KEY = process.env.WORKOUTX_KEY;
const WORKOUTX_BASE = "https://api.workoutxapp.com";

if (!DB_SECRET || !WORKOUTX_KEY) {
  console.error(
    "❌  Faltam variáveis de ambiente.\n" +
      "    Execute assim:\n" +
      '    $env:DB_SECRET="seu_secret"; $env:WORKOUTX_KEY="sua_chave"; node scripts/popular-gifs-workoutx.js\n' +
      "\n" +
      "    DB_SECRET      → Firebase Console → Configurações → Contas de serviço → Secrets do banco de dados\n" +
      "    WORKOUTX_KEY   → https://workoutxapp.com/dashboard.html#register (grátis, sem cartão)\n"
  );
  process.exit(1);
}

// ── Tradução PT → EN dos nomes conhecidos do catálogo ──────
// (ver js/services/exercicios-seed.js — mantenha em sincronia se adicionar exercícios lá)
const TRADUCOES = {
  "supino reto com barra": "Barbell Bench Press",
  "supino inclinado com halteres": "Incline Dumbbell Bench Press",
  "supino declinado com barra": "Decline Barbell Bench Press",
  "crucifixo com halteres": "Dumbbell Fly",
  "crossover no cabo": "Cable Crossover",
  "peck deck (voador na máquina)": "Machine Fly",
  "flexão de braços": "Push-up",
  "pull over com haltere": "Dumbbell Pullover",
  "supino inclinado com barra": "Incline Barbell Bench Press",
  "crossover no cabo (baixo para cima)": "Low to High Cable Crossover",
  "puxada frontal no pulley": "Lat Pulldown",
  "remada curvada com barra": "Barbell Bent Over Row",
  "remada sentada no cabo": "Seated Cable Row",
  "barra fixa (pull-up)": "Pull-up",
  "remada unilateral com haltere": "Single Arm Dumbbell Row",
  "levantamento terra (deadlift)": "Deadlift",
  "pulldown com triângulo": "Close Grip Lat Pulldown",
  "remada máquina (chest supported)": "Chest Supported Machine Row",
  "remada com haltere no cabo": "Cable Row",
  "hiperextensão lombar": "Hyperextension",
  "agachamento livre": "Barbell Squat",
  "leg press 45°": "Leg Press",
  "extensão de pernas": "Leg Extension",
  "flexão de pernas (cadeira flexora)": "Leg Curl",
  "agachamento sumô com haltere": "Dumbbell Sumo Squat",
  "afundo (lunges) com halteres": "Dumbbell Lunge",
  "elevação de panturrilha em pé": "Standing Calf Raise",
  "agachamento búlgaro": "Bulgarian Split Squat",
  "cadeira abdutora": "Hip Abductor Machine",
  "agachamento hack (máquina)": "Hack Squat",
  "desenvolvimento com halteres": "Dumbbell Shoulder Press",
  "desenvolvimento militar com barra": "Barbell Military Press",
  "elevação lateral com halteres": "Dumbbell Lateral Raise",
  "elevação frontal com halteres": "Dumbbell Front Raise",
  "crucifixo invertido (deltoide posterior)": "Reverse Fly",
  "encolhimento de ombros (shrug)": "Barbell Shrug",
  "elevação lateral no cabo": "Cable Lateral Raise",
  "desenvolvimento arnold": "Arnold Press",
  "rosca direta com barra": "Barbell Curl",
  "rosca alternada com halteres": "Alternating Dumbbell Curl",
  "rosca concentrada": "Concentration Curl",
  "rosca martelo": "Hammer Curl",
  "rosca scott (barra w)": "Preacher Curl",
  "rosca no cabo (barra reta)": "Cable Curl",
  "rosca 21 com barra": "Barbell 21s",
  "tríceps testa com barra w": "Lying Triceps Extension",
  "tríceps pulley (barra reta)": "Triceps Pushdown",
  "tríceps mergulho no banco (dips)": "Bench Dip",
  "kick-back com haltere": "Dumbbell Kickback",
  "tríceps francês com haltere": "Dumbbell Overhead Triceps Extension",
  "tríceps corda no pulley": "Rope Triceps Pushdown",
  "supino fechado com barra": "Close Grip Bench Press",
  "abdominal crunch": "Crunch",
  "prancha (plank)": "Plank",
  "abdominal oblíquo (bicicleta)": "Bicycle Crunch",
  "elevação de pernas": "Leg Raise",
  "russian twist": "Russian Twist",
  "abdominal na máquina": "Machine Crunch",
  "hip thrust com barra": "Barbell Hip Thrust",
  "glúteo 4 apoios no cabo": "Cable Kickback",
  "abdução de quadril na máquina": "Hip Abduction Machine",
  "stiff com halteres": "Dumbbell Stiff Leg Deadlift",
  "agachamento sumô (glúteo)": "Sumo Squat",
  "elevação pélvica (glute bridge)": "Glute Bridge",
};

// ── Helpers ───────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function norm(str) {
  return (str || "").trim().toLowerCase();
}

async function dbGet(path) {
  const resp = await fetch(`${DB_URL}/${path}.json?auth=${DB_SECRET}`);
  if (!resp.ok) throw new Error(`Firebase GET ${path} → ${resp.status}`);
  return resp.json();
}

async function dbSet(path, value) {
  const resp = await fetch(`${DB_URL}/${path}.json?auth=${DB_SECRET}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!resp.ok) throw new Error(`Firebase PUT ${path} → ${resp.status}`);
}

/**
 * Busca um exercício na WorkoutX pelo termo em inglês e devolve o gifUrl.
 */
async function buscarGifWorkoutX(termoIngles) {
  try {
    const url = `${WORKOUTX_BASE}/v1/exercises/name/${encodeURIComponent(termoIngles)}`;
    const resp = await fetch(url, {
      headers: { "X-WorkoutX-Key": WORKOUTX_KEY },
    });
    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn("  ⚠️  Rate limit atingido — aguardando 3s...");
        await sleep(3000);
      }
      return "";
    }
    const data = await resp.json();
    const lista = Array.isArray(data) ? data : data.results || data.data || [];
    return lista?.[0]?.gifUrl || "";
  } catch (err) {
    console.warn(`  ⚠️  Erro de rede: ${err.message}`);
    return "";
  }
}

/**
 * Resolve o termo de busca em inglês para um nome do catálogo (PT).
 * 1. Tenta match exato no dicionário TRADUCOES.
 * 2. Fallback: usa o nome original mesmo (alguns termos técnicos batem, ex: "Plank").
 */
function resolverTermoBusca(nomeOriginal) {
  const chave = norm(nomeOriginal);
  return TRADUCOES[chave] || nomeOriginal;
}

// ── Script principal ──────────────────────────────────────
async function main() {
  console.log("🏋️  Popular GIFs — WorkoutX API\n");
  console.log("📡  Lendo exercícios do Firebase...");

  const dados = await dbGet("exercicios");
  if (!dados) {
    console.log("❌  Nenhum exercício encontrado no Firebase.");
    process.exit(0);
  }

  // Alvo: só o catálogo PT "real" (chave push-id, ex: -OuEc...), ignorando
  // o gifUrl atual — sabemos que hoje ele está errado (placeholder de uma
  // rodada anterior do Wger que sempre caía no mesmo fallback).
  const exercicios = Object.entries(dados)
    .filter(([id, val]) => id.startsWith("-") && val.nome_original)
    .map(([id, val]) => ({ id, ...val }));

  const total = exercicios.length;
  console.log(`📋  ${total} exercícios do catálogo PT a (re)popular.\n`);

  if (total === 0) {
    console.log("✅  Nada a fazer — catálogo PT vazio ou não encontrado.");
    process.exit(0);
  }

  let comGif = 0;
  let semGif = 0;
  const semMatch = [];

  for (let i = 0; i < exercicios.length; i++) {
    const ex = exercicios[i];
    const termo = resolverTermoBusca(ex.nome_original);
    process.stdout.write(
      `[${i + 1}/${total}] "${ex.nome_original}" → buscando "${termo}"... `
    );

    const gifUrl = await buscarGifWorkoutX(termo);

    try {
      await dbSet(`exercicios/${ex.id}/gifUrl`, gifUrl);
      if (gifUrl) {
        console.log("✅  Salvo");
        comGif++;
      } else {
        console.log("❌  Não encontrado");
        semGif++;
        semMatch.push(ex.nome_original);
      }
    } catch (err) {
      console.log(`⚠️  Erro ao salvar: ${err.message}`);
      semGif++;
    }

    if (i < exercicios.length - 1) await sleep(300);
  }

  console.log("\n" + "─".repeat(50));
  console.log("📊  RESUMO FINAL");
  console.log(`   Total processados : ${total}`);
  console.log(`   ✅ Com GIF         : ${comGif}`);
  console.log(`   ❌ Sem GIF         : ${semGif}`);
  if (semMatch.length) {
    console.log(
      "\n   Sem match automático (preencha manualmente no formulário do exercício):"
    );
    semMatch.forEach((n) => console.log(`     - ${n}`));
  }
  console.log("─".repeat(50));
  console.log(
    "\n➡️   Depois de rodar isso, rode scripts/migrar-gifs-treinos.js para\n" +
      "     propagar os gifUrl do catálogo para os treinos já atribuídos aos alunos."
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Erro fatal:", err.message || err);
  process.exit(1);
});
