const { onRequest } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

const geminiKey = defineSecret("GEMINI_API_KEY");

// ── Função 1: Gerar treino com Gemini ─────────────────────
exports.gerarTreinoIA = onRequest(
  { secrets: [geminiKey] },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")
      return res.status(405).json({ error: "Método não permitido" });

    const { objetivo, nivel, restricoes } = req.body || {};
    if (!objetivo || !nivel) {
      return res
        .status(400)
        .json({ error: "Informe objetivo e nível do aluno." });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Você é um personal trainer especialista em treinos de academia.\nMonte um treino para o objetivo: ${objetivo}. Nível: ${nivel}. Restrições: ${restricoes || "nenhuma"}.\nResponda apenas com o treino, em formato de lista, com exercícios, séries e repetições.`;

      const result = await model.generateContent(prompt);
      const treino = result.response.text();
      res.json({ treino });
    } catch (err) {
      console.error("[Gemini] Erro ao gerar treino:", err.message);
      res.status(500).json({ error: "Erro ao gerar treino com IA." });
    }
  },
);

// ── Função 2: Notificar nova mensagem via FCM ──────────────
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
