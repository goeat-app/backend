# Deploy para Firebase Functions

Este guia descreve o fluxo recomendado para publicar o backend NestJS no Firebase Cloud Functions (2nd gen).

## Pré-requisitos

- **Node.js 22+** (confira com `node --version`)
- **Yarn** (confira com `yarn --version`)
- **Firebase CLI** instalada globalmente:
  ```bash
  npm install -g firebase-tools
  ```
- Conta com acesso ao projeto Firebase (Owner ou Editor)

## Estrutura já preparada no projeto

- Função HTTP exportada como `api` em `src/firebase.ts`
- Configuração de deploy em `firebase.json`
- Scripts no `package.json`:
  - `yarn firebase:emulator` - Testar localmente (Auth + Functions)
  - `yarn firebase:deploy` - Deploy das Functions

## Ambiente de Desenvolvimento

### Testar localmente antes de fazer deploy

```bash
# 1. Instalar dependências
yarn install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env conforme necessário

# 3. Subir banco de dados local (Docker)
docker compose up -d

# 4. Em um terminal, testar a função localmente
npm run firebase:emulator

# 5. Em outro terminal, suba o backend também
npm run start:emulator

# 6. Testar um endpoint em http://localhost:3000 ou http://localhost:5001
```

## 1. Login no Firebase

```bash
firebase login
```

Isso abre seu navegador para autenticação com a conta Google conectada ao projeto Firebase.

Confirme:

```bash
firebase login:list
```

## 2. Vincular o repositório ao projeto Firebase

No diretório raiz do backend:

```bash
firebase use --add
```

Selecione o Project ID correto e defina um alias (exemplo: `dev` ou `prod`).

### Verificar qual projeto está selecionado

```bash
firebase use
```

### Trocar para outro projeto/alias

```bash
firebase use <alias>
```

## 3. Validar build local

```bash
yarn build
```

Certifique-se de que compila sem erros TypeScript.

## 4. Configurar variáveis de ambiente para produção

Antes de fazer deploy, configure as variáveis no Firebase:

```bash
firebase functions:config:set \
  app.environment=production \
  app.database_url="postgresql://user:pass@host:5432/db" \
  auth.firebase_project_id="seu-projeto-firebase"
```

Ou no Firebase Console:

1. Vá para **Functions** → **Configuration** → **Runtime environment variables**
2. Adicione as variáveis necessárias (mesmo esquema de `.env`)

## 5. Executar migrations (se aplicável)

Se sua função executar migrações de banco de dados:

```bash
yarn db:migrate
```

Certifique-se de que o banco de produção está acessível.

## 6. Deploy das Functions

```bash
yarn firebase:deploy
```

Isso fará o deploy apenas das Functions. Você verá output indicando sucesso.

### Deploy completo (se tiver outras coisas)

Se também tem Firestore rules, storage rules, etc:

```bash
firebase deploy
```

## Monitoramento pós-deploy

### Ver logs da função

```bash
firebase functions:log
```

ou no Firebase Console:

1. **Functions** → **Dashboard**
2. Clique na função `api`
3. Veja a aba **Logs**

### Testar a função deployed

```bash
# Pegar a URL da função no console ou nos logs de deploy
curl -X GET https://<region>-<project-id>.cloudfunctions.net/api/auth/me \
  -H "Authorization: Bearer <firebase-id-token>"
```

## Troubleshooting rápido

### Erro de autenticação/permissão

```bash
# Confirme o usuário logado
firebase login:list

# Se errado, faça logout e login novamente
firebase logout
firebase login
```

Verifique se sua conta tem permissão `roles/editor` ou `roles/owner` no projeto Firebase.

### Deploy falha por erro de build

```bash
# Rode localmente para ver o erro real
yarn build

# Corrija o erro TypeScript e tente novamente
yarn firebase:deploy
```

### Projeto incorreto selecionado

```bash
# Verifique qual está ativo
firebase use

# Troque para o alias correto
firebase use <alias-certo>

# Verifique novamente
firebase use
```

### Função retorna erro 500

1. Verifique os logs: `firebase functions:log`
2. Certifique-se de que variáveis de ambiente estão configuradas
3. Teste localmente com `yarn firebase:emulator` para reproduzir

### "Cannot find module" na função deployed

1. Certifique-se de que rodou `yarn install` antes de fazer deploy
2. Verifique que `dependencies` (não `devDependencies`) inclui as bibliotecas necessárias
3. Recompile e tente novamente

## Reverter um deploy

Firebase não tem um comando "undo" direto, mas você pode:

```bash
# 1. Reverter seu código localmente
git revert <commit-id>

# 2. Fazer deploy da versão anterior
npm run build
npm run firebase:deploy

# 3. Isso sobrescreve a função com a versão anterior
```

## Informações Adicionais

- **Documentação oficial:** [Firebase Functions Node.js Guide](https://firebase.google.com/docs/functions/get-started/overview)
- **Limites e pricing:** [Firebase Functions Pricing](https://firebase.google.com/pricing)
- **Ambiente de execução:** [Node.js runtime](https://firebase.google.com/docs/functions/runtime)

## Próximos passos

1. Leia [firebase-auth.md](./firebase-auth.md) para entender autenticação
2. Leia [local-development.md](./local-development.md) para setup local
3. Configure CI/CD para automatizar deploys (GitHub Actions, etc)
