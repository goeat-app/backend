# Rodando o backend localmente

Este guia descreve como executar o backend **100% local**, sem depender de nenhum
serviço externo (Supabase, Firebase de produção, etc.).

A stack local usa:

| Serviço        | Tecnologia               | Porta |
| -------------- | ------------------------ | ----- |
| Banco de dados | Docker + PostgreSQL 16   | 5432  |
| Autenticação   | Firebase Auth Emulator   | 9099  |
| Emulator UI    | Firebase Emulator Suite  | 4000  |
| Backend NestJS | `npm run start:emulator` | 3000  |

---

## Pré-requisitos

- [Node.js 22](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop) (com Docker Compose)
- Firebase CLI:
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

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
EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat

# Uploads locais
UPLOADS_PATH=./uploads
```

> As variáveis de Supabase Storage (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY`) não são necessárias para rodar localmente se você
> não for testar upload de imagens.

---

## 3. Subir o PostgreSQL com Docker

```bash
docker compose up -d
```

Isso sobe o container `goeat-postgres` com:

- **Usuário:** `admin`
- **Senha:** `goeat-admin`
- **Banco:** `goeat_db`
- **Porta:** `5432`

Verifique se está saudável:

```bash
docker compose ps
```

A coluna `Status` deve mostrar `healthy`.

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

## 4. Subir o Firebase Auth Emulator

**Terminal 1** — inicia o emulador de Auth:

```bash
yarn firebase:emulator
```

Esse comando sobe o emulador em `localhost:9099` e a UI em `localhost:4000`.

**Terminal 2** — sobe o backend apontado para o emulador:

```bash
yarn start:emulator
```

O backend estará disponível em `http://localhost:3000`.

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

- Certifique-se de que rodou `npm run firebase:emulator` (não `npm run start:emulator`)
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

Em um terminal separado:

```bash
npm run emulators:auth
```

Isso inicia o emulador de Auth em `localhost:9099` e a Emulator UI em
`localhost:4000` (acesse pelo browser para visualizar e gerenciar usuários
emulados).

> Para mais detalhes sobre o emulador, incluindo persistência de dados entre
> reinicializações, consulte [firebase-auth.md](./firebase-auth.md).

---

## 5. Iniciar o backend

Em outro terminal:

```bash
npm run start:emulator
```

Esse script define `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` automaticamente
e sobe o NestJS em modo watch. Alternativamente, se você já exportou as
variáveis no `.env`, pode usar:

```bash
npm run start:dev
```

O servidor estará disponível em `http://localhost:3000`.

---

## Resumo dos terminais

| Terminal | Comando                  | O que faz                     |
| -------- | ------------------------ | ----------------------------- |
| 1        | `docker compose up -d`   | Sobe o PostgreSQL             |
| 2        | `npm run emulators:auth` | Sobe o Firebase Auth Emulator |
| 3        | `npm run start:emulator` | Sobe o NestJS                 |

---

## Parando os serviços

```bash
# Para o NestJS: Ctrl+C no terminal 3
# Para o emulador: Ctrl+C no terminal 2

# Para o Docker:
docker compose down
```

Para remover também o volume de dados do Postgres:

```bash
docker compose down -v
```
