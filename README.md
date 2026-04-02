# Academia Pro — PWA de Gerenciamento de Academia

Sistema completo de gerenciamento de academia em formato PWA (Progressive Web App) instalável, com dois perfis de usuário: **Professor** e **Aluno**.

---

## 🚀 Configuração Inicial (Obrigatório)

### Passo 1 — Criar Projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Dê um nome (ex: `academia-pro`) e conclua a criação

### Passo 2 — Ativar Autenticação

1. No menu lateral: **Authentication → Primeiros passos**
2. Clique em **"Método de login"**
3. Ative **E-mail/senha** → Salvar

### Passo 3 — Criar Banco de Dados (Realtime Database)

1. No menu lateral: **Realtime Database → Criar banco de dados**
2. Escolha a região (ex: `us-central1`)
3. Inicie em **modo de teste** (permitir leitura/escrita por 30 dias)

### Passo 4 — Obter Configurações do Firebase

1. Vá em **Visão geral do projeto → ⚙️ Configurações do projeto**
2. Em **"Seus apps"**, clique em **"Adicionar app"** → ícone **Web (`</>`)**
3. Registre o app (nome qualquer) — **não** precisa do Firebase Hosting agora
4. Copie o objeto `firebaseConfig` que aparece

### Passo 5 — Substituir Placeholders no Código

Abra o arquivo `js/firebase-config.js` e substitua:

```javascript
// ANTES (placeholders):
var firebaseConfig = {
  apiKey: "SUA-API-KEY-AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  databaseURL: "https://SEU-PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "SEU-SENDER-ID",
  appId: "SEU-APP-ID",
};

// DEPOIS (valores reais do Firebase Console):
var firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "SeuProjeto.firebaseapp.com",
  databaseURL: "https://SeuProjeto-default-rtdb.firebaseio.com",
  projectId: "SeuProjeto",
  storageBucket: "SeuProjeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123",
};
```

### Passo 6 — Configurar Regras de Segurança do Banco

1. No Firebase Console → **Realtime Database → Regras**
2. Substitua as regras padrão pelas seguintes:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "alunos": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "professores": {
      ".read": "auth != null",
      "$pid": {
        ".write": "$pid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "treinos": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "dietas": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "mensagens": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    },
    "historicoTreinos": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('tipo').val() === 'professor'"
      }
    }
  }
}
```

3. Clique em **Publicar**

---

## 👨‍🏫 Criar Conta de Professor

Contas de professor devem ser criadas **manualmente** no Firebase Console (apenas o administrador faz isso):

### 1. Criar usuário na Autenticação

1. **Authentication → Usuários → Adicionar usuário**
2. Preencha: email e senha do professor
3. Copie o **UID** gerado (ex: `abc123def456`)

### 2. Adicionar dados no banco

No **Realtime Database**, clique no botão **`+`** na raiz e adicione manualmente:

**Nó `users/{UID-DO-PROFESSOR}`:**

```json
{
  "nome": "Prof. João Silva",
  "email": "professor@academia.com",
  "tipo": "professor",
  "createdAt": 1700000000000
}
```

**Nó `professores/{UID-DO-PROFESSOR}`:**

```json
{
  "nome": "Prof. João Silva",
  "email": "professor@academia.com"
}
```

> **Importante:** O campo `tipo: "professor"` é essencial para as regras de segurança funcionarem.

---

## 🎓 Cadastrar Alunos

Os alunos se cadastram pela própria tela de cadastro (`cadastro.html`):

1. Na tela inicial do app, clique em **"Criar conta"**
2. O aluno preenche: nome, email, senha, peso, altura e seleciona o professor
3. O sistema cria automaticamente os nós no banco

---

## 🖥️ Rodar o App Localmente

> **Atenção:** Não abra os arquivos HTML diretamente no navegador (`file://`). O Firebase Auth requer HTTP.

### Opção A — VS Code Live Server (recomendado)

