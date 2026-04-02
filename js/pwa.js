/* ============================================================
   TREINO PRO - PWA (Progressive Web App)
   Registro do Service Worker e controle de instalação
   ============================================================ */

let deferredPrompt = null; // Armazena o evento de instalação

/**
 * Registra o Service Worker
 */
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Service Worker não suportado neste navegador.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log(
      "[PWA] Service Worker registrado com sucesso:",
      registration.scope,
    );

    // Verifica atualização
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdateBanner();
        }
      });
    });
  } catch (error) {
    console.error("[PWA] Falha ao registrar Service Worker:", error);
  }
}

/**
 * Captura o evento de instalação do PWA
 */
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  console.log("[PWA] Evento de instalação capturado - app pode ser instalado!");
  showInstallButton();
});

/**
 * Usuário instalou o app com sucesso
 */
window.addEventListener("appinstalled", () => {
  console.log("[PWA] App instalado com sucesso!");
  deferredPrompt = null;
  hideInstallButton();
  showToast("Treino Pro instalado com sucesso! 🎉", "success", 5000);
});

/**
 * Exibe botão flutuante de instalação
 */
function showInstallButton() {
  let btn = document.getElementById("pwa-install-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.className = "pwa-install-btn";
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/>
      </svg>
      Instalar App
    `;
    btn.addEventListener("click", triggerInstall);
    document.body.appendChild(btn);
  }
  btn.classList.add("visible");
}

/**
 * Oculta botão de instalação
 */
function hideInstallButton() {
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.classList.remove("visible");
}

/**
 * Aciona o prompt de instalação nativo
 */
async function triggerInstall() {
  if (!deferredPrompt) {
    showToast("Use o menu do navegador para instalar o app.", "info");
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log("[PWA] Resposta do usuário:", outcome);
  deferredPrompt = null;
  hideInstallButton();
}

/**
 * Exibe banner de atualização disponível
 */
function showUpdateBanner() {
  const banner = document.createElement("div");
  banner.className = "update-banner";
  banner.innerHTML = `
    <span>Nova versão disponível!</span>
    <button onclick="window.location.reload()">Atualizar</button>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  document.body.prepend(banner);
}

/* ---- Inicializa PWA quando DOM carrega ---- */
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
});
