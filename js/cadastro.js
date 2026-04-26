/* ============================================================
   TREINO PRO - Cadastro de Alunos
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // Integração IA: Gerar treino automático
  const btnGerarTreino = document.getElementById("btn-gerar-treino-ia");
  btnGerarTreino?.addEventListener("click", async () => {
    const objetivo = document.getElementById("objetivo")?.value || "";
    const nivel = document.getElementById("nivel")?.value || "Iniciante";
    const restricoes = document.getElementById("restricoes")?.value || "";
    if (!objetivo) {
      showToast("Informe seu objetivo para gerar o treino.", "error");
      return;
    }
    btnGerarTreino.disabled = true;
    showToast("Gerando treino personalizado... Aguarde...", "info");
    try {
      // Usa o projectId do firebase-config.js para montar a URL da função
      const projectId =
        window._firebaseConfig?.projectId || "app-treino-academia";
      const url =
        "https://us-central1-app-treino-academia.cloudfunctions.net/gerarTreinoIA";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objetivo, nivel, restricoes }),
      });
      if (!res.ok) {
        showToast("Erro ao gerar treino.", "error");
        btnGerarTreino.disabled = false;
        return;
      }
      showToast("Treino gerado com sucesso! Confira em seu perfil.", "success");
      setTimeout(() => window.location.replace("aluno.html"), 1200);
    } catch (e) {
      showToast("Erro ao conectar com a IA.", "error");
    }
    btnGerarTreino.disabled = false;
  });
  /* --- Elementos --- */
  const form = document.getElementById("cadastro-form");
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const confirmInput = document.getElementById("confirmar-senha");
  const profSelect = document.getElementById("professor");
  const pesoInput = document.getElementById("peso");
  const alturaInput = document.getElementById("altura");
  const cadastroBtn = document.getElementById("cadastro-btn");
  const btnText = document.getElementById("cadastro-btn-text");
  const spinner = document.getElementById("cadastro-spinner");
  const togglePw = document.getElementById("toggle-pw");

  /* --- Toggle senha --- */
  togglePw?.addEventListener("click", () => {
    senhaInput.type = senhaInput.type === "password" ? "text" : "password";
  });

  /* --- Sexo selector --- */
  document.querySelectorAll(".sexo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".sexo-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("sexo").value = btn.dataset.value;
    });
  });

  /* --- Objetivo chips --- */
  document.querySelectorAll(".objetivo-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const jaAtivo = chip.classList.contains("active");
      document
        .querySelectorAll(".objetivo-chip")
        .forEach((c) => c.classList.remove("active"));
      if (!jaAtivo) {
        chip.classList.add("active");
        document.getElementById("objetivo").value = chip.dataset.value;
      } else {
        document.getElementById("objetivo").value = "";
      }
    });
  });

  /* --- Carregar lista de professores --- */
  await loadProfessores();

  /* --- Submit --- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const nome = sanitize(nomeInput.value.trim());
    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;
    const confirm = confirmInput.value;
    const profId = profSelect.value;
    const sexo = document.getElementById("sexo")?.value || "";
    const objetivo = document.getElementById("objetivo")?.value || "";
    const peso = pesoInput.value ? parseFloat(pesoInput.value) : null;
    const altura = alturaInput.value ? parseFloat(alturaInput.value) : null;

    // Validações
    let hasError = false;

    if (!nome || nome.length < 2) {
      showFieldError("nome-error", "Informe seu nome completo");
      hasError = true;
    }
    if (!email || !isValidEmail(email)) {
      showFieldError("email-error", "Informe um e-mail válido");
      hasError = true;
    }
    if (!senha || senha.length < 6) {
      showFieldError("senha-error", "A senha deve ter ao menos 6 caracteres");
      hasError = true;
    }
    if (senha !== confirm) {
      showFieldError("confirm-error", "As senhas não coincidem");
      hasError = true;
    }
    if (!profId) {
      showFieldError("professor-error", "Selecione um professor");
      hasError = true;
    }
    if (hasError) return;

    // Calcular IMC se peso e altura informados
    let imc = null;
    if (peso && altura && altura > 0) {
      imc = parseFloat((peso / (altura * altura)).toFixed(1));
    }

    setLoading(true);

    try {
      // 1. Criar conta no Firebase Auth
      const credential = await auth.createUserWithEmailAndPassword(
        email,
        senha,
      );
      const uid = credential.user.uid;
      const timestamp = Date.now();

      let profNome = "Professor";
      let treinosIA = {};
      if (profId === "IA") {
        profNome = "Treino gerado por IA";
        // Gerar 5 treinos distintos para A-E
        const projectId =
          window._firebaseConfig?.projectId || "app-treino-academia";
        const url = "https://gerartreinoia-nsk2pknymq-uc.a.run.app";
        const treinos = {};
        for (const letra of ["A", "B", "C", "D", "E"]) {
          const promptExtra = `Monte um treino de academia para o objetivo: ${objetivo}. Nível: ${nivel}. Restrições: ${restricoes || "nenhuma"}. Este é o treino ${letra} da semana, diferente dos outros, como um personal trainer faria.`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ objetivo, nivel, restricoes, promptExtra }),
          });
          const data = await res.json();
          treinos[`treino${letra}`] = data.treino || "";
        }
        treinosIA = treinos;
      } else {
        // Buscar nome do professor no node professores/ (leitura pública)
        const profSnap = await db.ref(`professores/${profId}`).once("value");
        profNome = profSnap.val()?.nome || "Professor";
      }

      const alunoData = {
        nome,
        email,
        tipo: "aluno",
        professorId: profId,
        professorNome: profNome,
        treinoAtual: "A",
        sexo: sexo || null,
        objetivo: objetivo || null,
        peso: peso || null,
        altura: altura || null,
        imc: imc || null,
        ativo: true,
        createdAt: timestamp,
        ...treinosIA,
      };

      const updates = {};
      updates[`users/${uid}`] = alunoData;
      updates[`alunos/${uid}`] = alunoData;

      await db.ref().update(updates);
      showToast("Conta criada com sucesso! Faça o login.", "success", 3000);

      await auth.signOut();
      setTimeout(() => window.location.replace("login.html"), 2000);
    } catch (error) {
      setLoading(false);
      handleRegisterError(error);
    }
  });

  /* ---- Funções auxiliares ---- */

  async function loadProfessores() {
    try {
      const snap = await db.ref("professores").once("value");
      const data = snap.val();

      profSelect.innerHTML =
        '<option value="">Selecione seu professor</option>';

      if (!data) {
        profSelect.innerHTML =
          '<option value="">Nenhum professor disponível</option>';
        showToast(
          "Nenhum professor cadastrado ainda. Contate o administrador.",
          "warning",
        );
        return;
      }

      const professores = Object.keys(data).map((profId) => ({
        id: profId,
        nome: data[profId]?.nome || "Professor",
      }));
      professores.sort((a, b) => a.nome.localeCompare(b.nome));

      professores.forEach(({ id, nome }) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = nome;
        profSelect.appendChild(option);
      });
    } catch (error) {
      console.error("[Cadastro] Erro ao carregar professores:", error);
      profSelect.innerHTML =
        '<option value="">Erro ao carregar professores</option>';
    }
  }

  function setLoading(loading) {
    cadastroBtn.disabled = loading;
    btnText.textContent = loading ? "Criando conta..." : "Criar conta";
    spinner.classList.toggle("hidden", !loading);
  }

  function showFieldError(id, message) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = message;
      el.classList.remove("hidden");
    }
  }

  function clearErrors() {
    document.querySelectorAll(".form-error").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
  }

  function handleRegisterError(error) {
    const codes = {
      "auth/email-already-in-use":
        "Este e-mail já está cadastrado. Tente fazer login.",
      "auth/invalid-email": "E-mail inválido",
      "auth/weak-password": "Senha muito fraca. Use ao menos 6 caracteres",
      "auth/network-request-failed": "Sem conexão. Verifique sua internet",
    };
    const msg = codes[error.code] || "Erro ao criar conta. Tente novamente.";
    showToast(msg, "error");
    console.error("[Cadastro] Erro:", error.code, error.message);
  }
});
