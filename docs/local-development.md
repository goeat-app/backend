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
npm install
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
npm run db:migrate
```

---

## 4. Subir o Firebase Auth Emulator

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
