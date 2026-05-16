/* ============================================================
   TREINO PRO - Painel do Administrador
   Gerencia cadastro de professores
   ============================================================ */

document.addEventListener("userReady", ({ detail: { user, userData } }) => {
  if (userData.tipo !== "admin") {
    showToast("Acesso negado.", "error");
    setTimeout(() => window.location.replace("login.html"), 1500);
    return;
  }
  const nomeEl = document.getElementById("admin-nome");
  if (nomeEl) nomeEl.textContent = userData.nome || "";
  initAdmin(user.uid);
});

async function initAdmin(adminUid) {
  /* --- Toggle senha --- */
  const togglePw = document.getElementById("toggle-prof-pw");
  const senhaInput = document.getElementById("prof-senha");

  const iconEyeOpen = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
  const iconEyeClosed = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 18.17L17.06 15.64C17.65 14.5 18 13.29 18 12c0-3.31-2.69-6-6-6-1.29 0-2.5.35-3.64.94L5.83 4.41 4.41 5.83l14.76 14.76 1.42-1.42zM12 6c3.31 0 6 2.69 6 6 0 .94-.23 1.82-.61 2.61l-1.47-1.47C16.3 12.79 16.35 12.41 16.35 12c0-2.39-1.96-4.35-4.35-4.35-.41 0-.79.05-1.15.14L9.38 6.32C10.17 6.12 11.07 6 12 6zM2 4.27l1.28 1.28.26.26C2.08 7.25 1 9.52 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zm7.53 7.53l-1.42-1.42C8.04 10.86 8 11.42 8 12c0 2.76 2.24 5 5 5 .58 0 1.14-.04 1.62-.11l-1.42-1.42C12.82 15.96 12.42 16 12 16c-2.21 0-4-1.79-4-4 0-.42.04-.82.11-1.2z"/></svg>`;

  togglePw?.addEventListener("click", () => {
    const isPassword = senhaInput.type === "password";
    senhaInput.type = isPassword ? "text" : "password";
    togglePw.innerHTML = isPassword ? iconEyeClosed : iconEyeOpen;
  });

  /* --- Carregar lista de professores e alunos --- */
  carregarProfessores();
  carregarAlunos();

  /* --- Submit: cadastrar professor --- */
  document
    .getElementById("form-professor")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const nome = sanitize(document.getElementById("prof-nome").value.trim());
      const email = document
        .getElementById("prof-email")
        .value.trim()
        .toLowerCase();
      const senha = document.getElementById("prof-senha").value;
      const tel = document.getElementById("prof-telefone").value.trim();

      let hasError = false;
      if (!nome || nome.length < 2) {
        showFieldError("prof-nome-error", "Informe o nome do professor");
        hasError = true;
      }
      if (!email || !isValidEmail(email)) {
        showFieldError("prof-email-error", "Informe um e-mail válido");
        hasError = true;
      }
      if (!senha || senha.length < 6) {
        showFieldError(
          "prof-senha-error",
          "A senha deve ter ao menos 6 caracteres",
        );
        hasError = true;
      }
      if (hasError) return;

      setLoading(true);

      /* Usa instância secundária para criar o usuário sem deslogar o admin */
      let secondaryApp = null;
      try {
        secondaryApp = firebase.initializeApp(
          window._firebaseConfig,
          "admin-secondary-" + Date.now(),
        );
        const secondaryAuth = secondaryApp.auth();

        const cred = await secondaryAuth.createUserWithEmailAndPassword(
          email,
          senha,
        );
        const uid = cred.user.uid;

        await secondaryAuth.signOut();
        await secondaryApp.delete();
        secondaryApp = null;

        const timestamp = Date.now();
        const updates = {};
        updates[`users/${uid}`] = {
          nome,
          email,
          tipo: "professor",
          telefone: tel || "",
          ativo: true,
          createdAt: timestamp,
        };
        updates[`professores/${uid}`] = {
          nome,
          email,
          telefone: tel || "",
          createdAt: timestamp,
        };

        console.log("[Admin] Gravando no DB:", updates);
        await db.ref().update(updates);
        console.log("[Admin] Gravação OK");

        showToast(`Professor "${nome}" cadastrado com sucesso!`, "success");
        document.getElementById("form-professor").reset();
        carregarProfessores();
      } catch (err) {
        if (secondaryApp) {
          try {
            await secondaryApp.delete();
          } catch (_) {}
        }
        console.error("[Admin] Erro no cadastro:", err.code, err.message);
        handleProfError(err);
      } finally {
        setLoading(false);
      }
    });
}

