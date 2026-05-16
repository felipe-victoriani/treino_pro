const { onValueCreated } = require("firebase-functions/v2/database");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
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

// ── Função: Deletar Professor (limpeza completa) ──────────────
exports.deletarProfessor = onCall(async (request) => {
  // Verifica autenticação
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const { professorId } = request.data;
  if (!professorId) {
    throw new HttpsError("invalid-argument", "professorId é obrigatório");
  }

  try {
    console.log(`[Delete] Iniciando exclusão do professor: ${professorId}`);

    // 1. Remove dados do professor no Realtime Database
    const updates = {};
    updates[`users/${professorId}`] = null;
    updates[`professores/${professorId}`] = null;

    await db.ref().update(updates);
    console.log(`[Delete] Dados do database removidos para: ${professorId}`);

    // 2. Deleta a conta do Firebase Authentication
    try {
      await admin.auth().deleteUser(professorId);
      console.log(`[Delete] Conta de autenticação deletada: ${professorId}`);
    } catch (authErr) {
      // Se o usuário não existir no Auth, continua (pode ter sido deletado manualmente)
      if (authErr.code !== "auth/user-not-found") {
        console.warn(`[Delete] Aviso ao deletar auth: ${authErr.message}`);
      }
    }

    console.log(`[Delete] Professor ${professorId} excluído com sucesso`);
    return { success: true, message: "Professor excluído com sucesso" };
  } catch (error) {
    console.error(`[Delete] Erro ao excluir professor ${professorId}:`, error);
    throw new HttpsError(
      "internal",
      "Erro ao excluir professor: " + error.message,
    );
  }
});

// ── Função: Deletar Aluno (limpeza completa) ──────────────
exports.deletarAluno = onCall(async (request) => {
  // Verifica autenticação
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const { alunoId } = request.data;
  if (!alunoId) {
    throw new HttpsError("invalid-argument", "alunoId é obrigatório");
  }

  try {
    console.log(`[Delete] Iniciando exclusão do aluno: ${alunoId}`);

    // 1. Remove TODOS os dados relacionados ao aluno
    const updates = {};
    updates[`users/${alunoId}`] = null;
    updates[`alunos/${alunoId}`] = null;
    updates[`treinos/${alunoId}`] = null;
    updates[`dietas/${alunoId}`] = null;
    updates[`mensagens/${alunoId}`] = null;
    updates[`historicoTreinos/${alunoId}`] = null;
    updates[`historicoIMC/${alunoId}`] = null;

    await db.ref().update(updates);
    console.log(`[Delete] Dados do database removidos para: ${alunoId}`);

    // 2. Deleta a conta do Firebase Authentication (libera o email)
    try {
      await admin.auth().deleteUser(alunoId);
      console.log(`[Delete] Conta de autenticação deletada: ${alunoId}`);
    } catch (authErr) {
      // Se o usuário não existir no Auth, continua (pode ter sido deletado manualmente)
      if (authErr.code !== "auth/user-not-found") {
        console.warn(`[Delete] Aviso ao deletar auth: ${authErr.message}`);
      }
    }

    console.log(`[Delete] Aluno ${alunoId} excluído com sucesso`);
    return { success: true, message: "Aluno excluído com sucesso" };
  } catch (error) {
    console.error(`[Delete] Erro ao excluir aluno ${alunoId}:`, error);
    throw new HttpsError("internal", "Erro ao excluir aluno: " + error.message);
  }
});
