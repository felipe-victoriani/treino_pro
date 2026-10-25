const { onValueCreated } = require("firebase-functions/v2/database");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

const claudeApiKey = defineSecret("CLAUDE_API_KEY");

admin.initializeApp();
const db = admin.database();

// ── Helper: garante que quem chama é admin ────────────────
// O papel vem do banco (users/{uid}/tipo), protegido pelas regras
// contra autoalteração. Lança HttpsError se não for admin.
async function exigirAdmin(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }
  const tipoSnap = await db
    .ref(`users/${request.auth.uid}/tipo`)
    .once("value");
  if (tipoSnap.val() !== "admin") {
    throw new HttpsError("permission-denied", "Apenas administradores");
  }
}

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
  // Verifica autenticação e papel de admin
  await exigirAdmin(request);

  const { professorId } = request.data;
  if (!professorId || typeof professorId !== "string") {
    throw new HttpsError("invalid-argument", "professorId é obrigatório");
  }

  try {
    console.log(`[Delete] Iniciando exclusão do professor: ${professorId}`);

    // 1. Remove dados do professor no Realtime Database
    const updates = {};
    updates[`users/${professorId}`] = null;
    updates[`professores/${professorId}`] = null;
    updates[`professoresPublico/${professorId}`] = null;

    await db.ref().update(updates);
    console.log(`[Delete] Dados do database removidos para: ${professorId}`);

    // 2. Deleta a conta do Firebase Authentication (libera o email)
    try {
      await admin.auth().deleteUser(professorId);
      console.log(`[Delete] Conta de autenticação deletada: ${professorId}`);
    } catch (authErr) {
      // Se o usuário já não existia no Auth, ignora (dados já removidos, email já livre)
      if (authErr.code !== "auth/user-not-found") {
        console.error(
          `[Delete] Falha ao deletar conta Auth do professor ${professorId}:`,
          authErr.message,
        );
        throw new HttpsError(
          "internal",
          "Dados removidos, mas falha ao liberar o email na autenticação: " +
            authErr.message,
        );
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
  // Verifica autenticação e papel de admin
  await exigirAdmin(request);

  const { alunoId } = request.data;
  if (!alunoId || typeof alunoId !== "string") {
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
    updates[`conquistas/${alunoId}`] = null;

    await db.ref().update(updates);
    console.log(`[Delete] Dados do database removidos para: ${alunoId}`);

    // 2. Deleta a conta do Firebase Authentication (libera o email)
    try {
      await admin.auth().deleteUser(alunoId);
      console.log(`[Delete] Conta de autenticação deletada: ${alunoId}`);
    } catch (authErr) {
      // Se o usuário já não existia no Auth, ignora (dados já removidos, email já livre)
      if (authErr.code !== "auth/user-not-found") {
        console.error(
          `[Delete] Falha ao deletar conta Auth do aluno ${alunoId}:`,
          authErr.message,
        );
        throw new HttpsError(
          "internal",
          "Dados removidos, mas falha ao liberar o email na autenticação: " +
            authErr.message,
        );
      }
    }

    console.log(`[Delete] Aluno ${alunoId} excluído com sucesso`);
    return { success: true, message: "Aluno excluído com sucesso" };
  } catch (error) {
    console.error(`[Delete] Erro ao excluir aluno ${alunoId}:`, error);
    throw new HttpsError("internal", "Erro ao excluir aluno: " + error.message);
  }
});

// ── Função: Excluir a própria conta (LGPD / Play Store / App Store) ──
// O próprio usuário (aluno ou professor) apaga a conta e todos os dados.
// Exige login recente (≤ 5 min): o cliente reautentica com a senha antes
// de chamar, então um token antigo/roubado não basta para excluir.
const JANELA_LOGIN_RECENTE_S = 5 * 60;

// Nós do Realtime Database que pertencem a cada tipo de conta
const NOS_ALUNO = [
  "users", "alunos", "treinos", "dietas", "mensagens",
  "historicoTreinos", "historicoIMC", "conquistas", "rateLimits",
];
const NOS_PROFESSOR = [
  "users", "professores", "professoresPublico", "favoritosProfessor",
  "recentesProfessor", "exerciciosCustom", "rateLimits",
];

/** Apaga arquivos do Storage por prefixo; falha aqui não bloqueia a exclusão. */
async function apagarStoragePorPrefixo(prefixo) {
  try {
    await admin.storage().bucket().deleteFiles({ prefix: prefixo });
  } catch (err) {
    console.error("[ExcluirConta] Falha ao limpar Storage:", prefixo, err.message);
  }
}

/** Monta o update multi-path que remove os dados de um professor. */
async function montarRemocaoProfessor(uid, updates) {
  NOS_PROFESSOR.forEach((no) => (updates[`${no}/${uid}`] = null));

  // Desvincula os alunos e remove as mensagens que o professor enviou
  const alunosSnap = await db
    .ref("alunos")
    .orderByChild("professorId")
    .equalTo(uid)
    .once("value");
  const alunoIds = [];
  alunosSnap.forEach((c) => {
    alunoIds.push(c.key);
  });
  for (const alunoId of alunoIds) {
    ["alunos", "users"].forEach((no) => {
      updates[`${no}/${alunoId}/professorId`] = null;
      updates[`${no}/${alunoId}/professorNome`] = null;
    });
    const msgsSnap = await db.ref(`mensagens/${alunoId}`).once("value");
    msgsSnap.forEach((m) => {
      if (m.val()?.deUid === uid) updates[`mensagens/${alunoId}/${m.key}`] = null;
    });
  }
}

exports.excluirMinhaConta = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado");
  }
  const uid = request.auth.uid;

  // Confirmação de identidade: login feito há poucos minutos
  const authTime = Number(request.auth.token?.auth_time || 0);
  if (Date.now() / 1000 - authTime > JANELA_LOGIN_RECENTE_S) {
    throw new HttpsError(
      "failed-precondition",
      "Confirme sua senha novamente para excluir a conta.",
    );
  }

  const tipo = (await db.ref(`users/${uid}/tipo`).once("value")).val();
  if (tipo === "admin") {
    // Excluir o único admin trancaria o sistema; feito só manualmente
    throw new HttpsError(
      "permission-denied",
      "Conta de administrador não pode ser excluída por aqui.",
    );
  }

  const updates = {};
  if (tipo === "professor") {
    await montarRemocaoProfessor(uid, updates);
  } else {
    NOS_ALUNO.forEach((no) => (updates[`${no}/${uid}`] = null));
  }

  // Vídeos de exercício: do professor (pasta dele) ou feitos para o aluno
  let prefixoStorage = null;
  if (tipo === "professor") {
    prefixoStorage = `exerciciosVideos/${uid}/`;
  } else {
    const profId = (
      await db.ref(`alunos/${uid}/professorId`).once("value")
    ).val();
    if (profId) prefixoStorage = `exerciciosVideos/${profId}/${uid}/`;
  }

  try {
    // 1. Dados primeiro: se a conta Auth falhar depois, não sobra dado órfão
    await db.ref().update(updates);
    if (prefixoStorage) await apagarStoragePorPrefixo(prefixoStorage);

    // 2. Conta de autenticação (libera o e-mail)
    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr) {
      if (authErr.code !== "auth/user-not-found") throw authErr;
    }

    // Log sem dado pessoal: só uid e tipo
    console.log("[ExcluirConta] Conta excluída", { uid, tipo: tipo || "aluno" });
    return { success: true };
  } catch (error) {
    console.error("[ExcluirConta] Erro", { uid, msg: error.message });
    throw new HttpsError(
      "internal",
      "Não foi possível excluir a conta. Tente novamente.",
    );
  }
});