/* ---- Carregar lista de professores ---- */
async function carregarProfessores() {
  const lista = document.getElementById("lista-professores");
  const total = document.getElementById("total-professores");
  lista.innerHTML =
    '<div class="empty-state"><div class="spinner"></div></div>';

  try {
    const snap = await db.ref("professores").once("value");
    const data = snap.val();
    console.log("[Admin] professores lidos do DB:", data);

    if (!data) {
      lista.innerHTML =
        '<div class="empty-state"><p>Nenhum professor cadastrado ainda.</p></div>';
      total.textContent = "0";
      return;
    }

    const profs = Object.entries(data).map(([id, p]) => ({ id, ...p }));
    profs.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    total.textContent = profs.length;

    lista.innerHTML = profs
      .map(
        (p) => `
      <div class="admin-prof-card">
        <div class="admin-prof-info">
          <div class="admin-prof-nome">${sanitize(p.nome || "—")}</div>
          <div class="admin-prof-email">${sanitize(p.email || "—")}</div>
          ${p.telefone ? `<div class="admin-prof-tel">${sanitize(p.telefone)}</div>` : ""}
        </div>
        <div class="admin-prof-actions">
          <button class="btn-icon" title="Editar professor"
            onclick="abrirEditarProf('${p.id}', '${sanitize(p.nome || "")}', '${sanitize(p.telefone || "")}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn-icon btn-danger-icon" title="Remover professor"
            onclick="confirmarRemocao('${sanitize(p.id)}', '${sanitize(p.nome || "")}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
    `,
      )
      .join('<div class="list-divider"></div>');
  } catch (err) {
    lista.innerHTML =
      '<div class="empty-state"><p>Erro ao carregar professores.</p></div>';
    console.error("[Admin]", err);
  }
}

/* ---- Remover professor ---- */
function confirmarRemocao(profId, nome) {
  if (
    !confirm(
      `Remover o professor "${nome}"?\n\nEle perderá o acesso ao sistema.`,
    )
  )
    return;
  removerProfessor(profId, nome);
}

async function removerProfessor(profId, nome) {
  showLoading("Removendo professor e limpando dados...");
  try {
    // Chama Cloud Function para exclusão completa (dados + conta de autenticação)
    const functions = firebase.functions();
    const deletarProfessorFn = functions.httpsCallable("deletarProfessor");

    const result = await deletarProfessorFn({ professorId: profId });

    if (result.data.success) {
      showToast(
        `Professor "${nome}" excluído completamente. Email liberado para reutilização.`,
        "success",
      );
      carregarProfessores();
    } else {
      throw new Error(result.data.message || "Erro desconhecido");
    }
  } catch (err) {
    console.error("[Admin] Erro ao remover professor:", err);
    showToast(
      "Erro ao remover professor: " + (err.message || "Tente novamente"),
      "error",
    );
  } finally {
    hideLoading();
  }
}