1. Instale a extensão **Live Server** no VS Code
2. Clique com o botão direito em `index.html` → **"Open with Live Server"**
3. O app abre em `http://127.0.0.1:5500`

### Opção B — Node.js serve

```bash
# Instale globalmente (apenas uma vez)
npm install -g serve

# Na pasta do projeto:
serve .
```

O app estará em `http://localhost:3000`.

---

## 🏋️ Gerar Ícones do PWA

Os ícones PNG são necessários para o PWA ser instalável.

1. Abra o arquivo `assets/icons/generate-icons.html` no navegador (via Live Server)
2. Clique em **"Gerar e Baixar Todos os Ícones"**
3. O browser vai baixar 8 arquivos PNG: `icon-72.png`, `icon-96.png`, ..., `icon-512.png`
4. Mova todos os PNGs para a pasta `assets/icons/`

---

## 🌐 Publicar com Firebase Hosting (opcional)

```bash
# Instale Firebase CLI (apenas uma vez)
npm install -g firebase-tools

# Login
firebase login

# Na pasta do projeto:
firebase init hosting
# - Selecione seu projeto
# - Pasta pública: . (ponto — raiz)
# - SPA: NÃO (os redirecionamentos já são feitos pelo JS)
# - Sobrescrever index.html: NÃO

# Publicar
firebase deploy
```

O app ficará em: `https://SEU-PROJETO.web.app`

---

## 📱 Instalar como PWA

### No Celular (Android/Chrome)

1. Acesse o app no Chrome
2. Toque no menu `⋮` → **"Adicionar à tela inicial"**

### No Celular (iPhone/Safari)

1. Acesse o app no Safari
2. Toque no botão de compartilhar `⬆` → **"Adicionar à Tela de Início"**

### No Computador (Chrome/Edge)

1. Acesse o app no navegador
2. Clique no ícone de instalação na barra de endereço (ícone de monitor ou `⊕`)

---

## 📁 Estrutura de Arquivos

```
APP_ACADEMIA/
├── index.html              ← Splash/redirect (detecta login e redireciona)
├── login.html              ← Tela de login + recuperação de senha
├── cadastro.html           ← Cadastro de alunos
├── professor.html          ← Dashboard do professor (SPA)
├── aluno.html              ← Dashboard do aluno (SPA)
├── 404.html                ← Página de erro
├── manifest.json           ← Config PWA
├── sw.js                   ← Service Worker (cache offline)
├── css/
│   ├── style.css           ← Design system completo
│   └── responsive.css      ← Media queries responsivas
├── js/
│   ├── firebase-config.js  ← ⚠️ Configurar com suas credenciais
│   ├── utils.js            ← Funções utilitárias globais
│   ├── auth.js             ← Guard de autenticação + evento userReady
│   ├── pwa.js              ← Service Worker + botão de instalação
│   ├── login.js            ← Lógica de login e recuperação de senha
│   ├── cadastro.js         ← Lógica de cadastro de alunos
│   ├── imc.js              ← Calculadora de IMC
│   ├── treinos.js          ← CRUD de treinos (professor/aluno)
│   ├── dietas.js           ← CRUD de dietas (professor/aluno)
│   ├── mensagens.js        ← Sistema de mensagens em tempo real
│   ├── professor.js        ← Controller do dashboard do professor
│   └── aluno.js            ← Controller do dashboard do aluno
└── assets/
    └── icons/
        ├── icon.svg            ← Ícone base (source)
        ├── generate-icons.html ← Gerador de PNGs
        ├── icon-72.png         ← ⚠️ Gerar via generate-icons.html
        ├── icon-96.png
        ├── icon-128.png
        ├── icon-144.png
        ├── icon-152.png
        ├── icon-192.png
        ├── icon-384.png
        └── icon-512.png
```

---

## 🗄️ Estrutura do Banco de Dados (Firebase Realtime Database)

