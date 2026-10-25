/* ============================================================
   TREINO PRO - Excluir minha conta
   Página pública (também linkada do perfil no app e usada como URL
   de exclusão na Play Store). Fluxo:
     1. usuário informa e-mail + senha e confirma o checkbox
     2. login com essas credenciais (renova o auth_time do token)
     3. Cloud Function excluirMinhaConta apaga dados e a conta
   A Function recusa tokens com login antigo, então o passo 2 é
   obrigatório e prova que é o dono da conta.
   ============================================================ */

(function () {
  const form = document.getElementById("form-excluir");
  const emailEl = document.getElementById("excluir-email");
  const senhaEl = document.getElementById("excluir-senha");
  const confirmaEl = document.getElementById("excluir-confirma");
  const botao = document.getElementById("excluir-btn");
  const statusEl = document.getElementById("excluir-status");
  const sucessoEl = document.getElementById("excluir-sucesso");

  const TEXTO_BOTAO = botao.textContent.trim();

  /* Mensagens amigáveis por código de erro (nada de detalhe interno na UI) */
  const MENSAGENS_ERRO = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
    "functions/permission-denied":
      "Esta conta não pode ser excluída por aqui. Fale com o suporte.",
    "functions/failed-precondition":
      "Confirme sua senha novamente e tente de novo.",
  };

  /** Mostra uma mensagem no status (anunciada por leitor de tela). */
  function mostrarStatus(texto, tipo) {
    statusEl.textContent = texto;
    statusEl.classList.remove("erro", "ok");
    if (tipo) statusEl.classList.add(tipo);
  }

  /** Liga/desliga o estado de carregamento do botão. */
  function setCarregando(ativo) {
    botao.disabled = ativo;
    botao.textContent = ativo ? "Excluindo..." : TEXTO_BOTAO;
  }

  /* Se já houver sessão (veio do perfil no app), pré-preenche o e-mail */
  auth.onAuthStateChanged((user) => {
    if (user && user.email && !emailEl.value) {
      emailEl.value = user.email;
      senhaEl.focus();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailEl.value.trim().toLowerCase();
    const senha = senhaEl.value;

    // Validação de UX (a segurança real está na Function)
    if (!email || !senha) {
      mostrarStatus("Informe o e-mail e a senha da conta.", "erro");
      return;
    }
    if (!confirmaEl.checked) {
      mostrarStatus("Marque a confirmação para continuar.", "erro");
      confirmaEl.focus();
      return;
    }
    if (!functions) {
      mostrarStatus("Serviço indisponível. Tente novamente mais tarde.", "erro");
      return;
    }

    setCarregando(true);
    mostrarStatus("");

    try {
      // Login novo = prova de identidade e auth_time recente para a Function
      await auth.signInWithEmailAndPassword(email, senha);
      await functions.httpsCallable("excluirMinhaConta")();

      // Conta já não existe no servidor; limpa a sessão local
      await auth.signOut().catch(() => {});

      form.classList.add("hidden");
      sucessoEl.classList.remove("hidden");
      sucessoEl.focus();
    } catch (err) {
      console.error("[ExcluirConta] Falha:", err.code || err.message);
      mostrarStatus(
        MENSAGENS_ERRO[err.code] ||
          "Não foi possível excluir a conta agora. Tente novamente.",
        "erro",
      );
      setCarregando(false);
    }
  });
})();