/* ---- Helpers ---- */
function setLoading(on) {
  const btn = document.getElementById("btn-cadastrar-prof");
  const text = document.getElementById("btn-prof-text");
  const spin = document.getElementById("spinner-prof");
  btn.disabled = on;
  text.textContent = on ? "Cadastrando..." : "Cadastrar Professor";
  spin.classList.toggle("hidden", !on);
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function clearErrors() {
  document.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}

function handleProfError(err) {
  const codes = {
    "auth/email-already-in-use":
      "Este e-mail já está cadastrado no sistema. Se o professor não aparece na lista, delete a conta dele em Firebase Console → Authentication e tente novamente.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "Senha muito fraca. Use ao menos 6 caracteres.",
  };
  showToast(
    codes[err.code] || "Erro ao cadastrar professor: " + err.message,
    "error",
    6000,
  );
  console.error("[Admin]", err);
}

/* ---- Tab switching ---- */
function switchTab(tab) {
  document
    .getElementById("tab-professores")
    .classList.toggle("hidden", tab !== "professores");
  document
    .getElementById("tab-alunos")
    .classList.toggle("hidden", tab !== "alunos");
  document
    .getElementById("tab-btn-professores")
    .classList.toggle("active", tab === "professores");
  document
    .getElementById("tab-btn-alunos")
    .classList.toggle("active", tab === "alunos");
}

/* ---- Carregar lista de alunos ---- */
async function carregarAlunos() {
  const lista = document.getElementById("lista-alunos");
  const totalEl = document.getElementById("total-alunos");
  if (!lista) return;
  lista.innerHTML =
    '<div class="empty-state"><div class="spinner"></div></div>';

  try {
    const [alunosSnap, profsSnap] = await Promise.all([
      db.ref("alunos").once("value"),
      db.ref("professores").once("value"),
    ]);

    const alunosData = alunosSnap.val();
    const profsData = profsSnap.val() || {};

    if (!alunosData) {
      lista.innerHTML =
        '<div class="empty-state"><p>Nenhum aluno cadastrado ainda.</p></div>';
      totalEl.textContent = "0";
      return;
    }

    const alunos = Object.entries(alunosData).map(([id, a]) => ({ id, ...a }));
    alunos.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    totalEl.textContent = alunos.length;

    // Agrupar por professor
    const grupos = {};
    alunos.forEach((a) => {
      const profId = a.professorId || "sem-professor";
      if (!grupos[profId]) grupos[profId] = [];
      grupos[profId].push(a);
    });

    let html = "";
    for (const [profId, grupo] of Object.entries(grupos)) {
      const profNome =
        profsData[profId]?.nome || grupo[0]?.professorNome || "Sem professor";
      html += `
        <div class="admin-group">
          <div class="admin-group-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            ${sanitize(profNome)}
            <span class="badge-count" style="margin-left:4px">${grupo.length}</span>
          </div>
          ${grupo
            .map((a) => {
              const imcVal = a.imc ? parseFloat(a.imc) : null;
              let imcBg = "rgba(255,255,255,0.1)",
                imcColor = "#fff";
              if (imcVal) {
                if (imcVal < 18.5) {
                  imcBg = "rgba(100,181,246,0.2)";
                  imcColor = "#64B5F6";
                } else if (imcVal < 25) {
                  imcBg = "rgba(129,199,132,0.2)";
                  imcColor = "#81C784";
                } else if (imcVal < 30) {
                  imcBg = "rgba(255,183,77,0.2)";
                  imcColor = "#FFB74D";
                } else {
                  imcBg = "rgba(255,82,82,0.2)";
                  imcColor = "#FF5252";
                }
              }
              return `
          <div class="admin-aluno-card">
            <div class="admin-prof-info">
              <div class="admin-prof-nome">${sanitize(a.nome || "—")}</div>
              <div class="admin-prof-email">${sanitize(a.email || "—")}</div>
              <div class="admin-prof-tel" style="display:flex;align-items:center;gap:4px;margin-top:3px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="opacity:.6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span><strong>Professor:</strong> ${sanitize(a.professorNome || profNome)}</span>
              </div>
              ${
                a.peso || a.imc
                  ? `
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">
                ${a.peso ? `<span class="admin-prof-tel">Peso: <strong>${a.peso}kg</strong></span>` : ""}
                ${a.altura ? `<span class="admin-prof-tel">Altura: <strong>${a.altura}m</strong></span>` : ""}
                ${imcVal ? `<span style="background:${imcBg};color:${imcColor};border:1px solid ${imcColor};border-radius:6px;padding:1px 7px;font-size:0.76rem;font-weight:700;">IMC ${imcVal.toFixed(1)}</span>` : ""}
              </div>`
                  : ""
              }
            </div>
            <div class="admin-prof-actions">
              <button class="btn-icon" title="Editar aluno"
                onclick='abrirEditarAluno(${JSON.stringify(a)})'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
              <button class="btn-icon btn-danger-icon" title="Remover aluno"
                onclick="confirmarRemocaoAluno('${a.id}', '${sanitize(a.nome || "")}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          `;
            })
            .join('<div class="list-divider"></div>')}
        </div>
      `;
    }

    lista.innerHTML = html;
  } catch (err) {
    lista.innerHTML =
      '<div class="empty-state"><p>Erro ao carregar alunos.</p></div>';
    console.error("[Admin]", err);
  }
}

/* ---- Remover aluno ---- */
function confirmarRemocaoAluno(alunoId, nome) {
  if (
    !confirm(`Remover o aluno "${nome}"?\n\nTodos seus dados serão apagados.`)
  )
    return;
  removerAluno(alunoId, nome);
}

async function removerAluno(alunoId, nome) {
  showLoading("Removendo aluno e limpando dados...");
  try {
    // Chama Cloud Function para exclusão completa (dados + treinos + dietas + mensagens + conta)
    const functions = firebase.functions();
    const deletarAlunoFn = functions.httpsCallable("deletarAluno");

    const result = await deletarAlunoFn({ alunoId: alunoId });

    if (result.data.success) {
      showToast(
        `Aluno "${nome}" excluído completamente. Todos os dados (treinos, dietas, mensagens) foram removidos. Email liberado para reutilização.`,
        "success",
        4000,
      );
      carregarAlunos();
    } else {
      throw new Error(result.data.message || "Erro desconhecido");
    }
  } catch (err) {
    console.error("[Admin] Erro ao remover aluno:", err);
    showToast(
      "Erro ao remover aluno: " + (err.message || "Tente novamente"),
      "error",
    );
  } finally {
    hideLoading();
  }
}

/* ---- Editar Professor ---- */
function abrirEditarProf(id, nome, telefone) {
  document.getElementById("edit-prof-id").value = id;
  document.getElementById("edit-prof-nome").value = nome;
  document.getElementById("edit-prof-telefone").value = telefone;
  document.getElementById("edit-prof-nome-error").classList.add("hidden");
  document.getElementById("modal-editar-prof").classList.add("open");
}

function fecharEditarProf() {
  document.getElementById("modal-editar-prof").classList.remove("open");
}

async function salvarEditarProf() {
  const id = document.getElementById("edit-prof-id").value;
  const nome = sanitize(document.getElementById("edit-prof-nome").value.trim());
  const telefone = document.getElementById("edit-prof-telefone").value.trim();

  const errEl = document.getElementById("edit-prof-nome-error");
  if (!nome || nome.length < 2) {
    errEl.textContent = "Informe o nome do professor";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");

  showLoading("Salvando...");
  try {
    const updates = {};
    updates[`professores/${id}/nome`] = nome;
    updates[`professores/${id}/telefone`] = telefone;
    updates[`users/${id}/nome`] = nome;
    updates[`users/${id}/telefone`] = telefone;
    await db.ref().update(updates);
    showToast("Professor atualizado com sucesso.", "success");
    fecharEditarProf();
    carregarProfessores();
    carregarAlunos();
  } catch (err) {
    showToast("Erro ao salvar professor.", "error");
    console.error("[Admin]", err);
  } finally {
    hideLoading();
  }
}

/* ---- Editar Aluno ---- */
async function abrirEditarAluno(aluno) {
  document.getElementById("edit-aluno-id").value = aluno.id;
  document.getElementById("edit-aluno-nome").value = aluno.nome || "";
  document.getElementById("edit-aluno-peso").value = aluno.peso || "";
  document.getElementById("edit-aluno-altura").value = aluno.altura || "";

  // Carregar professores no select
  const sel = document.getElementById("edit-aluno-prof");
  sel.innerHTML = '<option value="">Carregando...</option>';
  try {
    const snap = await db.ref("professores").once("value");
    const data = snap.val() || {};
    const profs = Object.entries(data).map(([id, p]) => ({
      id,
      nome: p.nome || "Professor",
    }));
    profs.sort((a, b) => a.nome.localeCompare(b.nome));
    sel.innerHTML = profs
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === aluno.professorId ? "selected" : ""}>${sanitize(p.nome)}</option>`,
      )
      .join("");
  } catch (_) {
    sel.innerHTML = '<option value="">Erro ao carregar professores</option>';
  }

  document.getElementById("modal-editar-aluno").classList.add("open");
}