```
/
├── users/
│   └── {uid}/
│       ├── nome: string
│       ├── email: string
│       ├── tipo: "professor" | "aluno"
│       ├── peso: number (aluno)
│       ├── altura: number (aluno)
│       ├── imc: number (aluno)
│       ├── imcClasse: string (aluno)
│       └── createdAt: timestamp
│
├── professores/
│   └── {professorUid}/
│       ├── nome: string
│       ├── email: string
│       └── alunos/
│           └── {alunoUid}: true
│
├── alunos/
│   └── {alunoUid}/
│       ├── nome: string
│       ├── email: string
│       ├── professorId: string
│       ├── treinoAtual: "A" | "B" | "C" | "D" | "E"
│       ├── peso: number
│       ├── altura: number
│       ├── imc: number
│       └── imcClasse: string
│
├── treinos/
│   └── {alunoUid}/
│       └── {letra: A|B|C|D|E}/
│           ├── foco: string
│           └── exercicios/
│               └── {exId}/
│                   ├── nome: string
│                   ├── series: string
│                   ├── reps: string
│                   ├── carga: string
│                   ├── descanso: string
│                   └── obs: string
│
├── dietas/
│   └── {alunoUid}/
│       ├── titulo: string
│       ├── objetivo: string
│       ├── obs: string
│       ├── updatedAt: timestamp
│       └── refeicoes/
│           └── {refId}/
│               ├── nome: string
│               ├── horario: string
│               └── alimentos/
│                   └── {alimId}/
│                       ├── nome: string
│                       └── quantidade: string
│
├── mensagens/
│   └── {alunoUid}/
│       └── {msgId}/
│           ├── texto: string
│           ├── de: "professor" | "aluno"
│           ├── deUid: string
│           ├── deNome: string
│           ├── timestamp: number
│           └── lida: boolean
│
└── historicoTreinos/
    └── {alunoUid}/
        └── {YYYY-MM-DD}/
            ├── letra: string
            ├── completado: boolean
            ├── timestamp: number
            └── exerciciosCompletos/
                └── {exId}: true
```

---

## 🐛 Solução de Problemas

| Problema                                  | Solução                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Tela em branco ao abrir                   | Substitua as credenciais do Firebase em `js/firebase-config.js`                               |
| Erro "permission denied" no console       | Verifique as Regras de Segurança no Firebase Console                                          |
| Professor não vê alunos                   | Confirme que o nó `professores/{uid}/alunos/{alunoUid}: true` existe no banco                 |
| App não instala como PWA                  | Gere os ícones PNG via `assets/icons/generate-icons.html` e place-os na pasta `assets/icons/` |
| Firebase Auth não funciona em `file://`   | Use Live Server ou `npx serve .` para servir via HTTP                                         |
| Aluno não aparece no dropdown de cadastro | O nó `professores/{uid}` deve existir com campo `nome`                                        |

---

## 🎨 Paleta de Cores

| Variável CSS       | Valor     | Uso                          |
| ------------------ | --------- | ---------------------------- |
| `--purple-dark`    | `#1A0A3C` | Fundo de cards               |
| `--purple-mid`     | `#6B35C3` | Cor primária, botões         |
| `--purple-light`   | `#8B5CF6` | Hover, destaques             |
| `--red-bright`     | `#FF1744` | Ações destrutivas, progresso |
| `--red-mid`        | `#FF4560` | Hover de vermelho            |
| `--bg-dark`        | `#0A0A14` | Fundo principal              |
| `--text-primary`   | `#F0F0F0` | Texto principal              |
| `--text-secondary` | `#9090B0` | Texto secundário             |

---

## 📌 Tecnologias Utilizadas

- **HTML5** — sem frameworks
- **CSS3** — design system com variáveis CSS
- **JavaScript ES6** — sem bundlers (módulos via script tags)
- **Firebase 9.23.0** — compat mode (CDN)
  - Authentication (Email/Password)
  - Realtime Database
- **PWA** — Service Worker + Web Manifest + Install Prompt
#   t r e i n o _ p r o  
 