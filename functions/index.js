// === IA: Gerar treino personalizado com OpenAI GPT-4 ===
const { OpenAI } = require("openai");

// Defina sua chave de API OpenAI no ambiente do Firebase (NUNCA commite a chave)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Função HTTP: /gerarTreinoIA
 * Body esperado: { objetivo: string, nivel: string, restricoes: string }
 * Retorna: { treino: string }
 */
exports.gerarTreinoIA = functions.https.onRequest(async (req, res) => {
  // Permitir CORS simples
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { objetivo, nivel, restricoes } = req.body || {};
  if (!objetivo || !nivel) {
    return res
      .status(400)
      .json({ error: "Informe objetivo e nível do aluno." });
  }

  try {
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
    const treino = completion.choices[0]?.message?.content || "";
    res.json({ treino });
  } catch (err) {
    console.error("[OpenAI] Erro ao gerar treino:", err.message);
    res.status(500).json({ error: "Erro ao gerar treino com IA." });
  }
});
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
