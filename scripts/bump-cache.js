/**
 * Atualiza automaticamente o CACHE_NAME no sw.js antes do deploy.
 * Usa timestamp no formato: treino-pro-vYYYY.MM.DD-HHmm
 */
const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "sw.js");
let content = fs.readFileSync(swPath, "utf8");

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const version = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const newCacheName = `treino-pro-v${version}`;

content = content.replace(
  /const CACHE_NAME = "treino-pro-v[\d.\-]+";/,
  `const CACHE_NAME = "${newCacheName}";`,
);

// Atualiza também os logs que mencionam a versão
content = content.replace(
  /\[SW\] Instalando Service Worker v[\d.]+\.\.\./,
  `[SW] Instalando Service Worker v${version}...`,
);
content = content.replace(
  /\[SW\] Ativando Service Worker v[\d.]+\.\.\./,
  `[SW] Ativando Service Worker v${version}...`,
);

fs.writeFileSync(swPath, content, "utf8");
console.log(`✔ CACHE_NAME atualizado para: ${newCacheName}`);