function fecharEditarAluno() {
  document.getElementById("modal-editar-aluno").classList.remove("open");
}

async function salvarEditarAluno() {
  const id = document.getElementById("edit-aluno-id").value;
  const nome = sanitize(
    document.getElementById("edit-aluno-nome").value.trim(),
  );
  const profId = document.getElementById("edit-aluno-prof").value;
  const pesoVal = document.getElementById("edit-aluno-peso").value;
  const alturaVal = document.getElementById("edit-aluno-altura").value;

  if (!nome) {
    showToast("Informe o nome do aluno.", "error");
    return;
  }
  if (!profId) {
    showToast("Selecione um professor.", "error");
    return;
  }

  const peso = pesoVal ? parseFloat(pesoVal) : null;
  const altura = alturaVal ? parseFloat(alturaVal) : null;
  let imc = null;
  if (peso && altura && altura > 0)
    imc = parseFloat((peso / (altura * altura)).toFixed(1));

  // Pegar nome do professor
  let profNome = "";
  try {
    const snap = await db.ref(`professores/${profId}`).once("value");
    profNome = snap.val()?.nome || "";
  } catch (_) {}

  showLoading("Salvando...");
  try {
    const updates = {
      [`alunos/${id}/nome`]: nome,
      [`alunos/${id}/professorId`]: profId,
      [`alunos/${id}/professorNome`]: profNome,
      [`alunos/${id}/peso`]: peso,
      [`alunos/${id}/altura`]: altura,
      [`alunos/${id}/imc`]: imc,
      [`users/${id}/nome`]: nome,
      [`users/${id}/professorId`]: profId,
      [`users/${id}/professorNome`]: profNome,
      [`users/${id}/peso`]: peso,
      [`users/${id}/altura`]: altura,
      [`users/${id}/imc`]: imc,
    };
    await db.ref().update(updates);
    showToast("Aluno atualizado com sucesso.", "success");
    fecharEditarAluno();
    carregarAlunos();
  } catch (err) {
    showToast("Erro ao salvar aluno.", "error");
    console.error("[Admin]", err);
  } finally {
    hideLoading();
  }
}
