# 🍽️ GoEat - Backend

Bem-vindo ao repositório do backend do **GoEat**, um sistema inteligente de recomendação de restaurantes. Este projeto foi desenvolvido utilizando **NestJS** e utiliza **PostgreSQL** como banco de dados principal, com o **Sequelize** como ORM.

---

## 🚀 Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo para aplicações escaláveis.
- **[Sequelize](https://sequelize.org/)** - ORM para Node.js (PostgreSQL).
- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Verificação de ID token para autenticação de rotas protegidas.
- **[Zod](https://zod.dev/)** - Validação de esquemas e tipos.
- **TypeScript** - Superconjunto de JavaScript com tipagem estática.

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- **Node.js 22+** (confira com `node --version`)
- **Yarn** (confira com `yarn --version`)
- **Docker** e **Docker Compose** para rodar PostgreSQL e, opcionalmente, os emuladores Firebase
- **Firebase CLI** apenas se você preferir rodar os emuladores sem Docker: `npm install -g firebase-tools`

## 🔐 Fluxo de Autenticação

- As rotas protegidas aceitam apenas `Authorization: Bearer <firebase-id-token>`.
- O backend valida o token direto com Firebase Admin SDK.
- Em primeiro acesso autenticado, o backend provisiona/vincula o usuário interno usando `firebase_uid`.
- O endpoint de sessão ativa é `GET /auth/me`.

---

## 🛠️ Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento local:

### 1. Clonar o Repositório

```bash
git clone https://github.com/goeat-app/backend.git
cd backend
```

### 2. Instalar Dependências

```bash
yarn install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure para seu ambiente:

```bash
cp .env.example .env
```

Para desenvolvimento local, use as configurações padrão. Para produção, peça as variáveis de ambiente para o time.

Para mais detalhes consulte [Running The Project](docs/running-the-project.md)

### 4. Subir o Banco de Dados com Docker

```bash
docker compose up -d
```

Isso inicia um container PostgreSQL 16 com as credenciais padrão de desenvolvimento.

### 5. Executar Migrations do Banco de Dados

Para criar as tabelas necessárias:

```bash
yarn db:migrate
```

---

## 🏃 Executando o Projeto

### Modo de Desenvolvimento com Firebase Emulator (recomendado)

**Terminal único** — sobe Postgres + emuladores de Auth e Functions (Docker) e o backend:

```bash
yarn start:local
```

Ou em dois passos:

```bash
yarn docker:up
yarn start:emulator
```

O servidor inicia em [http://localhost:3000](http://localhost:3000) e a UI do emulador em [http://localhost:4000](http://localhost:4000).

O container executa o equivalente a `firebase emulators:start --only functions,auth` na raiz do projeto. Não é necessário instalar a Firebase CLI na máquina. A Functions API fica disponível em [http://127.0.0.1:5001/demo-goeat/us-central1/api](http://127.0.0.1:5001/demo-goeat/us-central1/api).

> Fallback sem Docker: `yarn firebase:emulator` em um terminal e `yarn start:emulator` em outro (requer Firebase CLI).

### Modo de Desenvolvimento Simples (sem Firebase Emulator)

```bash
yarn start:dev
```

## 🔥 Deploy para Firebase Functions

Este repositório já está preparado para deploy como Cloud Functions (1st gen) com uma função HTTP chamada `api`.

**Documentação completa:** [docs/firebase-deploy.md](docs/firebase-deploy.md)

### Quick start

```bash
# 1. Fazer login e conectar o projeto Firebase
firebase login
firebase use --add

# 2. Build da aplicação
yarn build

# 3. Deploy das Functions
yarn firebase:deploy
```

---

## 📚 Documentação

Documentação detalhada na pasta [docs/](docs/):

- **[local-development.md](docs/local-development.md)** — Setup completo para desenvolvimento local com Docker, PostgreSQL e Firebase Emulator
- **[firebase-auth.md](docs/firebase-auth.md)** — Guia detalhado de autenticação com Firebase (emulador e produção)
- **[firebase-auth-migration.md](docs/firebase-auth-migration.md)** — Contexto histórico da migração para Firebase Auth
- **[firebase-deploy.md](docs/firebase-deploy.md)** — Guia completo para fazer deploy no Firebase Cloud Functions

---

## 🗃️ Gerenciamento do Banco de Dados

Este projeto utiliza o Sequelize CLI para gerenciar migrations. Comandos principais:

```bash
npm run db:migrate              # Executar todas as migrations pendentes
npm run db:migrate:undo         # Reverter a última migration
npm run db:migration:create NAME # Criar uma nova migration
npm run db:seed                 # Executar seeds (se houver)
```

Para detalhes completos, consulte [MIGRATIONS.md](MIGRATIONS.md).

---

## 📁 Estrutura do Projeto

```text
docs/
├── local-development.md        # Setup local com Docker + Firebase Emulator
├── firebase-auth.md            # Autenticação com Firebase
├── firebase-auth-migration.md  # Contexto da migração para Firebase Auth
└── firebase-deploy.md          # Deploy para Firebase Cloud Functions

src/
├── lib/                 # Infraestrutura, banco de dados (migrations, config)
│   ├── infra/
│   │   ├── database/    # Migrations, models Sequelize
│   │   └── firebase/    # Bootstrap Firebase Admin
│   └── ...
├── modules/             # Módulos de negócio (auth, menu, restaurants, etc)
│   ├── auth/            # Autenticação e guarda de rotas
│   ├── menu/            # Gerenciamento de menus
│   └── ...
├── types/               # Definições de tipos TypeScript
├── main.ts              # Ponto de entrada NestJS
├── firebase.ts          # Entrypoint Firebase Cloud Functions
└── app.module.ts        # Módulo raiz
```

## 🧪 Testes

```bash
# Testes unit\u00e1rios
yarn test

# Testes com coverage
yarn test:cov

# Testes de integração (requer banco rodando)
yarn test:integration

# Testes e2e
yarn test:e2e
```

## 🔍 Qualidade de C\u00f3digo

```bash
# Linter com auto-fix
yarn lint

# Type checking
yarn typecheck

# Detectar ciclos de dependência
yarn check:circular

# Executar todas as verificações
yarn check
```

## 📖 Outros Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Docker Documentation](https://docs.docker.com/)
