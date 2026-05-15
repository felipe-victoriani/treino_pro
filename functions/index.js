const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

// ── Função: Notificar nova mensagem via FCM ──────────────
exports.notificarNovaMensagem = onValueCreated(
  "mensagens/{alunoId}/{msgId}",
  async (event) => {
    const msg = event.data.val();
    if (!msg || !msg.paraUid) return null;

    const { paraUid, deNome, texto } = msg;
    const tokenSnap = await db.ref(`users/${paraUid}/fcmToken`).once("value");
    const token = tokenSnap.val();

    if (!token) {
      console.log(`[FCM] Sem token para o destinatário: ${paraUid}`);
      return null;
    }

    const bodyText =
      texto && texto.length > 100
        ? texto.substring(0, 97) + "..."
        : texto || "";

    const payload = {
      notification: {
        title: `Mensagem de ${deNome || "usuário"}`,
        body: bodyText,
      },
      data: {
        alunoId: event.params.alunoId,
        tipo: msg.de || "",
      },
    };

    try {
      await admin.messaging().sendToDevice(token, payload);
      console.log(`[FCM] Notificação enviada para ${paraUid}`);
    } catch (err) {
      console.error("[FCM] Erro ao enviar notificação:", err.code, err.message);
      if (err.code === "messaging/registration-token-not-registered") {
        await db.ref(`users/${paraUid}/fcmToken`).remove();
        console.log(`[FCM] Token inválido removido para: ${paraUid}`);
      }
    }

    return null;
  },
);
