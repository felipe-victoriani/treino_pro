/* ============================================================
   TREINO PRO - Login
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* --- Redirecionar se já logado --- */
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const snap = await db.ref(`users/${user.uid}`).once("value");
        const data = snap.val();
        if (data?.tipo === "professor")
          window.location.replace("professor.html");
        else if (data?.tipo === "aluno") window.location.replace("aluno.html");
      } catch (_) {}
    }
  });

  /* --- Elementos --- */
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const loginBtnText = document.getElementById("login-btn-text");
  const loginSpinner = document.getElementById("login-spinner");
  const togglePw = document.getElementById("toggle-pw");

  /* --- Toggle senha --- */
  togglePw?.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
  });

  /* --- Submit do formulário --- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validação básica
    let hasError = false;
    if (!email || !isValidEmail(email)) {
      showFieldError("email-error", "Informe um e-mail válido");
      hasError = true;
    }
    if (!password || password.length < 6) {
      showFieldError(
        "password-error",
        "A senha deve ter ao menos 6 caracteres",
      );
      hasError = true;
    }
    if (hasError) return;

    // Loading
    setLoading(true);

    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      // Busca tipo do usuário
      const snap = await db.ref(`users/${credential.user.uid}`).once("value");
      const userData = snap.val();

      if (!userData) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      showToast("Login realizado com sucesso!", "success", 1500);

      setTimeout(() => {
        if (userData.tipo === "professor")
          window.location.replace("professor.html");
        else window.location.replace("aluno.html");
      }, 800);
    } catch (error) {
      setLoading(false);
      handleLoginError(error);
    }
  });

  /* --- Recuperação de senha --- */
  const forgotBtn = document.getElementById("forgot-password-btn");
  const modalForgot = document.getElementById("modal-forgot");
  const closeForgot = document.getElementById("close-forgot");
  const cancelForgot = document.getElementById("cancel-forgot");
  const sendResetBtn = document.getElementById("send-reset-btn");
  const forgotEmail = document.getElementById("forgot-email");

  forgotBtn?.addEventListener("click", () => modalForgot.classList.add("open"));
  closeForgot?.addEventListener("click", () => closeForgotModal());
  cancelForgot?.addEventListener("click", () => closeForgotModal());

  // Fechar modal ao clicar fora
  modalForgot?.addEventListener("click", (e) => {
    if (e.target === modalForgot) closeForgotModal();
  });

  sendResetBtn?.addEventListener("click", async () => {
    const email = forgotEmail.value.trim();
    if (!email || !isValidEmail(email)) {
      showToast("Informe um e-mail válido", "error");
      return;
    }
    sendResetBtn.disabled = true;
    sendResetBtn.textContent = "Enviando...";
    try {
      await auth.sendPasswordResetEmail(email);
      showToast(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
        "success",
        5000,
      );
      closeForgotModal();
    } catch (error) {
      showToast("E-mail não encontrado no sistema", "error");
    } finally {
      sendResetBtn.disabled = false;
      sendResetBtn.textContent = "Enviar link";
    }
  });

  /* --- Helpers --- */
  function setLoading(loading) {
    loginBtn.disabled = loading;
    loginBtnText.textContent = loading ? "Entrando..." : "Entrar";
    loginSpinner.classList.toggle("hidden", !loading);
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

  function closeForgotModal() {
    modalForgot.classList.remove("open");
    forgotEmail.value = "";
  }

  function handleLoginError(error) {
    const codes = {
      "auth/user-not-found": "E-mail não cadastrado no sistema",
      "auth/wrong-password": "Senha incorreta. Tente novamente",
      "auth/invalid-email": "E-mail inválido",
      "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos",
      "auth/user-disabled": "Conta desativada. Contate o administrador",
      "auth/invalid-credential": "E-mail ou senha incorretos",
      ACCOUNT_NOT_FOUND: "Conta não encontrada. Contate o administrador",
    };
    const msg =
      codes[error.code] ||
      codes[error.message] ||
      "Erro ao fazer login. Tente novamente.";
    showToast(msg, "error");
    console.error("[Login] Erro:", error.code, error.message);
  }
});
