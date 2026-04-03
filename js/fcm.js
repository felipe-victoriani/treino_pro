/* ============================================================
   TREINO PRO - Firebase Cloud Messaging (FCM)
   Gerencia permissão, token e notificações em primeiro plano.

   ⚠️ ANTES DE USAR:
   1. Acesse Firebase Console > Project Settings > Cloud Messaging
   2. Em "Web Push certificates", clique em "Gerar par de chaves"
   3. Copie a "Chave pública" e substitua o valor de VAPID_KEY abaixo
   ============================================================ */

const VAPID_KEY =
  "BFtdz4rX5ScvQBYIg-omnvLLkpy9wQlIPcS85Tf2Ffu64lKjQAe05L1c0c1usUG489YzuXdxthWG_yAc6RhPpH8";

let _messaging = null;

/**
 * Inicializa o FCM para o usuário autenticado.
 * - Solicita permissão de notificação
 * - Obtém e salva o token FCM em users/{uid}/fcmToken
 * - Escuta mensagens em primeiro plano (app aberto)
 * @param {string} uid
 */
async function inicializarFCM(uid) {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.warn("[FCM] Navegador não suporta notificações.");
      return;
    }

    if (VAPID_KEY === "SUA_VAPID_KEY_AQUI") {
      console.warn("[FCM] Configure a VAPID_KEY em js/fcm.js antes de usar.");
      return;
    }

    // Solicita permissão ao usuário
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Permissão de notificação negada pelo usuário.");
      return;
    }

    // Inicializa Messaging (singleton)
    if (!_messaging) {
      _messaging = firebase.messaging();
    }

    // Obtém o token associado a este dispositivo/navegador
    const token = await _messaging.getToken({ vapidKey: VAPID_KEY });
    if (!token) {
      console.warn("[FCM] Token FCM não gerado.");
      return;
    }

    // Persiste o token no Realtime Database para a Cloud Function usá-lo
    await db.ref(`users/${uid}/fcmToken`).set(token);
    console.log("[FCM] ✅ Token registrado com sucesso.");

    // Escuta mensagens enquanto o app está em primeiro plano
    _messaging.onMessage((payload) => {
      const notification = payload.notification || {};
      const title = notification.title || "Nova mensagem";
      const body = notification.body || "";

      // Exibe toast nativo do app
      if (typeof showToast === "function") {
        showToast(`${title}: ${body}`, "info");
      }

      // Exibe notificação nativa do sistema operacional
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/assets/icons/icon-192.png",
        });
      }
    });
  } catch (error) {
    console.error("[FCM] Erro ao inicializar:", error);
  }
}

/* Inicializa automaticamente quando o usuário fizer login */
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged((user) => {
    if (user) {
      inicializarFCM(user.uid);
    }
  });
}
