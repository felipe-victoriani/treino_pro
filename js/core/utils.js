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
    success: iconeSvg("check", 18),
    error: iconeSvg("erro", 18),
    info: iconeSvg("info", 18),
    warning: iconeSvg("alerta", 18),
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
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
 * Faz parse de um número decimal aceitando vírgula OU ponto como separador
 * (padrão pt-BR). Remove espaços e qualquer caractere que não seja dígito,
 * vírgula, ponto ou sinal. Retorna NaN se inválido.
 * @param {string|number} raw
 * @returns {number}
 */
function parseDecimal(raw) {
  if (raw === null || raw === undefined) return NaN;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(",", ".");
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
}

/**
 * Converte uma instância de Date para YYYY-MM-DD em fuso LOCAL
 * (não usar toISOString — esse converte p/ UTC e quebra perto da meia-noite)
 * @param {Date} d
 * @returns {string}
 */
function dateKeyOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD (para chave no Firebase)
 * @returns {string}
 */
function getDateKey() {
  return dateKeyOf(new Date());
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

/* ---- Ícones SVG (substituem emojis na interface) ----
   Mesmo estilo dos SVGs já usados no app: preenchidos, viewBox 24,
   cor herdada via currentColor. Paths fixos (sem dados de usuário). */
const ICONES_SVG = {
  check:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  erro: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  alerta: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  editar:
    "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  copiar:
    "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  lixeira: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  trofeu:
    "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
  cadeado:
    "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z",
  cadeadoAberto:
    "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z",
  grafico:
    "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
  halter:
    "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z",
};

/**
 * Retorna o markup de um ícone SVG da tabela ICONES_SVG
 * @param {keyof ICONES_SVG} nome
 * @param {number} [tamanho=20] - largura/altura em px
 * @returns {string}
 */
function iconeSvg(nome, tamanho = 20) {
  const d = ICONES_SVG[nome] || ICONES_SVG.info;
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
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
    "#111111",
    "#9f2f2d",
    "#00BCD4",
    "#346538",
    "#956400",
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
