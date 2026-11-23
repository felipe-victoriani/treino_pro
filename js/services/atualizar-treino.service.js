/* ============================================================
   TREINO PRO — Atualizar exercícios do aluno (professor / adm)
   Troca os exercícios do treino do aluno por outros do mesmo grupo
   muscular, sem repetir os que ele já faz. Mantém letras, nomes,
   quantidade por grupo e a prescrição (séries/reps/descanso) de cada
   posição. Mostra prévia antes de salvar e guarda cópia para desfazer.

   Dois tipos de aluno:
     - com professor → /treinos/{aluno}/{A..E}/exercicios (pushId → ex)
     - treino IA     → /alunos|users/{aluno}/treinoGerado/treinos/{L}

   Depende de: db, TreinoIAService, sanitize, showToast (utils.js)
   Segurança: quem pode gravar é decidido pelas regras do Firebase
   (adm: todos; professor: só os próprios alunos).
   ============================================================ */

const AtualizarTreinoService = (() => {
  const LETRA_RE = /^[A-F]$/;
  const NIVEL_LABEL_TO_KEY = {
    Iniciante: "INICIANTE",
    Intermediário: "INTERMEDIARIO",
    Experiente: "AVANCADO",
    Avançado: "AVANCADO",
  };

  // lista de exercícios vinda do Firebase pode ser array ou objeto
  const _comoLista = (v) => (Array.isArray(v) ? v : Object.values(v || {}));

  /* ── Catálogo: acha o grupo muscular de cada exercício ──── */
  async function _indiceCatalogo() {
    const snap = await TreinoIAService.catalogo();
    const porId = new Map();
    const porNome = new Map();
    snap.forEach((child) => {
      const ex = { id: child.key, ...child.val() };
      porId.set(ex.id, ex);
      [ex.nome, ex.nome_original].forEach((n) => {
        const k = TreinoIAService.normNome(n);
        if (k && !porNome.has(k)) porNome.set(k, ex);
      });
    });
    return { porId, porNome };
  }

  function _grupoDe(ex, idx) {
    const catId = ex.exercicioId || ex.id;
    const doCatalogo =
      (catId && idx.porId.get(catId)) ||
      idx.porNome.get(TreinoIAService.normNome(ex.nome));
    return (
      TreinoIAService.normalizarGrupo(doCatalogo?.musculo_principal) ||
      TreinoIAService.normalizarGrupo(doCatalogo?.grupoMuscular) ||
      TreinoIAService.normalizarGrupo(ex.grupoMuscular)
    );
  }

  /* ── 1. Carregar treino atual ───────────────────────────── */
  async function carregar(alunoId) {
    const [alunoSnap, treinosSnap, idx] = await Promise.all([
      db.ref(`alunos/${alunoId}`).once("value"),
      db.ref(`treinos/${alunoId}`).once("value"),
      _indiceCatalogo(),
    ]);
    const aluno = alunoSnap.val() || {};
    const treinosProf = treinosSnap.val() || {};
    const letrasProf = Object.keys(treinosProf)
      .filter((k) => LETRA_RE.test(k) && treinosProf[k]?.exercicios)
      .sort();
    const gerado = aluno.treinoGerado;

    let tipo, letras, bruto;
    if (letrasProf.length && (aluno.professorId || aluno.programaAtivo !== "ia-custom")) {
      tipo = "professor";
      bruto = {};
      letras = letrasProf.map((L) => {
        bruto[L] = { exercicios: treinosProf[L].exercicios };
        const exercicios = Object.entries(treinosProf[L].exercicios)
          .map(([key, ex]) => ({ key, ...ex }))
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        return { letra: L, nome: treinosProf[L].foco || `Treino ${L}`, exercicios };
      });
    } else if (aluno.programaAtivo === "ia-custom" && gerado?.treinos) {
      tipo = "ia";
      bruto = gerado.treinos;
      letras = Object.keys(gerado.treinos)
        .filter((L) => LETRA_RE.test(L))
        .sort()
        .map((L) => ({
          letra: L,
          nome: gerado.treinos[L].nome || `Treino ${L}`,
          exercicios: _comoLista(gerado.treinos[L].exercicios),
        }));
    } else {
      throw new Error("Este aluno ainda não tem treino montado para atualizar.");
    }

    letras.forEach((l) => l.exercicios.forEach((ex) => (ex.grupo = _grupoDe(ex, idx))));

    return {
      alunoId,
      tipo,
      letras,
      bruto,
      idx,
      nivel:
        aluno.nivel ||
        NIVEL_LABEL_TO_KEY[gerado?.nivel] ||
        "INTERMEDIARIO",
      objetivo: gerado?.objetivo || aluno.objetivo || "Hipertrofia",
      equipamentos: gerado?.equipamentos || "Academia completa",
      ultimaAtualizacao: aluno.exerciciosAtualizadosEm || null,
      temBackup: !!aluno.backupTreino,
    };
  }

  /** Resumo para a tela inicial do modal */
  function resumo(estado) {
    let trocar = 0, manter = 0, letrasComTroca = 0;
    estado.letras.forEach((l) => {
      const n = l.exercicios.filter((ex) => ex.grupo).length;
      trocar += n;
      manter += l.exercicios.length - n;
      if (n) letrasComTroca++;
    });
    const comVideo = estado.letras.reduce(
      (s, l) => s + l.exercicios.filter((ex) => ex.grupo && ex.videoUrl).length,
      0,
    );
    return { trocar, manter, letrasComTroca, comVideo };
  }

  /* ── 2. Gerar proposta (não grava nada) ─────────────────── */
  async function gerarProposta(estado, onProgresso) {
    // evita repetir qualquer exercício do plano atual, em qualquer letra
    const ids = [];
    const nomes = [];
    estado.letras.forEach((l) =>
      l.exercicios.forEach((ex) => {
        const id = ex.exercicioId || ex.id;
        if (id) ids.push(id);
        if (ex.nome) nomes.push(ex.nome);
      }),
    );

    const proposta = {};
    for (const l of estado.letras) {
      const contagem = new Map();
      l.exercicios.forEach((ex) => {
        if (ex.grupo) contagem.set(ex.grupo, (contagem.get(ex.grupo) || 0) + 1);
      });
      if (!contagem.size) continue; // nada para trocar nesta letra

      onProgresso?.(l.letra, l.nome);
      try {
        const treino = await TreinoIAService.gerar({
          uid: estado.alunoId,
          nivel: estado.nivel,
          objetivo: estado.objetivo,
          equipamentos: estado.equipamentos,
          grupos: [...contagem].map(([musculo, qtd]) => ({ musculo, qtd })),
          excluir: { ids, nomes },
          salvar: false,
        });
        // o que entrou nesta letra também não se repete nas próximas
        treino.exercicios.forEach((ex) => {
          if (ex.id) ids.push(ex.id);
          if (ex.nome) nomes.push(ex.nome);
        });
        proposta[l.letra] = { itens: _encaixar(l.exercicios, treino.exercicios) };
      } catch (err) {
        // limite diário: não adianta tentar as outras letras
        if (err?.code === "functions/resource-exhausted" || /Limite diário/i.test(err?.message)) {
          throw err;
        }
        console.error(`[AtualizarTreino] Treino ${l.letra}:`, err);
        proposta[l.letra] = { erro: err?.message || "Falha ao gerar" };
      }
    }
    return proposta;
  }

  // Cada exercício antigo é trocado por um novo do MESMO grupo, na mesma
  // posição. Sem novo disponível (catálogo pequeno), o antigo fica.
  function _encaixar(antigos, novos) {
    // IA às vezes devolve o mesmo exercício: isso não conta como troca
    const norm = TreinoIAService.normNome;
    const idsAntigos = new Set(antigos.map((a) => a.exercicioId || a.id).filter(Boolean));
    const nomesAntigos = new Set(antigos.map((a) => norm(a.nome)));
    const repetido = (ex) =>
      (ex.id && idsAntigos.has(ex.id)) || nomesAntigos.has(norm(ex.nome));

    const fila = new Map();
    novos.forEach((ex) => {
      if (!ex.grupo || repetido(ex)) return;
      if (!fila.has(ex.grupo)) fila.set(ex.grupo, []);
      fila.get(ex.grupo).push(ex);
    });
    return antigos.map((antigo) => ({
      antigo,
      novo: (antigo.grupo && fila.get(antigo.grupo)?.shift()) || null,
    }));
  }

  /* ── 3. Salvar (com cópia para desfazer) ────────────────── */
  function _exercicioProfessor(antigo, novo, ordem, idx) {
    const cat = idx.porId.get(novo.id) || {};
    return {
      nome: novo.nome || cat.nome || cat.nome_original || "",
      exercicioId: novo.id || "",
      grupoMuscular: TreinoIAService.grupoAntigo(novo.grupo) || antigo.grupoMuscular || "",
      tipo: cat.tipo || "",
      instrucoes: cat.instrucoes || "",
      // prescrição do professor continua a mesma na posição
      series: antigo.series || String(novo.series || 3),
      repeticoes: antigo.repeticoes || String(novo.repeticoes || "10-12"),
      carga: "", // exercício novo: carga anterior não vale
      descanso: antigo.descanso || String(novo.descanso_segundos || 60),
      observacoes: novo.dica_execucao || "",
      videoLegenda: "",
      gifUrl: cat.gifUrl || "",
      ordem,
    };
  }

  function _exercicioIA(antigo, novo) {
    return {
      ...(novo.id ? { id: novo.id } : {}),
      nome: novo.nome,
      series: antigo.series ?? novo.series,
      repeticoes: antigo.repeticoes ?? novo.repeticoes,
      descanso: antigo.descanso ?? `${novo.descanso_segundos || 60}s`,
      observacao: novo.dica_execucao || "",
    };
  }

  async function salvar(estado, proposta, porUid) {
    const a = estado.alunoId;
    const agora = Date.now();
    const updates = {};
    let trocados = 0;

    estado.letras.forEach((l) => {
      const p = proposta[l.letra];
      if (!p?.itens) return;

      if (estado.tipo === "professor") {
        const exercicios = {};
        p.itens.forEach(({ antigo, novo }, ordem) => {
          if (novo) {
            const key = db.ref().push().key;
            exercicios[key] = _exercicioProfessor(antigo, novo, ordem, estado.idx);
            trocados++;
          } else {
            const { key, grupo, ...resto } = antigo;
            exercicios[key] = { ...resto, ordem };
          }
        });
        updates[`treinos/${a}/${l.letra}/exercicios`] = exercicios;
      } else {
        const lista = p.itens.map(({ antigo, novo }) => {
          if (novo) trocados++;
          if (novo) return _exercicioIA(antigo, novo);
          const { grupo, ...resto } = antigo;
          return resto;
        });
        updates[`alunos/${a}/treinoGerado/treinos/${l.letra}/exercicios`] = lista;
        updates[`users/${a}/treinoGerado/treinos/${l.letra}/exercicios`] = lista;
      }
    });

    if (!trocados) throw new Error("Nenhum exercício novo para salvar.");

    updates[`alunos/${a}/backupTreino`] = {
      em: agora,
      por: porUid || null,
      tipo: estado.tipo,
      dados: estado.bruto,
    };
    updates[`alunos/${a}/exerciciosAtualizadosEm`] = agora;
    if (estado.tipo === "ia") {
      updates[`alunos/${a}/treinoGerado/atualizadoEm`] = agora;
      updates[`users/${a}/treinoGerado/atualizadoEm`] = agora;
    }

    await db.ref().update(updates); // tudo ou nada
    return { trocados };
  }

  /* ── 4. Desfazer a última atualização ───────────────────── */
  async function desfazer(alunoId) {
    const snap = await db.ref(`alunos/${alunoId}/backupTreino`).once("value");
    const backup = snap.val();
    if (!backup?.dados) throw new Error("Não há atualização para desfazer.");

    const updates = {};
    if (backup.tipo === "professor") {
      Object.entries(backup.dados).forEach(([L, d]) => {
        updates[`treinos/${alunoId}/${L}/exercicios`] = d.exercicios || null;
      });
    } else {
      Object.entries(backup.dados).forEach(([L, d]) => {
        updates[`alunos/${alunoId}/treinoGerado/treinos/${L}/exercicios`] = d.exercicios || null;
        updates[`users/${alunoId}/treinoGerado/treinos/${L}/exercicios`] = d.exercicios || null;
      });
    }
    updates[`alunos/${alunoId}/backupTreino`] = null;
    updates[`alunos/${alunoId}/exerciciosAtualizadosEm`] = null;
    await db.ref().update(updates);
  }

  return { carregar, resumo, gerarProposta, salvar, desfazer };
})();

