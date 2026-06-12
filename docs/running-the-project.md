# EXECUTANDO O PROJETO (Guia rápido para gen z)

## Pré-requisitos

- Node.js 22
- Docker (com Docker Compose)
- Firebase CLI (`npm install -g firebase-tools` e `firebase login`)

## Configuração

```bash
# Instalar dependências
yarn install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar PostgreSQL
docker compose up -d

# Executar migrações
yarn db:migrate
```

## Início Rápido

1. **Inicie o backend com o Firebase Emulator:**

   ```bash
   npm run start:local:firebase
   ```

2. **Encontre a URL da API no terminal**

   Quando os serviços iniciarem, você verá a URL da API impressa no terminal. O padrão é:

   ```
   http://127.0.0.1:5001/demo-goeat/us-central1/api
   ```

3. **Visualize os logs**

   Abra seu navegador e acesse:

   ```
   http://127.0.0.1:4000/logs
   ```

# Usando banco de dados de produção e Firebase de produção

Copie o arquivo disponível na documentação do confluence, esse arquivo é confidencial:

[Obtendo o arquivo de credenciais](https://projetorestaurantes.atlassian.net/wiki/spaces/APP/pages/108953601/Autentica+o#Obtendo-o-arquivo-de-credenciais)

Remova as variáveis de ambiente referente ao emulador: `EMULATOR_HOST` e atualize `DATABASE_URL` para o banco de dados desejado.

# EXPLICAÇÃO DETALHADA (Explicação completa)

# Guia de Configuração do Firebase Emulator

Este guia fornece instruções passo a passo para executar o backend com a **Suite de Emuladores do Firebase**.

## Visão Geral

Ao executar com o Firebase Emulator, você obtém:

| Componente                  | Tecnologia                    | Porta | URL                                              |
| --------------------------- | ----------------------------- | ----- | ------------------------------------------------ |
| Firebase Auth Emulator      | Firebase Auth Emulator        | 9099  | http://localhost:9099                            |
| Firebase Functions          | Firebase Functions Emulator   | 5001  | http://127.0.0.1:5001/demo-goeat/us-central1/api |
| Emulator UI                 | Firebase Emulator Suite UI    | 4000  | http://localhost:4000                            |
| Backend API (via Functions) | NestJS via Firebase Functions | 5001  | http://127.0.0.1:5001/demo-goeat/us-central1/api |
| Banco de Dados              | Docker + PostgreSQL 16        | 5432  | localhost:5432                                   |

---

## Pré-requisitos

- [Node.js 22](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop) (com Docker Compose)
- Firebase CLI instalado e autenticado:
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

---

## Passo 1: Instalar Dependências

```bash
yarn install
```

---

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Configure as seguintes variáveis para o Firebase Emulator:

```env
NODE_ENV=development
PORT=3000

# Banco de dados (Docker)
DATABASE_URL=postgresql://admin:goeat-admin@localhost:5432/goeat_db

# Firebase Auth Emulator
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat

# Storage (opcional para desenvolvimento local)
UPLOADS_PATH=./uploads
```

---

## Passo 3: Iniciar o Banco de Dados PostgreSQL

```bash
docker compose up -d
```

Verifique se o container está rodando:

```bash
docker compose ps
```

Você deve ver `goeat-postgres` com status `healthy`.

### Executar Migrações do Banco de Dados

```bash
yarn db:migrate
```

Isso cria todas as tabelas necessárias em sua instância local do PostgreSQL.

---

## Passo 4: Iniciar a Suite de Emuladores do Firebase

**No Terminal 1**, inicie a Suite de Emuladores do Firebase:

```bash
yarn firebase:emulator
```

Este comando:

- Inicia o **Firebase Auth Emulator** na porta `9099`
- Inicia o **Firebase Functions Emulator** na porta `5001`
- Inicia a **Emulator UI** na porta `4000`

Você deve ver uma saída similar a:

```
✔  functions[demo-goeat-us-central1]: http function initialized (http://127.0.0.1:5001/demo-goeat/us-central1/api)
✔  Auth Emulator started at http://localhost:9099
✔  Emulator UI started at http://localhost:4000
```

---

## Passo 5: Iniciar a Aplicação Backend

**No Terminal 2**, inicie o backend NestJS com configuração de emulator:

```bash
yarn start:emulator
```

Isso inicia a aplicação com:

- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` (conecta ao Auth Emulator)
- flag `--watch` habilitada (hot-reload ao salvar arquivos)
- Ouvindo na porta `3000`

Saída esperada:

```
[Nest] 12345 - 01/15/2026, 10:30:45 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 01/15/2026, 10:30:46 AM     LOG [InstanceLoader] AppModule dependencies initialized +123ms
[Nest] 12345 - 01/15/2026, 10:30:46 AM     LOG [RoutesResolver] AppModule routes registered...
[Nest] 12345 - 01/15/2026, 10:30:46 AM     LOG [NestApplication] Nest application successfully started +45ms
```

---

## Passo 6: Verificar se Tudo Está Funcionando

### Verificar Emulator UI

Abra seu navegador e acesse:

- **Dashboard da Suite de Emuladores**: http://localhost:4000
- **Auth Emulator**: http://localhost:4000/auth

Você pode criar usuários de teste na Emulator UI para testes.

### Testar a API

A API está disponível em: **http://127.0.0.1:5001/demo-goeat/us-central1/api**

Teste um endpoint público:

```bash
curl http://127.0.0.1:5001/demo-goeat/us-central1/api/health
```

Ou teste com o servidor local na porta 3000:

```bash
curl http://localhost:3000/health
```

### Testar Autenticação

1. Crie um usuário de teste na Firebase Auth Emulator UI (http://localhost:4000/auth)
2. Obtenha o token ID do usuário da Emulator UI
3. Teste um endpoint protegido:

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <ID_TOKEN_FROM_EMULATOR>"
```

---

## Entendendo as URLs da API

O backend API é implementado como uma Cloud Function do Firebase. Você pode acessá-lo de duas formas:

### Método 1: URL Direta do Firebase Functions

```
http://127.0.0.1:5001/demo-goeat/us-central1/api
```

- **Projeto**: `demo-goeat`
- **Região**: `us-central1`
- **Função**: `api`
- **Porta**: `5001` (Firebase Functions Emulator)

### Método 2: Servidor NestJS Local (para desenvolvimento)

```
http://localhost:3000
```

- Acesso direto à aplicação NestJS rodando localmente
- Mais conveniente para desenvolvimento com hot-reload
- Porta `3000`

---

## Comandos Úteis

### Iniciar Ambos os Serviços (Uma Linha)

```bash
npm run start:local:firebase
```

Executa `firebase:emulator` e `start:emulator` em paralelo (roda em background).

### Parar Serviços

```bash
# Parar Firebase Emulator
# Pressione Ctrl+C no Terminal 1

# Parar Backend NestJS
# Pressione Ctrl+C no Terminal 2

# Parar containers Docker
docker compose down
```

### Visualizar Logs do Docker

```bash
docker compose logs -f
```

### Visualizar Logs do Firebase Emulator

No dashboard da Emulator UI (http://localhost:4000), você pode visualizar:

- Logs de Auth
- Invocações de funções
- Métricas de performance

### Reiniciar Tudo do Zero

```bash
# Parar e remover containers
docker compose down -v

# Iniciar fresco
docker compose up -d
yarn db:migrate
yarn firebase:emulator
# (em outro terminal)
yarn start:emulator
```

---

## Fluxo de Desenvolvimento

O backend inclui hot-reload, então:

1. Edite um arquivo TypeScript em `src/`
2. NestJS recompila automaticamente (modo watch habilitado)
3. Backend reinicia em alguns segundos
4. Sem necessidade de reiniciar serviços manualmente

### Debuggando

Para debugar TypeScript:

```bash
yarn start:debug
```

Isso habilita Node Inspector. Conecte com o debugger do seu IDE em `127.0.0.1:9229`.

---

## Referência de Variáveis de Ambiente

| Variável                      | Propósito                            | Exemplo            |
| ----------------------------- | ------------------------------------ | ------------------ |
| `NODE_ENV`                    | Modo de ambiente                     | `development`      |
| `PORT`                        | Porta do servidor NestJS             | `3000`             |
| `DATABASE_URL`                | Conexão PostgreSQL                   | `postgresql://...` |
| `FIREBASE_AUTH_EMULATOR_HOST` | Endereço do Firebase Auth Emulator   | `localhost:9099`   |
| `EMULATOR_PROJECT_ID`         | ID do projeto Firebase para emulator | `demo-goeat`       |
| `UPLOADS_PATH`                | Diretório para uploads de arquivos   | `./uploads`        |

---

## Resolução de Problemas

### Porta do Firebase Emulator Já em Uso

Se a porta `5001` já está em uso:

```bash
# Encontrar processo usando porta 5001
lsof -i :5001

# Matar o processo
kill -9 <PID>
```

### Conexão com Banco de Dados Recusada

```bash
# Verificar se o container Docker está rodando
docker compose ps

# Se não estiver rodando, inicie-o
docker compose up -d

# Se ainda não conectar, reinicie
docker compose down -v
docker compose up -d
yarn db:migrate
```

### Auth Emulator Não Encontrado

Certifique-se de que `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` está configurado e Firebase Emulator está rodando:

```bash
# Verificar se Firebase Emulator está rodando na porta 9099
lsof -i :9099

# Se não estiver, reinicie-o
yarn firebase:emulator
```

### Hot Reload Não Funcionando

Isso é normal durante a compilação. Aguarde 3-5 segundos para NestJS recompilar.

Se arquivos não estão sendo detectados:

1. Salve o arquivo explicitamente (Cmd+S / Ctrl+S)
2. Verifique os erros de compilação no terminal
3. Reinicie o backend: `Ctrl+C` e execute `yarn start:emulator` novamente

### Falha na Verificação de Token

Certifique-se de que:

1. O token foi gerado no Firebase Auth Emulator (http://localhost:4000/auth)
2. `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` está configurado no seu `.env`
3. O middleware de autenticação está configurado para usar o emulator

---

## Testando Contra o Backend

### Testes de Integração

```bash
yarn test:integration
```

Isso executa testes de integração contra o Firebase Auth emulado e PostgreSQL local.

### Testes E2E

```bash
yarn test:e2e
```

---

## Próximos Passos

- Leia [Guia de Implantação do Firebase](./firebase-deploy.md) para entender implantação em produção
- Verifique [Guia de Desenvolvimento Local](./local-development.md) para desenvolvimento sem Firebase functions
- Revise [Referência de API](../harness/menu/api-reference.md) para endpoints disponíveis
