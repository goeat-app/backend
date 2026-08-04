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

- Docker com Docker Compose (recomendado)
- Ou Firebase CLI instalada globalmente (fallback manual):
  ```bash
  npm install -g firebase-tools
  ```

### Executando o emulador

**Opção A — Docker (recomendado)**

```bash
yarn docker:up
yarn start:emulator
```

Isso sobe o emulador em `localhost:9099` e a Emulator UI em `localhost:4000`.
Ou tudo de uma vez:

```bash
yarn start:local
```

**Opção B — Firebase CLI no host**

```bash
yarn firebase:emulator   # terminal 1
yarn start:emulator      # terminal 2
```

Configure `AUTH_EMULATOR_HOST=localhost:9099` no `.env`. O
`firebase-admin` lê essa variável e redireciona as chamadas de Auth para o
emulador.

### Variáveis de ambiente do emulador

| Variável                      | Valor                 | Observação                                   |
| ----------------------------- | --------------------- | -------------------------------------------- |
| `AUTH_EMULATOR_HOST` | `localhost:9099`      | Lida automaticamente pelo SDK firebase-admin |
| `EMULATOR_PROJECT_ID`         | `demo-goeat` (padrão) | Usada apenas quando o emulador está ativo    |

Você também pode exportá-las no shell ou adicioná-las a um arquivo `.env.local`
(não versionado).

### Persistência do emulador

No Docker, usuários são persistidos automaticamente no volume
`firebase_emulator_data` (import/export no startup/shutdown do container).

Para persistência manual com Firebase CLI no host:

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

---

## Opção 2 — Projeto Firebase real

Para rodar o backend apontado para o projeto Firebase de verdade (por exemplo,
para testar integração com o app mobile ou validar o ambiente de staging), é
necessário um arquivo de service account com permissões de Admin.

### Obtendo o arquivo de credenciais

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. **Project Settings** (engrenagem) → **Service Accounts**
4. **Generate new private key**
5. Salve o arquivo em `firebase-service-account.json` na raiz do backend (NÃO faça commit!)

### Configurar variáveis de ambiente

No seu `.env` (para desenvolvimento) ou no Firebase Runtime Environment (para produção):

```
firebase-service-account.json
```

> **Atenção:** esse arquivo contém credenciais privadas. Ele já está no
> `.gitignore` — **nunca o comite no repositório**.

### Iniciando o backend

Com o arquivo de credenciais no lugar, inicie normalmente:

```bash
yarn start:dev
```

O bootstrap (`src/lib/infra/firebase/firebase-admin.bootstrap.ts`) detecta
automaticamente o arquivo e o usa para inicializar o `firebase-admin`. Nenhuma
variável de ambiente adicional é necessária.

---

## Como o bootstrap decide qual modo usar

```
AUTH_EMULATOR_HOST definida?
  └─ sim → initializeApp({ projectId }) — sem credenciais, aponta para o emulador
  └─ não → firebase-service-account.json existe na raiz?
              └─ sim → initializeApp com as credenciais do arquivo
              └─ não → initializeApp() — usa GOOGLE_APPLICATION_CREDENTIALS (produção)
```
