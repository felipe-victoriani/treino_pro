/**
 * hospedar-gifs-storage.js
 * Busca o GIF de cada exercício do catálogo PT na WorkoutX, baixa os bytes
 * (com a chave, no servidor) e re-hospeda no Firebase Storage do próprio
 * projeto — gerando uma URL pública, sem autenticação, pra salvar em
 * exercicios/{id}/gifUrl.
 *
 * POR QUE: a URL bruta da WorkoutX (https://api.workoutxapp.com/v1/gifs/xxx)
 * exige o header X-WorkoutX-Key em toda requisição — inclusive pra baixar a
 * imagem, não só pra buscar os dados. Isso quebra o <img src="..."> no
 * navegador (401), que não consegue mandar headers customizados. Hospedando
 * a cópia no seu Storage, a URL final funciona sem autenticação, pra sempre,
 * sem depender da WorkoutX no dia a dia do app.
 *
 * Idempotente: pula exercícios cujo gifUrl já aponta pro seu Storage.
 * Reprocessa (busca de novo na WorkoutX) quem está vazio ou ainda aponta
 * pra api.workoutxapp.com (inclui os que falharam por rate-limit antes).
 *
 * PRÉ-REQUISITOS:
 *   - serviceAccountKey.json na raiz do projeto (Firebase Console →
 *     Configurações → Contas de serviço → Gerar nova chave privada)
 *   - npm já tem firebase-admin instalado
 *
 * USO:
 *   $env:WORKOUTX_KEY="sua_chave"; node scripts/hospedar-gifs-storage.js
 */

const path = require("path");
const crypto = require("crypto");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getStorage } = require("firebase-admin/storage");

const WORKOUTX_KEY = process.env.WORKOUTX_KEY;
const WORKOUTX_BASE = "https://api.workoutxapp.com";
const STORAGE_BUCKET = "app-treino-academia.firebasestorage.app";
const STORAGE_PREFIX = "exercicios-gifs";

if (!WORKOUTX_KEY) {
  console.error(
    '❌  Faltou WORKOUTX_KEY.\n    Execute: $env:WORKOUTX_KEY="sua_chave"; node scripts/hospedar-gifs-storage.js\n'
  );
  process.exit(1);
}

const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error(
    "❌  serviceAccountKey.json não encontrado na raiz do projeto.\n" +
      "    Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada.\n"
  );
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://app-treino-academia-default-rtdb.firebaseio.com",
  storageBucket: STORAGE_BUCKET,
});

const db = getDatabase();
const bucket = getStorage().bucket();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Tradução PT → EN (mesma lista de scripts/popular-gifs-workoutx.js) ──
const TRADUCOES = {
  "supino reto com barra": "Barbell Bench Press",
  "supino inclinado com halteres": "Incline Dumbbell Bench Press",
  "supino declinado com barra": "Decline Barbell Bench Press",
  "crucifixo com halteres": "Dumbbell Fly",
  "crossover no cabo": "Cable Crossover",
  "peck deck (voador na máquina)": "Machine Fly",
  "flexão de braços": "Push-up",
  "pull over com haltere": "Dumbbell Pullover",
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
  "supino inclinado com barra": "Incline Barbell Bench Press",
};

function norm(str) {
  return (str || "").trim().toLowerCase();
}

function resolverTermoBusca(nomeOriginal) {
  return TRADUCOES[norm(nomeOriginal)] || nomeOriginal;
}

/** Busca na WorkoutX (com retry em 429) e devolve o gifUrl bruto da API. */
async function buscarGifWorkoutX(termo, tentativa = 0) {
  const url = `${WORKOUTX_BASE}/v1/exercises/name/${encodeURIComponent(termo)}`;
  const resp = await fetch(url, { headers: { "X-WorkoutX-Key": WORKOUTX_KEY } });

  if (resp.status === 429) {
    if (tentativa >= 2) return "";
    const espera = 4000 * (tentativa + 1);
    console.warn(`  ⚠️  Rate limit — aguardando ${espera / 1000}s...`);
    await sleep(espera);
    return buscarGifWorkoutX(termo, tentativa + 1);
  }
  if (!resp.ok) return "";

  const data = await resp.json();
  const lista = Array.isArray(data) ? data : data.data || data.results || [];
  return lista?.[0]?.gifUrl || "";
}

/** Baixa os bytes do gif (com a chave) e devolve um Buffer. */
async function baixarBytesGif(gifUrlBruto) {
  const resp = await fetch(gifUrlBruto, {
    headers: { "X-WorkoutX-Key": WORKOUTX_KEY },
  });
  if (!resp.ok) throw new Error(`Download falhou: ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Sobe o buffer pro Storage e retorna a URL pública com download token. */
async function subirParaStorage(id, buffer) {
  const destino = `${STORAGE_PREFIX}/${id}.gif`;
  const token = crypto.randomUUID();
  const file = bucket.file(destino);

  await file.save(buffer, {
    contentType: "image/gif",
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });

  const encodedPath = encodeURIComponent(destino);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${token}`;
}

async function main() {
  console.log("🏋️  Hospedar GIFs no Firebase Storage\n");
  console.log("📡  Lendo /exercicios...");

  const snap = await db.ref("exercicios").once("value");
  const dados = snap.val() || {};

  const alvo = Object.entries(dados).filter(([id, ex]) => {
    if (!id.startsWith("-") || !ex.nome_original) return false;
    // já hospedado no nosso Storage — pula
    if (ex.gifUrl && ex.gifUrl.includes("firebasestorage.googleapis.com"))
      return false;
    return true;
  });

  console.log(`📋  ${alvo.length} exercícios a processar.\n`);
  if (alvo.length === 0) {
    console.log("✅  Nada a fazer — todos já hospedados no Storage.");
    process.exit(0);
  }

  let ok = 0;
  let semMatch = [];
  let erro = [];

  for (let i = 0; i < alvo.length; i++) {
    const [id, ex] = alvo[i];
    const termo = resolverTermoBusca(ex.nome_original);
    process.stdout.write(`[${i + 1}/${alvo.length}] "${ex.nome_original}" → "${termo}"... `);

    try {
      const gifUrlBruto = await buscarGifWorkoutX(termo);
      if (!gifUrlBruto) {
        console.log("❌  sem match");
        semMatch.push(ex.nome_original);
        await sleep(300);
        continue;
      }

      const bytes = await baixarBytesGif(gifUrlBruto);
      const urlPublica = await subirParaStorage(id, bytes);
      await db.ref(`exercicios/${id}/gifUrl`).set(urlPublica);

      console.log(`✅  hospedado (${(bytes.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.log(`⚠️  erro: ${err.message}`);
      erro.push({ nome: ex.nome_original, erro: err.message });
    }

    await sleep(400);
  }

  console.log("\n" + "─".repeat(50));
  console.log("📊  RESUMO FINAL");
  console.log(`   Total processados : ${alvo.length}`);
  console.log(`   ✅ Hospedados      : ${ok}`);
  console.log(`   ❌ Sem match       : ${semMatch.length}`);
  console.log(`   ⚠️  Erros          : ${erro.length}`);
  if (semMatch.length) {
    console.log("\n   Sem match automático (preencha manualmente):");
    semMatch.forEach((n) => console.log(`     - ${n}`));
  }
  if (erro.length) {
    console.log("\n   Erros:");
    erro.forEach((e) => console.log(`     - ${e.nome}: ${e.erro}`));
  }
  console.log("─".repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Erro fatal:", err.message || err);
  process.exit(1);
});
