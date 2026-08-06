/**
 * migrar-gifs-treinos.js
 * Copia o campo gifUrl de /exercicios para todos os exercícios salvos em /treinos
 * que ainda não têm gifUrl, fazendo match pelo nome do exercício.
 *
 * USO:
 *   $env:DB_SECRET="seu_secret"; node scripts/migrar-gifs-treinos.js
 *
 *   Onde encontrar o secret:
 *   Firebase Console → ⚙️ Configurações → Contas de serviço → Secrets do banco de dados
 */

const DB_URL = "https://app-treino-academia-default-rtdb.firebaseio.com";
const DB_SECRET = process.env.DB_SECRET;

if (!DB_SECRET) {
  console.error(
    "❌  DB_SECRET não encontrado.\n" +
      "    Execute assim:\n" +
      '    $env:DB_SECRET="seu_secret"; node scripts/migrar-gifs-treinos.js\n'
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function dbGet(path) {
  const resp = await fetch(`${DB_URL}/${path}.json?auth=${DB_SECRET}`);
  if (!resp.ok) throw new Error(`Firebase GET ${path} → ${resp.status}`);
  return resp.json();
}

async function dbPatch(path, value) {
  const resp = await fetch(`${DB_URL}/${path}.json?auth=${DB_SECRET}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!resp.ok) throw new Error(`Firebase PATCH ${path} → ${resp.status}`);
  return resp.json();
}

async function main() {
  console.log("🔍  Carregando catálogo de exercícios...");
  const exerciciosCatalogo = await dbGet("exercicios");
  if (!exerciciosCatalogo) {
    console.error("❌  Nenhum exercício encontrado em /exercicios");
    process.exit(1);
  }

  // Normaliza string: remove acentos e lowercase
  function norm(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Monta índice de nome → gifUrl (usando todas as variações de nome)
  const catalogEntries = Object.values(exerciciosCatalogo)
    .filter(ex => ex.gifUrl)
    .map(ex => ({
      nome: norm(ex.nome_original || ex.nome || ""),
      gifUrl: ex.gifUrl,
    }))
    .filter(e => e.nome.length >= 4);

  function buscarGif(nome) {
    if (!nome) return null;
    const chave = norm(nome);
    if (chave.length < 3) return null;
    // 1. Exact
    const exact = catalogEntries.find(e => e.nome === chave);
    if (exact) return exact.gifUrl;
    // 2. Catálogo começa com o nome do treino
    const prefix = catalogEntries.find(e => e.nome.startsWith(chave) && chave.length >= 4);
    if (prefix) return prefix.gifUrl;
    // 3. Nome do treino começa com nome do catálogo
    const rprefix = catalogEntries.find(e => chave.startsWith(e.nome) && e.nome.length >= 4);
    if (rprefix) return rprefix.gifUrl;
    // 4. Substring: catálogo contém o nome do treino
    const contains = catalogEntries.find(e => e.nome.includes(chave) && chave.length >= 5);
    if (contains) return contains.gifUrl;
    // 5. Substring reverso: nome do treino contém parte do catálogo
    const rcontains = catalogEntries.find(e => chave.includes(e.nome) && e.nome.length >= 5);
    if (rcontains) return rcontains.gifUrl;
    // 6. Cada palavra do treino existe no catálogo (todos os termos >= 4 chars)
    const words = chave.split(/\s+/).filter(w => w.length >= 4);
    if (words.length > 0) {
      const allWords = catalogEntries.find(e => words.every(w => e.nome.includes(w)));
      if (allWords) return allWords.gifUrl;
    }
    return null;
  }

  const totalCatalogo = catalogEntries.length;
  console.log(`✅  ${totalCatalogo} exercícios com gifUrl no catálogo`);

  console.log("\n🔍  Carregando treinos dos alunos...");
  const treinos = await dbGet("treinos");
  if (!treinos) {
    console.log("ℹ️   Nenhum treino encontrado em /treinos");
    return;
  }

  let atualizados = 0;
  let pulados = 0;
  let semGif = 0;

  for (const [alunoId, letras] of Object.entries(treinos)) {
    if (!letras || typeof letras !== "object") continue;

    for (const [letra, treinoData] of Object.entries(letras)) {
      if (!treinoData?.exercicios) continue;

      for (const [exId, ex] of Object.entries(treinoData.exercicios)) {
        // Já tem gifUrl — pula
        if (ex.gifUrl) {
          pulados++;
          continue;
        }

        const nomeKey = (ex.nome || "").toLowerCase();
        const gifUrl = buscarGif(ex.nome);

        if (!gifUrl) {
          semGif++;
          console.log(`  ⚠️  SEM MATCH: "${ex.nome}" (aluno ${alunoId.slice(0,8)} / treino ${letra})`);
          continue;
        }

        const path = `treinos/${alunoId}/${letra}/exercicios/${exId}`;
        await dbPatch(path, { gifUrl });
        console.log(`  ✔ ${alunoId} / Treino ${letra} / ${ex.nome}`);
        atualizados++;
        await sleep(100); // evita rate limit
      }
    }
  }

  console.log("\n📊  Resumo:");
  console.log(`   ✅  Atualizados: ${atualizados}`);
  console.log(`   ⏭️   Já tinham gifUrl: ${pulados}`);
  console.log(`   ⚠️   Sem match no catálogo: ${semGif}`);
  console.log("\n✅  Migração concluída!");
}

main().catch((err) => {
  console.error("❌  Erro:", err.message);
  process.exit(1);
});
