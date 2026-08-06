const DB_URL = "https://app-treino-academia-default-rtdb.firebaseio.com";
const DB_SECRET = process.env.DB_SECRET;

async function main() {
  // Lista alunos
  const r = await fetch(`${DB_URL}/treinos.json?auth=${DB_SECRET}&shallow=true`);
  const alunos = await r.json();
  if (!alunos) { console.log("Sem treinos"); return; }

  for (const uid of Object.keys(alunos)) {
    const r2 = await fetch(`${DB_URL}/treinos/${uid}.json?auth=${DB_SECRET}&shallow=true`);
    const letras = await r2.json();
    if (!letras) continue;

    for (const letra of Object.keys(letras)) {
      const r3 = await fetch(`${DB_URL}/treinos/${uid}/${letra}/exercicios.json?auth=${DB_SECRET}&shallow=true`);
      const exsRaw = await r3.json();
      if (!exsRaw) continue;

      const exId = Object.keys(exsRaw)[0];
      const r4 = await fetch(`${DB_URL}/treinos/${uid}/${letra}/exercicios/${exId}.json?auth=${DB_SECRET}`);
      const ex = await r4.json();

      console.log(`\n=== ALUNO ${uid.slice(0,8)} | TREINO ${letra} ===`);
      console.log(JSON.stringify(ex, null, 2));

      // Verificar se tem gifUrl no catálogo pelo mesmo nome
      if (ex && ex.nome) {
        const r5 = await fetch(`${DB_URL}/exercicios.json?auth=${DB_SECRET}&orderBy="nome"&equalTo="${encodeURIComponent(ex.nome)}"`);
        const found = await r5.json();
        console.log(`\nMatch no catálogo por nome "${ex.nome}":`, JSON.stringify(found));
      }
      return; // Só precisa de 1 exemplo
    }
  }
}
main().catch(console.error);
