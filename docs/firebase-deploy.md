# Deploy para Firebase Functions

Este guia descreve o fluxo recomendado para publicar o backend NestJS no Firebase Cloud Functions (2nd gen).

## Pré-requisitos

- Node.js 20+
- Yarn
- Firebase CLI instalada:

```bash
npm install -g firebase-tools
```

- Conta com acesso ao projeto Firebase (Owner ou Editor)

## Estrutura já preparada no projeto

- Função HTTP exportada como `api` no entrypoint Firebase.
- Configuração de deploy em `firebase.json`.
- Scripts no `package.json`:
  - `yarn firebase:serve`
  - `yarn firebase:deploy`

## 1. Login no Firebase

```bash
firebase login
```

## 2. Vincular o repositório ao projeto Firebase

No diretório raiz do backend:

```bash
firebase use --add
```

Selecione o Project ID correto e defina um alias (exemplo: `dev` ou `prod`).

## 3. Validar build local

```bash
yarn build
```

## 4. Deploy das Functions

```bash
yarn firebase:deploy
```

## 5. Executar localmente com emulator (opcional)

```bash
yarn firebase:serve
```

## Variáveis de ambiente

Este backend usa variáveis no arquivo `.env`. Para produção no Firebase, configure as variáveis no ambiente de execução antes do go-live e valide o comportamento em ambiente de testes.

## Troubleshooting rápido

### Erro de autenticação/permissão

- Confirme o usuário logado com `firebase login:list`.
- Verifique se sua conta tem permissão no projeto.

### Deploy falhando por build

- Rode `yarn build` localmente para ver erros de TypeScript.
- Corrija os erros e tente novamente.

### Projeto incorreto selecionado

- Verifique o alias ativo com:

```bash
firebase use
```

- Troque para o alias correto:

```bash
firebase use <alias>
```
