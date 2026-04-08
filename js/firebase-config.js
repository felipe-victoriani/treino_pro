/* ============================================================
   TREINO PRO - Configuração do Firebase
   
   ⚠️ IMPORTANTE: Substitua os valores abaixo pelas credenciais
   do seu projeto Firebase antes de usar!
   
   Como obter suas credenciais:
   1. Acesse https://console.firebase.google.com
   2. Selecione ou crie seu projeto
   3. Vá em Configurações do projeto > Seus apps > SDK setup
   4. Copie o objeto firebaseConfig
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBnP4bA-sBcREdb4UzN9jOkxxIuPFog_Ek",
  authDomain: "app-treino-academia.firebaseapp.com",
  databaseURL: "https://app-treino-academia-default-rtdb.firebaseio.com",
  projectId: "app-treino-academia",
  storageBucket: "app-treino-academia.firebasestorage.app",
  messagingSenderId: "719877721910",
  appId: "1:719877721910:web:ab1eca0d9db20d0d39ed97",
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
window.storage = storage;

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
console.log(
  "%c[Firebase] Projeto: " + firebaseConfig.projectId,
  "color: #a78bfa; font-weight: bold",
);

/* --- Configurar persistência de autenticação --- */
auth
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) =>
    console.error("[Firebase] Erro ao configurar persistência:", error),
  );

/* ============================================================
   REGRAS DE SEGURANÇA SUGERIDAS PARA O REALTIME DATABASE
   Cole estas regras no Console Firebase > Realtime Database > Regras:

{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "professores": {
      "$professorId": {
        ".read":  "auth.uid === $professorId",
        ".write": "auth.uid === $professorId"
      }
    },
    "alunos": {
      "$alunoId": {
        ".read":  "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid",
        ".write": "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid"
      }
    },
    "treinos": {
      "$alunoId": {
        ".read":  "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid",
        ".write": "root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid"
      }
    },
    "dietas": {
      "$alunoId": {
        ".read":  "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid",
        ".write": "root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid"
      }
    },
    "mensagens": {
      "$alunoId": {
        ".read":  "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid",
        ".write": "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid"
      }
    },
    "historicoTreinos": {
      "$alunoId": {
        ".read":  "auth.uid === $alunoId || root.child('alunos/' + $alunoId + '/professorId').val() === auth.uid",
        ".write": "auth.uid === $alunoId"
      }
    },
    "exercicios": {
      ".read": "auth.uid !== null",
      "$exercicioId": {
        ".write": "auth.uid !== null && (!data.exists() || (data.child('customizado').val() === true && data.child('criadoPor').val() === auth.uid))"
      }
    },
    "favoritosProfessor": {
      "$professorId": {
        ".read":  "auth.uid === $professorId",
        ".write": "auth.uid === $professorId"
      }
    },
    "recentesProfessor": {
      "$professorId": {
        ".read":  "auth.uid === $professorId",
        ".write": "auth.uid === $professorId"
      }
    }
  }
}

   ============================================================ */

/* ============================================================
   REGRAS SUGERIDAS PARA O FIREBASE STORAGE
   Console Firebase > Storage > Regras:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Vídeos de exercícios:
    //   - Qualquer usuário logado pode LER (aluno assiste)
    //   - Somente o PROFESSOR dono do caminho pode GRAVAR e DELETAR
    match /exerciciosVideos/{professorId}/{alunoId}/{letra}/{fileName} {
      allow read:   if request.auth != null;
      allow write:  if request.auth != null && request.auth.uid == professorId;
      allow delete: if request.auth != null && request.auth.uid == professorId;
    }
  }
}
============================================================ */
