/* ============================================================
   TREINO PRO - Service Worker
   Estratégia: Cache-first para assets estáticos
   ============================================================ */

/* --- Firebase Messaging (background push) --- */
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBnP4bA-sBcREdb4UzN9jOkxxIuPFog_Ek",
  authDomain: "app-treino-academia.firebaseapp.com",
  projectId: "app-treino-academia",
  storageBucket: "app-treino-academia.firebasestorage.app",
  messagingSenderId: "719877721910",
  appId: "1:719877721910:web:ab1eca0d9db20d0d39ed97",
});

const _swMessaging = firebase.messaging();

/* Exibe notificação quando o app está em background/fechado */
_swMessaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || "Nova mensagem";
  const body = notification.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/assets/icons/icon-192.png",
    badge: "/assets/icons/icon-72.png",
    tag: "mensagem",
    renotify: true,
    data: payload.data || {},
  });
});

const CACHE_NAME = "treino-pro-v1.1.0";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/cadastro.html",
  "/professor.html",
  "/aluno.html",
  "/404.html",
  "/css/style.css",
  "/css/responsive.css",
  "/js/firebase-config.js",
  "/js/auth.js",
  "/js/utils.js",
  "/js/pwa.js",
  "/js/login.js",
  "/js/cadastro.js",
  "/js/professor.js",
  "/js/aluno.js",
  "/js/treinos.js",
  "/js/dietas.js",
  "/js/imc.js",
  "/js/mensagens.js",
  "/manifest.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
];

/* --- Install: pré-cacheia arquivos estáticos --- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cacheia cada arquivo individualmente para não bloquear o install
      // caso algum asset opcional (ex.: ícones PNG) ainda não exista.
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[SW] Não foi possível cachear:", url, err.message);
          }),
        ),
      );
    }),
  );
  self.skipWaiting();
});

/* --- Activate: limpa caches antigos --- */
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Removendo cache antigo:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

/* --- Fetch: Estratégia cache-first com fallback para rede --- */
self.addEventListener("fetch", (event) => {
  // Ignorar requisições ao Firebase (sempre rede)
  if (
    event.request.url.includes("firebase") ||
    event.request.url.includes("googleapis") ||
    event.request.url.includes("gstatic")
  ) {
    return;
  }

  // Ignorar requisições não GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza o cache em background (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Não está no cache: busca na rede
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          // Cacheia a resposta
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline: retorna página de fallback
          if (event.request.destination === "document") {
            return caches.match("/offline.html") || caches.match("/index.html");
          }
        });
    }),
  );
});

/* --- Background Sync (futuro) --- */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-treino") {
    console.log("[SW] Sincronizando treino...");
  }
});

/* --- Notificação clicada: abre/foca o app --- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});
