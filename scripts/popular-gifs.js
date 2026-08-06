/**
 * popular-gifs.js
 * Popula o campo gifUrl nos exercícios do Firebase usando a ExerciseDB (RapidAPI).
 *
 * PRÉ-REQUISITOS:
 *   1. serviceAccountKey.json na raiz do projeto
 *   2. npm install firebase-admin node-fetch dotenv   (só uma vez)
 *   3. Criar scripts/.env com: RAPIDAPI_KEY=sua_chave
 *
 * USO:
 *   node scripts/popular-gifs.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const path = require("path");
const fs = require("fs");

// ── Inicializa Firebase Admin ─────────────────────────────
// Tenta serviceAccountKey.json; caso não exista, usa Application Default Credentials
const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");
const initOptions = {
  databaseURL: "https://app-treino-academia-default-rtdb.firebaseio.com",
};
if (fs.existsSync(keyPath)) {
  initOptions.credential = cert(require(keyPath));
} else {
  initOptions.credential = applicationDefault();
}
initializeApp(initOptions);

const db = getDatabase();

const db = admin.database();

// ── Validação da chave ────────────────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  console.error(
    "❌  RAPIDAPI_KEY não encontrada.\n" +
      "    Crie o arquivo scripts/.env com:\n" +
      "    RAPIDAPI_KEY=sua_chave_aqui\n"
  );
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Normaliza o nome para a busca: lowercase, sem parênteses e conteúdo entre eles.
 * Ex: "Supino Reto (Barra)" → "supino reto"
 */
function normalizarNome(nome) {
  return nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Busca na ExerciseDB pelo nome e retorna o gifUrl do primeiro resultado.
 * Tenta duas vezes: com o nome completo e, se falhar, com a primeira palavra-chave.
 */
async function buscarGifExerciseDB(nomeOriginal) {
  const tentativas = [
    normalizarNome(nomeOriginal),
    normalizarNome(nomeOriginal).split(" ")[0], // só a primeira palavra
  ];

  for (const termo of tentativas) {
    try {
      const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(termo)}?limit=1&offset=0`;
      const resp = await fetch(url, {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
        },
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          console.warn("  ⚠️  Rate limit atingido — aguardando 2s...");
          await sleep(2000);
        }
        continue;
      }

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0 && data[0].gifUrl) {
        return data[0].gifUrl;
      }
    } catch (err) {
      console.warn(`  ⚠️  Erro de rede para "${termo}": ${err.message}`);
    }
  }

  return "";
}

// ── Script principal ──────────────────────────────────────
async function main() {
  console.log("🏋️  Popular GIFs — ExerciseDB (RapidAPI)\n");
  console.log("📡  Conectando ao Firebase...");

  const snap = await db.ref("exercicios").once("value");
  const exercicios = [];

  snap.forEach((child) => {
    const val = child.val();
    if (!val.gifUrl && val.nome_original) {
      exercicios.push({ id: child.key, ...val });
    }
  });

  const total = exercicios.length;
  console.log(`📋  ${total} exercícios sem gifUrl encontrados.\n`);

  if (total === 0) {
    console.log("✅  Nada a fazer — todos os exercícios já têm gifUrl.");
    process.exit(0);
  }

  let comGif = 0;
  let semGif = 0;

  for (let i = 0; i < exercicios.length; i++) {
    const ex = exercicios[i];
    const progresso = `[${i + 1}/${total}]`;

    process.stdout.write(`${progresso} Buscando: "${ex.nome_original}"... `);

    const gifUrl = await buscarGifExerciseDB(ex.nome_original);

    if (gifUrl) {
      await db.ref(`exercicios/${ex.id}/gifUrl`).set(gifUrl);
      console.log(`✅  GIF salvo`);
      comGif++;
    } else {
      await db.ref(`exercicios/${ex.id}/gifUrl`).set("");
      console.log(`❌  Não encontrado`);
      semGif++;
    }

    // Rate limit: 300ms entre requisições
    if (i < exercicios.length - 1) await sleep(300);
  }

  console.log("\n" + "─".repeat(50));
  console.log("📊  RESUMO FINAL");
  console.log(`   Total processados : ${total}`);
  console.log(`   ✅ Com GIF         : ${comGif}`);
  console.log(`   ❌ Sem GIF         : ${semGif}`);
  console.log("─".repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Erro fatal:", err.message || err);
  process.exit(1);
});
