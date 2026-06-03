/* ============================================================
   TREINO PRO - Cadastro de Alunos
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
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

  /* --- Modo selector (independente / professor) --- */
  document.querySelectorAll("#modo-selector .sexo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#modo-selector .sexo-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const modo = btn.dataset.value;
      document.getElementById("modo-treino").value = modo;
      document
        .getElementById("professor-group")
        .classList.toggle("hidden", modo !== "professor");
    });
  });

  /* --- Nível cards --- */
  document.querySelectorAll("#nivel-cards .nivel-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll("#nivel-cards .nivel-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      document.getElementById("nivel").value = card.dataset.value;
    });
  });

  /* --- Sexo selector --- */
  await loadProfessores();

  /* --- Submit --- */
  // Guarda os dados validados para usar após confirmação do modal
  let dadosPendentes = null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const nome = sanitize(nomeInput.value.trim());
    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;
    const confirm = confirmInput.value;
    const modo =
      document.getElementById("modo-treino")?.value || "independente";
    const profId = modo === "professor" ? profSelect.value : "";
    const nivel = document.getElementById("nivel")?.value || "INICIANTE";
    const sexo = document.getElementById("sexo")?.value || "";
    const peso = pesoInput.value ? parseDecimal(pesoInput.value) : null;
    let altura = alturaInput.value ? parseDecimal(alturaInput.value) : null;
    // Aceita altura em centímetros (ex: 175) e converte para metros
    if (altura && altura >= 100 && altura <= 250) altura = altura / 100;
    if (peso !== null && (isNaN(peso) || peso < 20 || peso > 300)) {
      showFieldError(
        "peso-error",
        "Peso inválido. Use vírgula ou ponto (ex: 70,5).",
      );
      return;
    }
    if (altura !== null && (isNaN(altura) || altura < 1.0 || altura > 2.5)) {
      showFieldError(
        "altura-error",
        "Altura inválida. Ex: 1,75 (m) ou 175 (cm).",
      );
      return;
    }

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
    if (modo === "professor" && !profId) {
      showFieldError("professor-error", "Selecione um professor");
      hasError = true;
    }
    if (hasError) return;

    // Calcular IMC se peso e altura informados
    let imc = null;
    if (peso && altura && altura > 0) {
      imc = parseFloat((peso / (altura * altura)).toFixed(1));
    }

    // Modo independente → exibe aviso antes de criar conta
    if (modo === "independente") {
      dadosPendentes = {
        nome,
        email,
        senha,
        nivel,
        sexo,
        peso,
        altura,
        imc,
        modo,
        profId,
      };
      abrirAvisoProfessor();
      return;
    }

    await criarConta({
      nome,
      email,
      senha,
      nivel,
      sexo,
      peso,
      altura,
      imc,
      modo,
      profId,
    });
  });

  /* --- Modal aviso professor --- */
  function abrirAvisoProfessor() {
    const overlay = document.getElementById("aviso-prof-overlay");
    if (!overlay) {
      criarConta(dadosPendentes);
      return;
    }
    overlay.classList.add("open");

    const btnOk = document.getElementById("btn-aviso-ok");
    const btnFechar = document.getElementById("btn-aviso-fechar");

    const newOk = btnOk.cloneNode(true);
    const newFechar = btnFechar.cloneNode(true);
    btnOk.replaceWith(newOk);
    btnFechar.replaceWith(newFechar);

    newOk.addEventListener("click", () => {
      overlay.classList.remove("open");
      criarConta(dadosPendentes);
    });

    newFechar.addEventListener("click", () => {
      overlay.classList.remove("open");
    });

    // Delay antes de aceitar cliques fora da sheet para evitar
    // fechamento acidental por duplo toque no botão de submit
    setTimeout(() => {
      overlay.addEventListener(
        "click",
        (e) => {
          if (e.target === overlay) overlay.classList.remove("open");
        },
        { once: true },
      );
    }, 400);
  }

  /* --- Lógica de criação de conta --- */
  async function criarConta({
    nome,
    email,
    senha,
    nivel,
    sexo,
    peso,
    altura,
    imc,
    modo,
    profId,
  }) {
    setLoading(true);

    try {
      // 1. Criar conta no Firebase Auth
      const credential = await auth.createUserWithEmailAndPassword(
        email,
        senha,
      );
      const uid = credential.user.uid;
      const timestamp = Date.now();

      const alunoData = {
        nome,
        email,
        tipo: "aluno",
        nivel: nivel,
        treinoAtual: "A",
        sexo: sexo || null,
        peso: peso || null,
        altura: altura || null,
        imc: imc || null,
        ativo: true,
        createdAt: timestamp,
      };

      if (profId) {
        const profSnap = await db.ref(`professores/${profId}`).once("value");
        alunoData.professorId = profId;
        alunoData.professorNome = profSnap.val()?.nome || "Professor";
      }

      const updates = {};
      updates[`users/${uid}`] = alunoData;
      updates[`alunos/${uid}`] = alunoData;

      await db.ref().update(updates);

      if (modo === "independente") {
        // Já está logado — vai montar o treino com IA
        showToast("Conta criada! Vamos montar seu treino 🤖", "success", 2000);
        setTimeout(() => window.location.replace("montar-treino.html"), 1500);
      } else {
        // Com professor — faz login normalmente
        showToast("Conta criada com sucesso! Faça o login.", "success", 3000);
        await auth.signOut();
        setTimeout(() => window.location.replace("login.html"), 2000);
      }
    } catch (error) {
      setLoading(false);
      handleRegisterError(error);
    }
  }

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
