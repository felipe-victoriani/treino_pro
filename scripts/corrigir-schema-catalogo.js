/**
 * corrigir-schema-catalogo.js
 * Migração única: conserta o descompasso de schema em /exercicios.
 *
 * PROBLEMA ENCONTRADO (2026-08-06):
 *   O catálogo em /exercicios tem 937 registros de duas origens:
 *     - 64 registros com chave push-id (o catálogo "real", em português,
 *       de js/services/exercicios-seed.js) — usam campos nome_original,
 *       musculo_principal, equipamento, mas NÃO têm nome, grupoMuscular,
 *       tipo nem ativo.
 *     - 873 registros com chave = nome em inglês (import bruto do dataset
 *       free-exercise-db) — têm ativo:true mas também não têm nome nem
 *       grupoMuscular.
 *   O seletor de exercícios do professor (js/services/exercicios.service.js)
 *   lê exercicios.orderByChild("ativo").equalTo(true) e espera os campos
 *   nome / grupoMuscular / tipo. Resultado: os 64 reais nunca apareciam
 *   (sem ativo=true) e os 873 em inglês apareciam sem nome nenhum.
 *
 * O QUE ESTE SCRIPT FAZ (idempotente — pode rodar mais de uma vez):
 *   1. Nos 64 registros push-id: adiciona nome (= nome_original),
 *      grupoMuscular (mapeado de musculo_principal), tipo (mapeado de
 *      equipamento), nivel normalizado (lowercase sem acento) e ativo:true.
 *      Não apaga nenhum campo existente.
 *   2. Nos 873 registros do free-exercise-db: seta ativo:false, pra saírem
 *      do seletor (ainda ficam no banco, só não aparecem pro professor).
 *      Nada é deletado.
 *
 * USO (PowerShell):
 *   $env:DB_SECRET="seu_secret"; node scripts/corrigir-schema-catalogo.js
 */

const DB_URL = "https://app-treino-academia-default-rtdb.firebaseio.com";
const DB_SECRET = process.env.DB_SECRET;

if (!DB_SECRET) {
  console.error(
    "❌  DB_SECRET não encontrado.\n" +
      '    Execute: $env:DB_SECRET="seu_secret"; node scripts/corrigir-schema-catalogo.js\n'
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
}

// ── Mapeamentos (baseados nos valores reais encontrados no catálogo) ──
const MUSCULO_PARA_GRUPO = {
  Peitoral: "peito",
  Costas: "costas",
  Pernas: "pernas",
  Ombros: "ombros",
  Bíceps: "biceps",
  Tríceps: "triceps",
  Abdômen: "abdomen",
  Glúteos: "gluteos",
};

const EQUIPAMENTO_PARA_TIPO = {
  Barra: "peso_livre",
  "Barra W": "peso_livre",
  Halteres: "peso_livre",
  "Cabo / Pulley": "cabo",
  Máquina: "maquina",
  "Peso Corporal": "peso_corporal",
};

function normalizarNivel(nivel) {
  const m = {
    Iniciante: "iniciante",
    Intermediário: "intermediario",
    Avançado: "avancado",
  };
  return m[nivel] || nivel;
}

async function main() {
  console.log("🔍  Carregando /exercicios...");
  const dados = await dbGet("exercicios");
  if (!dados) {
    console.error("❌  Nada encontrado em /exercicios");
    process.exit(1);
  }

  const entradas = Object.entries(dados);
  const catalogoPT = entradas.filter(([k]) => k.startsWith("-"));
  const importBruto = entradas.filter(([k]) => !k.startsWith("-"));

  console.log(`📋  ${catalogoPT.length} registros do catálogo PT (push-id)`);
  console.log(`📋  ${importBruto.length} registros do import bruto (free-exercise-db)\n`);

  // ── Parte 1: corrige os 64 registros PT ──────────────────────
  console.log("🔧  Corrigindo schema do catálogo PT...");
  let corrigidos = 0;
  let semMapeamento = [];

  for (const [id, ex] of catalogoPT) {
    const grupoMuscular = MUSCULO_PARA_GRUPO[ex.musculo_principal];
    const tipo = EQUIPAMENTO_PARA_TIPO[ex.equipamento];

    if (!grupoMuscular || !tipo) {
      semMapeamento.push({ id, nome: ex.nome_original, musculo: ex.musculo_principal, equipamento: ex.equipamento });
    }

    const patch = {
      nome: ex.nome_original || ex.nome || "",
      ativo: true,
    };
    if (grupoMuscular) patch.grupoMuscular = grupoMuscular;
    if (tipo) patch.tipo = tipo;
    if (ex.nivel) patch.nivel = normalizarNivel(ex.nivel);

    await dbPatch(`exercicios/${id}`, patch);
    corrigidos++;
    process.stdout.write(`\r  ${corrigidos}/${catalogoPT.length}`);
    await sleep(80);
  }
  console.log(`\n✅  ${corrigidos} registros do catálogo PT corrigidos.`);
  if (semMapeamento.length) {
    console.log("⚠️   Sem mapeamento de grupo/tipo (revisar manualmente):");
    semMapeamento.forEach((e) =>
      console.log(`     - ${e.nome} (musculo="${e.musculo}", equipamento="${e.equipamento}")`)
    );
  }

  // ── Parte 2: desativa os 873 registros do import bruto ───────
  console.log("\n🔧  Desativando registros do import bruto (free-exercise-db)...");
  let desativados = 0;
  for (const [id] of importBruto) {
    await dbPatch(`exercicios/${id}`, { ativo: false });
    desativados++;
    if (desativados % 20 === 0) process.stdout.write(`\r  ${desativados}/${importBruto.length}`);
    await sleep(50);
  }
  console.log(`\n✅  ${desativados} registros do import bruto desativados (não aparecem mais no seletor, mas não foram apagados).`);

  console.log("\n" + "─".repeat(50));
  console.log("📊  RESUMO");
  console.log(`   Catálogo PT corrigido : ${corrigidos}`);
  console.log(`   Import bruto desativado: ${desativados}`);
  console.log("─".repeat(50));
  console.log(
    "\n➡️   Próximo passo: rode scripts/popular-gifs-workoutx.js de novo\n" +
      "     (ele agora vai sobrescrever o gifUrl errado dos 64 exercícios reais)."
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Erro fatal:", err.message || err);
  process.exit(1);
});
