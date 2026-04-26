const { onRequest } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

const openaiKey = defineSecret("OPENAI_API_KEY");

// ── Função 1: Gerar treino com IA ──────────────────────────
exports.gerarTreinoIA = onRequest(
  { secrets: [openaiKey] },
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
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Monte um treino de academia para o objetivo: ${objetivo}. Nível: ${nivel}. Restrições: ${restricoes || "nenhuma"}. Responda apenas com o treino, em formato de lista, com exercícios, séries e repetições.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Você é um personal trainer especialista em treinos de academia.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      });
      res.json({ treino: completion.choices[0]?.message?.content || "" });
    } catch (err) {
      console.error("[OpenAI] Erro ao gerar treino:", err.message);
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
