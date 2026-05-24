/* ============================================================
   js/config/firebase.example.js
   
   TEMPLATE de configuração do Firebase.
   
   Como usar:
   1. Copie este arquivo: cp js/config/firebase.example.js js/config/firebase.js
   2. Preencha os valores com as credenciais do seu projeto Firebase
   3. O arquivo firebase.js está no .gitignore — nunca o commite em repos públicos
   
   Onde obter as credenciais:
   → https://console.firebase.google.com
   → Configurações do projeto > Seus apps > SDK setup & configuration
   ============================================================ */

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

/* Expõe config para uso na instância secundária (admin) */
window._firebaseConfig = firebaseConfig;

/* --- Inicializar Firebase --- */
firebase.initializeApp(firebaseConfig);

/* --- Instâncias globais --- */
const auth = firebase.auth();
const db = firebase.database();
const storage =
  typeof firebase.storage === "function" ? firebase.storage() : null;
const functions =
  typeof firebase.functions === "function" ? firebase.functions() : null;
window.storage = storage;
window.functions = functions;

/* --- Confirmar conexão no console (dev) --- */
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log(
      "%c[Firebase] ✅ Conectado ao Realtime Database",
      "color: #4ade80; font-weight: bold",
    );
  } else {
    console.warn("[Firebase] ⚠️ Desconectado do Realtime Database");
  }
});
