# Migração para Firebase Auth

Este documento explica a troca da autenticação totalmente self-service baseada em JWT para um modelo em que o Firebase emite os tokens e o backend apenas os valida nas rotas protegidas.

## Por que essa mudança

O modelo anterior de autenticação no backend misturava várias responsabilidades:

- emissão e renovação de JWT pelo backend
- gerenciamento local de usuários como fonte principal de identidade

Essa migração foi uma decisão estratégica para adotar um serviço mais gerenciado e simples de operar, com o Firebase como provedor de identidade e o backend como ponto de autorização e vinculação do usuário interno.

Ela também ajuda a centralizar a gestão de login com Google Auth e a aproveitar as camadas de validação e segurança que o Firebase já oferece.

Os principais objetivos foram:

- centralizar a gestão de Google Auth no Firebase
- aproveitar a validação de token e as camadas de segurança já fornecidas pelo Firebase
- tornar o primeiro login determinístico

## O que mudou

### Autenticação no backend

- As rotas protegidas agora exigem `Authorization: Bearer <firebase-id-token>`.
- O backend valida o token com `firebase-admin`.
- O guard de autenticação anexa o usuário interno na request para os controllers downstream.
- Tokens ausentes ou malformados retornam `401 Unauthorized`.
- Tokens expirados retornam `401 Token expired`.
- Problemas de serviço/inicialização do Firebase retornam `503 Auth service unavailable`.

Código relevante:

- [src/modules/auth/infra/firebase/firebase-auth.guard.ts](../src/modules/auth/infra/firebase/firebase-auth.guard.ts)
- [src/modules/auth/app/services/auth.service.ts](../src/modules/auth/app/services/auth.service.ts)

### Modelo de usuário interno

- A tabela `user` agora possui a coluna `firebase_uid`, nullable e única.
- O backend resolve usuários internos primeiro por `firebase_uid`.
- Se não encontrar por `firebase_uid`, o backend pode vincular ou provisionar o usuário por e-mail.
- Race conditions no primeiro login são tratadas relendo a linha após violação de unique constraint.

Código relevante:

- [src/lib/infra/database/migrations/20260529120000-add-firebase-uid-to-user.js](../src/lib/infra/database/migrations/20260529120000-add-firebase-uid-to-user.js)
- [src/modules/auth/infra/database/user.model.ts](../src/modules/auth/infra/database/user.model.ts)
- [src/modules/auth/infra/repositories/user.repository.ts](../src/modules/auth/infra/repositories/user.repository.ts)

### Fluxo de autenticação dos clients

- Clients agora autentica usuários diretamente com Firebase via e-mail/senha ou Google.
- Clients envia Firebase ID tokens atualizados para o backend nas requisições protegidas.
- O backend não precisa mais de refresh de JWT ou tokens de sessão emitidos pelo backend para chamadas protegidas. O estado final é: Firebase emite, backend valida.

## Novo comportamento de login e provisionamento

1. O usuário faz login no Client com Firebase.
2. O Client obtém um Firebase ID token.
3. O backend valida o token.
4. O backend tenta resolver o usuário interno por `firebase_uid`.
5. Se não encontrar e o token tiver claim de e-mail, o backend vincula ou provisiona um usuário interno.
6. O backend retorna a identidade interna para os controllers downstream.

Regras de provisionamento:

- Se o token não tiver claim de e-mail, a requisição é rejeitada com `403 Email-based identity required.`
- Se o e-mail estiver verificado e já existir um usuário interno por e-mail, o backend vincula o Firebase UID a esse usuário.
- Se o e-mail não estiver verificado, o backend não faz o vínculo com o usuário existente e cria um novo registro interno sem vínculo.
- O display name só é definido no momento da criação.
- Se o Firebase não fornecer display name, o backend usa a parte do e-mail antes do `@`.

## Desenvolvimento local

O backend consegue inicializar o Firebase Admin de duas formas seguras no desenvolvimento local:

1. `GOOGLE_APPLICATION_CREDENTIALS=/caminho/absoluto/para/service-account.json`
2. Um arquivo chamado `firebase-service-account.json` na raiz do backend

Se nenhuma das opções estiver presente, o Firebase Admin cai para as credenciais padrão da aplicação.

Para testes de integração, o backend também oferece um modo somente para testes:

- definir `ALLOW_TEST_FIREBASE_TOKENS=true`
- subir o backend em uma porta dedicada
- apontar `API_BASE_URL` para esse backend ao executar a suíte de integração

## Arquivos mais impactados pela migração

- [src/modules/auth/infra/controllers/auth.controller.ts](../src/modules/auth/infra/controllers/auth.controller.ts)
- [src/modules/auth/auth.module.ts](../src/modules/auth/auth.module.ts)
- [src/modules/restaurant-access/infra/controllers/my-restaurants.controller.ts](../src/modules/restaurant-access/infra/controllers/my-restaurants.controller.ts)
- [src/modules/restaurant-access/infra/controllers/restaurant-access.controller.ts](../src/modules/restaurant-access/infra/controllers/restaurant-access.controller.ts)
- [src/modules/restaurant-images/infra/controllers/restaurant-images.controller.ts](../src/modules/restaurant-images/infra/controllers/restaurant-images.controller.ts)
- [src/modules/restaurant-menu/infra/controllers/restaurant-menu.controller.ts](../src/modules/restaurant-menu/infra/controllers/restaurant-menu.controller.ts)
- [src/lib/infra/firebase/firebase-admin.bootstrap.ts](../src/lib/infra/firebase/firebase-admin.bootstrap.ts)
- [src/firebase.ts](../src/firebase.ts)
- [src/main.ts](../src/main.ts)

## Documentos relacionados

- [Configuração do Firebase Auth](firebase-auth.md)
- [Deploy no Firebase](firebase-deploy.md)
- [Desenvolvimento local](local-development.md)
