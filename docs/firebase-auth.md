# Autenticação com Firebase

O backend usa o `firebase-admin` SDK para verificar tokens de Auth, criar
usuários e emitir tokens customizados. Há duas formas de configurar a
autenticação dependendo do ambiente:

| Modo                 | Quando usar                                   |
| -------------------- | --------------------------------------------- |
| **Emulador local**   | Desenvolvimento do dia-a-dia, sem credenciais |
| **Projeto Firebase** | Integração com o ambiente real (produção)     |

---

## Opção 1 — Emulador local (recomendado para dev)

Use o Firebase Auth Emulator para desenvolver e testar fluxos de autenticação
localmente sem afetar o projeto Firebase de produção. Nenhuma credencial real é
necessária.

### Pré-requisitos

- Firebase CLI instalada globalmente:
  ```bash
  npm install -g firebase-tools
  ```
- Autenticado no Firebase:
  ```bash
  firebase login
  ```

### Executando o emulador

**Terminal 1** — inicia o emulador de Auth:

```bash
npm run emulators:auth
```

Isso sobe o emulador em `localhost:9099` e a Emulator UI em `localhost:4000`.
A UI permite visualizar e gerenciar os usuários emulados.

**Terminal 2** — sobe o backend apontado para o emulador:

```bash
npm run start:emulator
```

Esse script define `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` e inicia o
NestJS em modo watch. O `firebase-admin` lê essa variável automaticamente e
redireciona todas as chamadas de Auth para o emulador.

### Variáveis de ambiente do emulador

| Variável                      | Valor                 | Observação                                   |
| ----------------------------- | --------------------- | -------------------------------------------- |
| `FIREBASE_AUTH_EMULATOR_HOST` | `localhost:9099`      | Lida automaticamente pelo SDK firebase-admin |
| `FIREBASE_PROJECT_ID`         | `demo-goeat` (padrão) | Usada apenas quando o emulador está ativo    |
| `FIREBASE_WEB_API_KEY`        | qualquer valor        | Usada por `/auth/login` e `/auth/refresh`    |

Você também pode exportá-las no shell ou adicioná-las a um arquivo `.env.local`
(não versionado) em vez de usar o script `start:emulator`.

### Persistência do emulador

Por padrão o estado do emulador é resetado a cada reinicialização. Para persistir
usuários entre reinicializações, use as flags `--import` / `--export-on-exit`:

```bash
firebase emulators:start --only auth \
  --import=./emulator-data \
  --export-on-exit=./emulator-data
```

### URLs úteis

| Serviço        | URL                        |
| -------------- | -------------------------- |
| Auth REST API  | http://localhost:9099      |
| Emulator UI    | http://localhost:4000      |
| Aba Auth na UI | http://localhost:4000/auth |

### Atenção

- Tokens emitidos pelo emulador **não** são válidos no Firebase de produção, e
  vice-versa. Nunca misture tokens do emulador com os de produção.
- O project ID `demo-goeat` é um placeholder local. Ele não precisa corresponder
  a nenhum projeto Firebase real ao usar o emulador.
- Os endpoints backend `POST /auth/login` e `POST /auth/refresh` usam a API REST
  do Firebase Auth e exigem `FIREBASE_WEB_API_KEY` (em emulador, qualquer string).

---

## Opção 2 — Projeto Firebase real

Para rodar o backend apontado para o projeto Firebase de verdade (por exemplo,
para testar integração com o app mobile ou validar o ambiente de staging), é
necessário um arquivo de service account com permissões de Admin.

### Obtendo o arquivo de credenciais

> **TODO:** adicionar aqui o link para download do `firebase-service-account.json`
> quando for disponibilizado.

Após obter o arquivo, coloque-o na raiz do projeto com o nome exato:

```
firebase-service-account.json
```

> **Atenção:** esse arquivo contém credenciais privadas. Ele já está no
> `.gitignore` — **nunca o comite no repositório**.

### Iniciando o backend

Com o arquivo de credenciais no lugar, inicie normalmente:

```bash
npm run start:dev
```

O bootstrap (`src/lib/infra/firebase/firebase-admin.bootstrap.ts`) detecta
automaticamente o arquivo e o usa para inicializar o `firebase-admin`. Nenhuma
variável de ambiente adicional é necessária.

---

## Como o bootstrap decide qual modo usar

```
FIREBASE_AUTH_EMULATOR_HOST definida?
  └─ sim → initializeApp({ projectId }) — sem credenciais, aponta para o emulador
  └─ não → firebase-service-account.json existe na raiz?
              └─ sim → initializeApp com as credenciais do arquivo
              └─ não → initializeApp() — usa GOOGLE_APPLICATION_CREDENTIALS (produção)
```
