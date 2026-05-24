/* ============================================================
   TREINO PRO - Utilitários Globais
   Funções reutilizáveis em todo o sistema
   ============================================================ */

/* ---- Toast Notifications ---- */
/**
 * Exibe uma notificação toast na tela
 * @param {string} message - Mensagem a exibir
 * @param {string} type    - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Duração em ms (default 3500)
 */
function showToast(message, type = "info", duration = 3500) {
  // Cria container se não existir
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Animação de entrada
  requestAnimationFrame(() => toast.classList.add("toast-show"));

  // Auto-remover
  setTimeout(() => {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---- Loading Overlay ---- */
/**
 * Exibe o overlay de carregamento global
 * @param {string} message - Mensagem opcional
 */
function showLoading(message = "Carregando...") {
  let overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-box">
        <div class="spinner"></div>
        <p id="loading-msg">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    document.getElementById("loading-msg").textContent = message;
  }
  overlay.classList.add("active");
}

/** Oculta o overlay de carregamento */
function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("active");
}

/* ---- Formatação de Datas ---- */
/**
 * Formata timestamp para data legível em pt-BR
 * @param {number} timestamp
 * @returns {string}
 */
function formatDate(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

/**
 * Formata timestamp para data e hora em pt-BR
 * @param {number} timestamp
 * @returns {string}
 */
function formatDateTime(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Retorna a data atual no formato YYYY-MM-DD (para chave no Firebase)
 * @returns {string}
 */
function getDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY
 * @param {string} dateKey
 * @returns {string}
 */
function formatDateKey(dateKey) {
  if (!dateKey) return "-";
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

/* ---- Validação ---- */
/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitiza string para evitar XSS
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

/* ---- Utilidades de UI ---- */
/**
 * Mostra ou oculta elemento por ID
 * @param {string} id
 * @param {boolean} show
 */
function toggleElement(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden", !show);
}

/**
 * Navega entre seções de uma SPA
 * @param {string} sectionId   - ID da seção a mostrar
 * @param {string} navSelector - Seletor dos itens de nav
 * @param {string} dataAttr    - Atributo data-* que identifica a seção
 */
function navigateTo(sectionId, navSelector, dataAttr = "section") {
  // Oculta todas as seções
  document
    .querySelectorAll(".app-section")
    .forEach((s) => s.classList.add("hidden"));
  // Mostra a seção alvo
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.remove("hidden");
  // Atualiza nav ativo
  document.querySelectorAll(navSelector).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset[dataAttr] === sectionId);
  });
}

/**
 * Gera iniciais do nome para avatar
 * @param {string} nome
 * @returns {string}
 */
function getInitials(nome) {
  if (!nome) return "?";
  return nome
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * Gera cor de avatar baseada no nome
 * @param {string} nome
 * @returns {string}
 */
function getAvatarColor(nome) {
  const colors = [
    "#6B35C3",
    "#FF1744",
    "#00BCD4",
    "#4CAF50",
    "#FF9800",
    "#E91E63",
  ];
  let hash = 0;
  for (let i = 0; i < (nome || "").length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Debounce para otimizar chamadas de função
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ---- Máscaras ---- */
/**
 * Formata número como IMC (2 casas decimais)
 * @param {number} value
 * @returns {string}
 */
function formatIMC(value) {
  return Number(value).toFixed(1);
}