// ── Função: Gerar Treino com IA (Claude Haiku) ───────────
// CORS: onCall só aceita chamadas via Firebase SDK (protegido automaticamente)
// Rate limit: máximo 10 gerações por usuário por dia (contagem em /rateLimits)
exports.gerarTreino = onCall(
  { secrets: [claudeApiKey], timeoutSeconds: 60 },
  async (request) => {
    // ── Autenticação ───────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const uid = request.auth.uid;
    const { prompt } = request.data;

    // ── Validação do prompt ────────────────────────────────
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError("invalid-argument", "Campo 'prompt' é obrigatório");
    }
    if (prompt.length < 50) {
      throw new HttpsError("invalid-argument", "Prompt muito curto");
    }
    if (prompt.length > 40000) {
      throw new HttpsError(
        "invalid-argument",
        "Prompt excede o tamanho máximo (40.000 chars)",
      );
    }

    // ── Rate limit: máx 20 chamadas por usuário por dia ────
    const hoje = new Date().toISOString().split("T")[0]; // ex: "2026-06-02"
    const rateRef = db.ref(`rateLimits/${uid}/${hoje}`);

    let permitido = false;
    await rateRef.transaction((atual) => {
      const count = atual ?? 0;
      if (count >= 20) {
        permitido = false;
        return; // undefined = aborta sem gravar
      }
      permitido = true;
      return count + 1;
    });

    if (!permitido) {
      throw new HttpsError(
        "resource-exhausted",
        "Limite diário de 20 gerações atingido. Tente novamente amanhã.",
      );
    }

    // ── Chamada à API do Claude ────────────────────────────
    const key = claudeApiKey.value();

    let resp;
    try {
      resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          temperature: 0,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (fetchErr) {
      console.error("[Claude] Falha na requisição HTTP:", fetchErr.message);
      throw new HttpsError("internal", "Falha ao conectar com a API do Claude");
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[Claude] API retornou erro:", resp.status, errText);
      throw new HttpsError(
        "internal",
        `API do Claude retornou erro ${resp.status}`,
      );
    }

    const apiData = await resp.json();
    const text = apiData.content?.[0]?.text || "";

    // Remove blocos markdown (```json ... ```) se presentes
    const cleanText = text
      .replace(/```(?:json)?\s*/gi, "")
      .replace(/```\s*/g, "");

    // Extrai o bloco JSON (Claude às vezes adiciona texto antes/depois)
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error(
        "[Claude] Resposta sem JSON válido. finish_reason:",
        apiData.stop_reason,
        "| Texto:",
        text.substring(0, 800),
      );
      throw new HttpsError(
        "internal",
        "Resposta do Claude não contém JSON válido",
      );
    }

    let resultado;
    try {
      resultado = JSON.parse(match[0]);
    } catch (parseErr) {
      console.error(
        "[Claude] Falha ao parsear JSON. finish_reason:",
        apiData.stop_reason,
        "| JSON extraído:",
        match[0].substring(0, 800),
      );
      throw new HttpsError(
        "internal",
        "JSON retornado pelo Claude não pôde ser parseado",
      );
    }

    if (!resultado.treino) {
      throw new HttpsError(
        "internal",
        "JSON do Claude não contém a chave 'treino'",
      );
    }

    console.log(
      `[Claude] Treino gerado para uid=${uid}:`,
      resultado.treino.grupo_muscular,
      `— ${resultado.treino.exercicios?.length ?? 0} exercícios`,
    );

    return resultado;
  },
);