/* ============================================================
   Modal "Atualizar exercícios" — mesmo componente no professor e no adm
   Uso: AtualizarTreinoUI.abrir({ alunoId, nome, aoSalvar })
   ============================================================ */
const AtualizarTreinoUI = (() => {
  let modal, corpo, rodape, titulo;
  let ctx = null; // { alunoId, nome, aoSalvar, estado, proposta, ocupado }
  let focoAnterior = null;

  const esc = (s) => (typeof sanitize === "function" ? sanitize(s) : String(s ?? ""));
  const dataBR = (ms) =>
    new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  function _montar() {
    if (modal) return;
    const css = document.createElement("style");
    css.textContent = `
      .at-sub{color:var(--text-muted);font-size:.85rem;margin:-4px 0 14px}
      .at-info{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
      .at-stat{border:1px solid var(--border-card);border-radius:var(--radius-md);padding:10px;text-align:center}
      .at-stat strong{display:block;font-size:1.25rem;color:var(--text-white)}
      .at-stat span{font-size:.75rem;color:var(--text-muted)}
      .at-aviso{background:var(--warn-bg);color:var(--warn-fg);border-radius:var(--radius-md);padding:10px 12px;font-size:.82rem;margin-bottom:10px;line-height:1.4}
      .at-nota{font-size:.8rem;color:var(--text-muted);line-height:1.45}
      .at-progresso{display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 8px;text-align:center;color:var(--text-secondary)}
      .at-letra{margin-bottom:14px}
      .at-letra h4{font-size:.88rem;margin:0 0 6px;color:var(--text-white)}
      .at-linha{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;font-size:.82rem;padding:6px 0;border-top:1px solid var(--border-subtle)}
      .at-antigo{color:var(--text-muted);text-decoration:line-through}
      .at-novo{color:var(--text-white);font-weight:600}
      .at-mantido{color:var(--text-muted);font-style:italic}
      .at-seta{color:var(--text-muted)}
      .at-erro{background:var(--err-bg);color:var(--err-fg);border-radius:var(--radius-md);padding:8px 10px;font-size:.8rem}
      .at-lista{max-height:52vh;overflow-y:auto;padding-right:4px}
      .at-rodape{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
      .at-rodape .at-esq{margin-right:auto}
      @media (max-width:520px){.at-linha{grid-template-columns:1fr;gap:2px}.at-seta{display:none}.at-rodape{flex-direction:column-reverse}.at-rodape button{width:100%;white-space:normal}.at-rodape .at-esq{margin-right:0}}
    `;
    document.head.appendChild(css);

    modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modal-atualizar-treino";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "at-titulo");
    modal.innerHTML = `
      <div class="modal-content modal-content-md">
        <div class="modal-header">
          <h3 class="modal-title" id="at-titulo">Atualizar exercícios</h3>
          <button type="button" class="modal-close" aria-label="Fechar">×</button>
        </div>
        <div id="at-corpo" aria-live="polite"></div>
        <div class="modal-footer at-rodape" id="at-rodape"></div>
      </div>`;
    document.body.appendChild(modal);
    corpo = modal.querySelector("#at-corpo");
    rodape = modal.querySelector("#at-rodape");
    titulo = modal.querySelector("#at-titulo");
    modal.querySelector(".modal-close").addEventListener("click", fechar);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) fechar();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) fechar();
    });
  }

  function _botoes(lista) {
    rodape.innerHTML = "";
    lista.forEach(({ texto, classe, acao, esquerda }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = (classe || "btn-secondary") + (esquerda ? " at-esq" : "");
      b.textContent = texto;
      b.addEventListener("click", acao);
      rodape.appendChild(b);
    });
    rodape.lastElementChild?.focus();
  }

  function _carregando(msg) {
    corpo.innerHTML = `<div class="at-progresso"><div class="spinner"></div><p id="at-msg">${esc(msg)}</p></div>`;
    rodape.innerHTML = "";
  }

  function _erro(msg, tentar) {
    corpo.innerHTML = `<div class="at-erro">${esc(msg)}</div>`;
    _botoes([
      { texto: "Fechar", acao: fechar },
      ...(tentar ? [{ texto: "Tentar de novo", classe: "btn-primary", acao: tentar }] : []),
    ]);
  }

  async function abrir({ alunoId, nome, aoSalvar }) {
    _montar();
    if (!alunoId) return;
    focoAnterior = document.activeElement;
    ctx = { alunoId, nome, aoSalvar };
    titulo.textContent = "Atualizar exercícios";
    modal.classList.add("open");
    _carregando("Carregando treino do aluno...");
    try {
      ctx.estado = await AtualizarTreinoService.carregar(alunoId);
      _telaInicial();
    } catch (err) {
      console.error("[AtualizarTreino]", err);
      _erro(err.message || "Erro ao carregar o treino.");
    }
  }

  function _telaInicial() {
    const est = ctx.estado;
    const r = AtualizarTreinoService.resumo(est);
    const ultima = est.ultimaAtualizacao
      ? `Última atualização em ${dataBR(est.ultimaAtualizacao)}.`
      : "Os exercícios deste aluno ainda não foram atualizados por aqui.";
    corpo.innerHTML = `
      <p class="at-sub">${esc(ctx.nome || "Aluno")} · ${est.tipo === "professor" ? "treino do professor" : "treino gerado por IA"}</p>
      <div class="at-info">
        <div class="at-stat"><strong>${r.letrasComTroca}</strong><span>treinos</span></div>
        <div class="at-stat"><strong>${r.trocar}</strong><span>exercícios a trocar</span></div>
        <div class="at-stat"><strong>${r.manter}</strong><span>mantidos</span></div>
      </div>
      ${r.comVideo ? `<div class="at-aviso">${r.comVideo} exercício(s) trocado(s) têm vídeo enviado pelo professor. O vídeo sai do treino junto com o exercício.</div>` : ""}
      ${r.manter ? `<p class="at-nota">Exercícios sem grupo muscular reconhecido (cardio, mobilidade, personalizados) ficam como estão.</p>` : ""}
      <p class="at-nota">Cada exercício é trocado por outro do mesmo grupo, sem repetir os atuais. Séries, repetições e descanso continuam os mesmos. Você vê a prévia antes de salvar. ${esc(ultima)}</p>`;

    const botoes = [{ texto: "Cancelar", acao: fechar }];
    if (est.temBackup) botoes.unshift({ texto: "Desfazer última atualização", classe: "btn-ghost", esquerda: true, acao: _desfazer });
    if (r.trocar) botoes.push({ texto: "Gerar novos exercícios", classe: "btn-primary", acao: _gerar });
    else corpo.insertAdjacentHTML("beforeend", `<div class="at-erro" style="margin-top:10px">Nenhum exercício com grupo muscular reconhecido para trocar.</div>`);
    _botoes(botoes);
  }

  async function _gerar() {
    if (ctx.ocupado) return;
    ctx.ocupado = true;
    _carregando("Preparando...");
    try {
      ctx.proposta = await AtualizarTreinoService.gerarProposta(ctx.estado, (L, nome) => {
        const el = corpo.querySelector("#at-msg");
        if (el) el.textContent = `Gerando Treino ${L} — ${nome}...`;
      });
      _telaPrevia();
    } catch (err) {
      console.error("[AtualizarTreino]", err);
      _erro(err.message || "Erro ao gerar exercícios.", _gerar);
    } finally {
      ctx.ocupado = false;
    }
  }

  function _telaPrevia() {
    const { estado, proposta } = ctx;
    let novos = 0;
    const blocos = estado.letras
      .filter((l) => proposta[l.letra])
      .map((l) => {
        const p = proposta[l.letra];
        if (p.erro) return `<div class="at-letra"><h4>Treino ${esc(l.letra)} — ${esc(l.nome)}</h4><div class="at-erro">Não foi possível gerar: ${esc(p.erro)}. Este treino fica como está.</div></div>`;
        const linhas = p.itens
          .map(({ antigo, novo }) => {
            if (novo) novos++;
            return novo
              ? `<div class="at-linha"><span class="at-antigo">${esc(antigo.nome)}</span><span class="at-seta" aria-hidden="true">→</span><span class="at-novo">${esc(novo.nome)}</span></div>`
              : `<div class="at-linha"><span>${esc(antigo.nome)}</span><span class="at-seta" aria-hidden="true">·</span><span class="at-mantido">mantido · sem alternativa</span></div>`;
          })
          .join("");
        return `<div class="at-letra"><h4>Treino ${esc(l.letra)} — ${esc(l.nome)}</h4>${linhas}</div>`;
      })
      .join("");

    titulo.textContent = "Prévia dos novos exercícios";
    corpo.innerHTML = `<p class="at-sub">${esc(ctx.nome || "Aluno")} · ${novos} exercício(s) novo(s). Nada foi salvo ainda.</p><div class="at-lista">${blocos}</div>`;
    _botoes([
      { texto: "Cancelar", acao: fechar, esquerda: true },
      { texto: "Gerar de novo", acao: _gerar },
      ...(novos ? [{ texto: "Salvar treino", classe: "btn-primary", acao: _salvar }] : []),
    ]);
  }

  async function _salvar() {
    if (ctx.ocupado) return;
    ctx.ocupado = true;
    _carregando("Salvando...");
    try {
      const uid = firebase.auth().currentUser?.uid;
      const { trocados } = await AtualizarTreinoService.salvar(ctx.estado, ctx.proposta, uid);
      showToast(`${trocados} exercício(s) atualizado(s) para ${ctx.nome || "o aluno"}.`, "success");
      const aoSalvar = ctx.aoSalvar;
      fechar(true);
      aoSalvar?.();
    } catch (err) {
      console.error("[AtualizarTreino]", err);
      _erro(
        err?.code === "PERMISSION_DENIED" || /permission/i.test(err?.message)
          ? "Sem permissão para alterar o treino deste aluno."
          : err.message || "Erro ao salvar.",
        _telaPrevia,
      );
    } finally {
      if (ctx) ctx.ocupado = false;
    }
  }

  async function _desfazer() {
    if (ctx.ocupado) return;
    if (!confirm("Voltar o treino deste aluno para como estava antes da última atualização?")) return;
    ctx.ocupado = true;
    _carregando("Desfazendo...");
    try {
      await AtualizarTreinoService.desfazer(ctx.alunoId);
      showToast("Treino restaurado.", "success");
      const aoSalvar = ctx.aoSalvar;
      fechar(true);
      aoSalvar?.();
    } catch (err) {
      console.error("[AtualizarTreino]", err);
      _erro(err.message || "Erro ao desfazer.");
    } finally {
      if (ctx) ctx.ocupado = false;
    }
  }

  function fechar(forcar) {
    if (!modal) return;
    // não fecha no meio de uma geração/salvamento (perderia o resultado)
    if (ctx?.ocupado && forcar !== true) return;
    modal.classList.remove("open");
    ctx = null;
    focoAnterior?.focus?.();
  }

  return { abrir, fechar };
})();
