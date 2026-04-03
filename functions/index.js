/* ============================================================
   TREINO PRO - Cloud Functions
   Dispara notificação FCM quando uma nova mensagem é criada.
   ============================================================ */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.database();

/**
 * Trigger: onCreate em mensagens/{alunoId}/{msgId}
 *
 * Lógica:
 *  - A mensagem contém `paraUid` (UID do destinatário)
 *  - Busca o token FCM do destinatário em users/{paraUid}/fcmToken
 *  - Envia a notificação via FCM
 */
exports.notificarNovaMensagem = functions.database
  .ref("mensagens/{alunoId}/{msgId}")
  .onCreate(async (snap, context) => {
    const msg = snap.val();

    // Sem destinatário definido, nada a fazer
    if (!msg || !msg.paraUid) return null;

    const { paraUid, deNome, texto } = msg;

    // Busca token FCM do destinatário
    const tokenSnap = await db.ref(`users/${paraUid}/fcmToken`).once("value");
    const token = tokenSnap.val();

    if (!token) {
      console.log(`[FCM] Sem token para o destinatário: ${paraUid}`);
      return null;
    }

    // Trunca texto longo para o preview
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
        alunoId: context.params.alunoId,
        tipo: msg.de || "",
      },
    };

    try {
      await admin.messaging().sendToDevice(token, payload);
      console.log(`[FCM] Notificação enviada para ${paraUid}`);
    } catch (err) {
      console.error("[FCM] Erro ao enviar notificação:", err.code, err.message);

      // Token inválido ou expirado: remove do banco para não desperdiçar chamadas futuras
      if (err.code === "messaging/registration-token-not-registered") {
        await db.ref(`users/${paraUid}/fcmToken`).remove();
        console.log(`[FCM] Token inválido removido para: ${paraUid}`);
      }
    }

    return null;
  });
