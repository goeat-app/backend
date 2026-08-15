# Rodando o backend localmente

Este guia descreve como executar o backend **100% local**, sem depender de nenhum
serviço externo (Supabase, Firebase de produção, etc.).

A stack local usa:

| Serviço        | Tecnologia                             | Porta |
| -------------- | -------------------------------------- | ----- |
| Banco de dados | Docker + PostgreSQL 16                 | 5432  |
| Autenticação   | Docker + Firebase Auth Emulator        | 9099  |
| Emulator UI    | Docker + Firebase Emulator Suite       | 4000  |
| Backend NestJS | `yarn start:local` ou `start:emulator` | 3000  |

---

## Pré-requisitos

- [Node.js 22](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop) (com Docker Compose)

> O Firebase Auth Emulator roda via Docker — **não** é necessário instalar a
> Firebase CLI para desenvolvimento local. A CLI continua útil apenas para deploy
> (`yarn firebase:deploy`).

---

## 1. Instalar dependências

```bash
yarn install
```

---

## 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Edite `.env` com as seguintes configurações mínimas para dev local:

```env
NODE_ENV=development
PORT=3000

# Banco local (Docker — ver seção 3)
DATABASE_URL=postgresql://admin:goeat-admin@localhost:5432/goeat_db

# Firebase Auth Emulator (ver seção 4)
AUTH_EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat

# Firebase Storage (for local development with emulator)
# These values are not used locally but required by the schema
FIREBASE_API_KEY=demo-key
FIREBASE_AUTH_DOMAIN=demo-goeat.firebaseapp.com
PROJECT_ID=demo-goeat
FIREBASE_STORAGE_BUCKET=demo-goeat.appspot.com
FIREBASE_MESSAGING_SENDER_ID=demo-id
FIREBASE_APP_ID=demo-app-id

# Uploads locais (fallback for non-emulator environments)
UPLOADS_PATH=./uploads
```

> Firebase Storage is automatically configured to use the local emulator when
> `AUTH_EMULATOR_HOST` is set. Seed data (environments, food types) is
> automatically uploaded to the Storage emulator on startup.

---

## 3. Subir a infra local com Docker

```bash
yarn docker:up
# ou: docker compose up -d
```

Isso sobe:

| Container                 | Serviço                               | Portas                 |
| ------------------------- | ------------------------------------- | ---------------------- |
| `goeat-postgres`          | PostgreSQL 16                         | `5432`                 |
| `goeat-firebase-emulator` | Firebase Auth + Storage Emulator + UI | `9099`, `4000`, `9199` |

Credenciais do Postgres:

- **Usuário:** `admin`
- **Senha:** `goeat-admin`
- **Banco:** `goeat_db`

Verifique se está saudável:

```bash
docker compose ps
```

As colunas `Status` devem mostrar `healthy`.

### Rodar as migrations

Com o banco no ar, aplique as migrations para criar as tabelas:

```bash
yarn db:migrate
```

### Containers disponíveis

Você pode gerenciar os containers com:

```bash
# Parar os containers
docker compose down

# Ver logs
docker compose logs -f

# Recriar do zero
docker compose down -v
docker compose up -d
```

---

## 4. Subir o backend

Com Postgres e emulador já rodando via Docker, inicie o NestJS:

```bash
yarn start:local
```

Esse comando sobe a infra Docker (se ainda não estiver no ar) e inicia o backend
em hot-reload. Alternativa em dois passos:

```bash
yarn docker:up
yarn start:emulator
```

O backend estará em `http://localhost:3000`. A Emulator UI fica em
`http://localhost:4000/auth`.

> Usuários criados no emulador são persistidos no volume Docker
> `firebase_emulator_data` entre reinicializações do container.

---

## 5. Verificar tudo está funcionando

### Testar o banco de dados

```bash
npm run db:migrate
```

Isso aplicará todas as migrations. Você deve ver output indicando sucesso.

### Testar autenticação

Acesse a Emulator UI em `http://localhost:4000/auth` e crie um usuário de teste.

Depois, teste um endpoint protegido:

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <test-token-do-emulador>"
```

### Verificar via Docker Desktop

Abra o Docker Desktop e veja o container `goeat-postgres` rodando e saudável.

---

## 6. Desenvolvimento com hot-reload

Os scripts `start:emulator` e `start:dev` incluem flag `--watch`, então:

- Editar um arquivo TypeScript
- NestJS recompila automaticamente
- Backend reinicia em segundos
- Não é necessário parar/restar manualmente

---

## Estrutura de pastas importante

```
backend/
├── src/
│   ├── main.ts              # Entry point principal
│   ├── firebase.ts          # Firebase Function entry point
│   ├── app.module.ts        # Root module
│   ├── modules/             # Módulos do negócio (auth, menu, etc)
│   └── lib/                 # Código compartilhado (helpers, infra)
├── test/
│   ├── jest-e2e.json        # Config e2e
│   ├── jest-integration.json # Config integração
│   └── integration/         # Testes de integração
├── .env.example             # Template de variáveis (versionado)
├── .env                     # Seu arquivo local (não versionado)
├── docker-compose.yml       # PostgreSQL local
└── firebase.json            # Configuração Firebase
```

---

## Troubleshooting

### Docker container recusa conexão

```bash
# Verificar se está saudável
docker compose ps

# Ver logs
docker compose logs postgres

# Reiniciar
docker compose restart
```

### Frontend/app não consegue chamar backend local

- Certifique-se de usar `http://localhost:3000` (não `127.0.0.1:3000`)
- Verifique CORS em `src/main.ts`
- Teste com `curl` ou Postman primeiro

### Emulator UI não abre

- Certifique-se de que o container está saudável: `docker compose ps`
- Veja os logs: `docker compose logs firebase-emulator`
- Acesse `http://localhost:4000`

### "Cannot find module" errors

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules
yarn install

# Recompilar tipos
yarn typecheck
```

---

## Próximos passos

1. Leia [firebase-auth.md](./firebase-auth.md) para entender autenticação
2. Leia [firebase-auth-migration.md](./firebase-auth-migration.md) para contexto
3. Explore endpoints em `src/modules/auth/infra/controllers/`
4. Configure seu cliente para enviar Firebase ID tokens

---

## Resumo dos terminais

| Terminal | Comando               | O que faz                                  |
| -------- | --------------------- | ------------------------------------------ |
| 1        | `yarn start:local`    | Sobe Docker (Postgres + emulator) + NestJS |
| —        | `yarn docker:up`      | Só infra Docker                            |
| —        | `yarn start:emulator` | Só NestJS (infra já no ar)                 |

---

## Parando os serviços

```bash
# Para o NestJS: Ctrl+C no terminal do backend

# Para Docker (Postgres + emulador):
yarn docker:down
# ou: docker compose down
```

Para remover também o volume de dados do Postgres:

```bash
docker compose down -v
```
