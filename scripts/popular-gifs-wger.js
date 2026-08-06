/**
 * popular-gifs-wger.js
 * Popula o campo gifUrl nos exercícios do Firebase usando a Wger API (gratuita, sem chave).
 *
 * ATENÇÃO: A Wger retorna imagens estáticas (JPG/PNG), não GIFs animados.
 * Para GIFs animados reais, use: node scripts/popular-gifs.js
 *
 * PRÉ-REQUISITOS:
 *   Nenhuma dependência extra — usa apenas a REST API do Firebase.
 *   Precisa do Database Secret do projeto:
 *   Firebase Console → Configurações do projeto → Contas de serviço → Secrets do banco de dados
 *
 * USO:
 *   $env:DB_SECRET="seu_secret_aqui"; node scripts/popular-gifs-wger.js
 */

const DB_URL = "https://app-treino-academia-default-rtdb.firebaseio.com";
const DB_SECRET = process.env.DB_SECRET;

if (!DB_SECRET) {
  console.error(
    "❌  DB_SECRET não encontrado.\n" +
      "    Execute assim:\n" +
      '    $env:DB_SECRET="seu_secret"; node scripts/popular-gifs-wger.js\n' +
      "\n" +
      "    Onde encontrar o secret:\n" +
      "    Firebase Console → ⚙️ Configurações → Contas de serviço → Secrets do banco de dados\n"
  );
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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
 * Busca imagem na Wger API pelo nome em inglês.
 * Retorna a URL da imagem principal ou "" se não encontrar.
 */
async function buscarImagemWger(nomeOriginal) {
  try {
    const nomeCodificado = encodeURIComponent(nomeOriginal.toLowerCase());
    const respEx = await fetch(
      `https://wger.de/api/v2/exercise/?format=json&language=2&name=${nomeCodificado}`
    );
    if (!respEx.ok) return "";
    const dataEx = await respEx.json();
    const exercicio = dataEx.results?.[0];
    if (!exercicio) return "";

    const respImg = await fetch(
      `https://wger.de/api/v2/exerciseimage/?format=json&exercise_base=${exercicio.exercise_base}&is_main=True`
    );
    if (!respImg.ok) return "";
    const dataImg = await respImg.json();
    return dataImg.results?.[0]?.image || "";
  } catch {
    return "";
  }
}

// ── Script principal ──────────────────────────────────────
async function main() {
  console.log("🏋️  Popular imagens — Wger API (gratuita)\n");
  console.log(
    "⚠️   Wger retorna JPG/PNG, não GIFs animados.\n" +
      "    Para GIFs reais use: node scripts/popular-gifs.js\n"
  );
  console.log("📡  Lendo exercícios do Firebase...");

  const dados = await dbGet("exercicios");
  if (!dados) {
    console.log("❌  Nenhum exercício encontrado no Firebase.");
    process.exit(0);
  }

  const exercicios = Object.entries(dados)
    .filter(([, val]) => !val.gifUrl && val.nome_original)
    .map(([id, val]) => ({ id, ...val }));

  const total = exercicios.length;
  console.log(`📋  ${total} exercícios sem gifUrl encontrados.\n`);

  if (total === 0) {
    console.log("✅  Nada a fazer — todos os exercícios já têm gifUrl.");
    process.exit(0);
  }

  let comImagem = 0;
  let semImagem = 0;

  for (let i = 0; i < exercicios.length; i++) {
    const ex = exercicios[i];
    process.stdout.write(`[${i + 1}/${total}] Buscando: "${ex.nome_original}"... `);

    const imagemUrl = await buscarImagemWger(ex.nome_original);

    try {
      await dbSet(`exercicios/${ex.id}/gifUrl`, imagemUrl);
      if (imagemUrl) {
        console.log("✅  Salvo");
        comImagem++;
      } else {
        console.log("❌  Não encontrado");
        semImagem++;
      }
    } catch (err) {
      console.log(`⚠️  Erro ao salvar: ${err.message}`);
      semImagem++;
    }

    if (i < exercicios.length - 1) await sleep(500);
  }

  console.log("\n" + "─".repeat(50));
  console.log("📊  RESUMO FINAL");
  console.log(`   Total processados : ${total}`);
  console.log(`   ✅ Com imagem      : ${comImagem}`);
  console.log(`   ❌ Sem imagem      : ${semImagem}`);
  console.log("─".repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Erro fatal:", err.message || err);
  process.exit(1);
});
