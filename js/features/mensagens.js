/* ============================================================
   TREINO PRO - Mensagens
   Sistema de troca de mensagens professor <-> aluno
   ============================================================ */

/* Listener ativo de mensagens */
let msgListener = null;
let msgListenerPath = null;

/* Listener ativo do keydown no form de mensagem */
let msgFormInputEl = null;
let msgFormKeydownFn = null;

/**
 * Carrega e exibe mensagens em tempo real
 * @param {string} alunoId     - UID do aluno
 * @param {string} containerId - ID do container HTML
 * @param {string} currentUid  - UID do usuário logado (para definir sent/received)
 */
function loadMensagens(alunoId, containerId, currentUid) {
  if (!alunoId) return;

  // Remove listener anterior usando o caminho correto
  if (msgListener && msgListenerPath) {
    db.ref(msgListenerPath).off("value", msgListener);
    msgListener = null;
    msgListenerPath = null;
  }

  const container = document.getElementById(containerId);
  if (!container) return;

  const path = `mensagens/${alunoId}`;
  const ref = db.ref(path).orderByChild("timestamp");

  msgListenerPath = path;
  msgListener = ref.on(
    "value",
    (snap) => {
      const data = snap.val();
      renderMensagens(container, data, currentUid, alunoId);
    },
    (error) => {
      console.error("[Mensagens] Erro ao carregar:", error);
    },
  );
}

/**
 * Renderiza a lista de mensagens no container
 * @param {HTMLElement} container
 * @param {Object|null} data
 * @param {string} currentUid
 * @param {string} alunoId
 */
function renderMensagens(container, data, currentUid, alunoId) {
  if (!data) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <h3>Nenhuma mensagem</h3>
        <p>Inicie a conversa!</p>
      </div>`;
    return;
  }

  const msgs = Object.entries(data)
    .map(([id, msg]) => ({ id, ...msg }))
    .sort((a, b) => a.timestamp - b.timestamp);

  container.innerHTML = msgs
    .map((msg) => {
      const isSent = msg.de === currentUid || msg.deUid === currentUid;
      const timeStr = formatDateTime(msg.timestamp);

      return `
      <div class="message-bubble ${isSent ? "sent" : "received"}">
        ${!isSent ? `<div class="message-from">${sanitize(msg.deNome || "Professor")}</div>` : ""}
        <div>${sanitize(msg.texto)}</div>
        <div class="message-meta">${timeStr}</div>
      </div>`;
    })
    .join("");

  // Marcar mensagens do outro como lidas e rolar para o fim
  marcarComoLidas(alunoId, currentUid, data);
  setTimeout(() => (container.scrollTop = container.scrollHeight), 50);
}

/**
 * Envia uma mensagem
 * @param {string} alunoId  - UID do aluno na conversa
 * @param {string} texto    - Conteúdo da mensagem
 * @param {string} deUid    - UID do remetente
 * @param {string} deNome   - Nome do remetente
 * @param {string} deTipo   - 'professor' | 'aluno'
 * @param {string} [paraUid] - UID do destinatário (usado pela Cloud Function para enviar push)
 */
async function enviarMensagem(alunoId, texto, deUid, deNome, deTipo, paraUid) {
  if (!texto?.trim()) {
    showToast("Digite uma mensagem antes de enviar", "warning");
    return false;
  }
  if (texto.length > 1000) {
    showToast("Mensagem muito longa (máx. 1000 caracteres)", "warning");
    return false;
  }

  try {
    const msgData = {
      texto: texto.trim(),
      de: deTipo,
      deUid: deUid,
      deNome: deNome,
      timestamp: Date.now(),
      lida: false,
    };
    // paraUid é lido pela Cloud Function para saber quem notificar
    if (paraUid) msgData.paraUid = paraUid;

    const msgRef = db.ref(`mensagens/${alunoId}`).push();
    await msgRef.set(msgData);
    return true;
  } catch (error) {
    showToast("Erro ao enviar mensagem. Tente novamente.", "error");
    console.error("[Mensagens] Erro ao enviar:", error);
    return false;
  }
}

/**
 * Marca mensagens recebidas como lidas
 * @param {string} alunoId
 * @param {string} currentUid
 * @param {Object} mensagens
 */
async function marcarComoLidas(alunoId, currentUid, mensagens) {
  if (!mensagens) return;
  const updates = {};
  Object.entries(mensagens).forEach(([id, msg]) => {
    if (!msg.lida && msg.deUid !== currentUid) {
      updates[`mensagens/${alunoId}/${id}/lida`] = true;
    }
  });
  if (Object.keys(updates).length > 0) {
    try {
      await db.ref().update(updates);
    } catch (_) {}
  }
}

/**
 * Conta mensagens não lidas de um aluno (para o professor)
 * @param {string} alunoId
 * @param {string} professorUid
 * @returns {Promise<number>}
 */
async function contarNaoLidas(alunoId, professorUid) {
  try {
    const snap = await db
      .ref(`mensagens/${alunoId}`)
      .orderByChild("lida")
      .equalTo(false)
      .once("value");
    const data = snap.val();
    if (!data) return 0;
    return Object.values(data).filter((m) => m.deUid !== professorUid).length;
  } catch (_) {
    return 0;
  }
}

/**
 * Configura o formulário de envio de mensagem
 * @param {string} alunoId    - UID do aluno na conversa
 * @param {string} inputId    - ID do textarea
 * @param {string} btnId      - ID do botão de envio
 * @param {string} [paraUid] - UID do destinatário (para notificação push)
 */
function setupMensagemForm(alunoId, inputId, btnId, paraUid) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;

  // Remove listeners anteriores clonando o botão
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  // Remove listener keydown anterior do input
  if (msgFormInputEl && msgFormKeydownFn) {
    msgFormInputEl.removeEventListener("keydown", msgFormKeydownFn);
  }

  newBtn.addEventListener("click", async () => {
    const texto = input.value.trim();
    if (!texto) return;

    const user = window.currentUser;
    const data = window.currentUserData;
    if (!user || !data) return;

    newBtn.disabled = true;
    const ok = await enviarMensagem(
      alunoId,
      texto,
      user.uid,
      data.nome || "Professor",
      data.tipo,
      paraUid,
    );
    if (ok) input.value = "";
    newBtn.disabled = false;
  });

  // Enviar com Ctrl+Enter — registra apenas um listener por vez
  msgFormInputEl = input;
  msgFormKeydownFn = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      document.getElementById(btnId)?.click();
    }
  };
  input.addEventListener("keydown", msgFormKeydownFn);
}

/**
 * Para o listener de mensagens ativo
 */
function stopMensagensListener() {
  if (msgListener && msgListenerPath) {
    db.ref(msgListenerPath).off("value", msgListener);
    msgListener = null;
    msgListenerPath = null;
  }
}
