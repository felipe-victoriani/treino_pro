# 🚀 Deploy das Cloud Functions

## O que fazem essas funções?

1. **deletarProfessor** - Remove completamente um professor:
   - Deleta dados no Realtime Database (`users/`, `professores/`)
   - Deleta a conta do Firebase Authentication
   - **Libera o email para ser reutilizado**

2. **deletarAluno** - Remove completamente um aluno:
   - Deleta dados no Realtime Database (`users/`, `alunos/`, `treinos/`, `dietas/`, `mensagens/`, `historicoTreinos/`, `historicoIMC/`)
   - Deleta a conta do Firebase Authentication
   - **Libera o email para ser reutilizado**

3. **notificarNovaMensagem** - Envia notificação push quando há nova mensagem

## ⚡ Como fazer o deploy

### 1. Instalar Firebase CLI (primeira vez)

```powershell
npm install -g firebase-tools
```

### 2. Fazer login no Firebase

```powershell
firebase login
```

### 3. Selecionar o projeto

```powershell
firebase use app-treino-academia
```

### 4. Deploy das funções

Navegue até a pasta `functions/`:

```powershell
cd functions
```

Instale as dependências (primeira vez):

```powershell
npm install
```

Faça o deploy:

```powershell
firebase deploy --only functions
```

Ou use o script de atalho:

```powershell
npm run deploy
```

## ✅ Verificar se funcionou

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Functions** no menu lateral
3. Você deve ver 3 funções listadas:
   - ✅ deletarAluno
   - ✅ deletarProfessor
   - ✅ notificarNovaMensagem

## 🔒 Segurança

As funções verificam autenticação antes de executar:

- Só usuários logados podem chamar as funções
- Usa Firebase Admin SDK (acesso total ao banco com segurança)

## 💰 Custos

**Plano Spark (gratuito):**

- 125.000 invocações/mês
- 40.000 GB-segundos
- Suficiente para ~50-100 professores ativos

**Estimativa:**

- Deletar 10 alunos/dia = ~300 invocações/mês (dentro do gratuito)

## ❗ Importante

Após o deploy, **TESTE** excluindo um aluno de teste para garantir que:

1. O email fica livre para ser reutilizado
2. Todos os dados (treinos, dietas, mensagens) são removidos
3. A conta é deletada do Authentication

## 🐛 Troubleshooting

**Erro: "Firebase CLI not found"**

```powershell
npm install -g firebase-tools
```

**Erro: "Not authorized"**

```powershell
firebase login --reauth
```

**Ver logs das funções:**

```powershell
firebase functions:log
```

**Erro: "Functions region not supported"**
As funções estão configuradas para `us-central1` (padrão). Se precisar mudar, edite `index.js`.
