# 🍽️ GoEat - Backend

Bem-vindo ao repositório do backend do **GoEat**, um sistema inteligente de recomendação de restaurantes. Este projeto foi desenvolvido utilizando **NestJS** e utiliza o **Supabase (PostgreSQL)** como banco de dados principal, com o **Sequelize** como ORM.

---

## 🚀 Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo para aplicações escaláveis.
- **[Sequelize](https://sequelize.org/)** - ORM para Node.js (PostgreSQL).
- **[Supabase](https://supabase.com/)** - Backend as a Service (PostgreSQL).
- **[Zod](https://zod.dev/)** - Validação de esquemas e tipos.
- **[JWT](https://jwt.io/)** - Autenticação segura via JSON Web Tokens.
- **TypeScript** - Superconjunto de JavaScript com tipagem estática.

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior recomendada)
- **Yarn**
- Uma conta no **Supabase** (ou um banco de dados PostgreSQL compatível)

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
Crie um arquivo `.env` na raiz do projeto e peça as variáveis de ambiente para o time.

### 4. Executar Migrations do Banco de Dados
Para criar as tabelas necessárias no seu banco de dados:
```bash
yarn db:migrate
```

---

## 🏃 Executando o Projeto

### Modo de Desenvolvimento (com Hot-Reload)
```bash
yarn start
```
O servidor iniciará em [http://localhost:3000](http://localhost:3000).

### Modo de Produção
```bash
yarn build
yarn start:prod
```

---

## 🗃️ Gerenciamento do Banco de Dados

Este projeto utiliza o Sequelize CLI para gerenciar migrations. Aqui estão os comandos principais:

- **Executar Migrations**: `yarn db:migrate`
- **Reverter Última Migration**: `yarn db:migrate:undo`
- **Criar Nova Migration**: `yarn db:migration:create nome-da-migration`

Para detalhes completos sobre a estrutura das tabelas, consulte o [MIGRATIONS.md](MIGRATIONS.md).

---

## 📁 Estrutura do Projeto

```text
src/
├── lib/               # Infraestrutura, banco de dados (migrations, config)
├── modules/           # Módulos de negócio (auth, ia, profile-mapping)
│   ├── auth/          # Autenticação e Autorização
│   ├── ia/            # Integração com Inteligência Artificial
│   └── profile-mapping/ # Mapeamento de perfis e preferências
├── types/             # Definições de tipos TypeScript
├── main.ts            # Ponto de entrada da aplicação
└── app.module.ts      # Módulo raiz
```

## 👥 Contato

Em caso de dúvidas ou sugestões, sinta-se à vontade para entrar em contato com a equipe de desenvolvimento.
