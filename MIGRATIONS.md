# 🗃️ Guia de Migrations - GoEat Backend

## 📋 Comandos Disponíveis

### Executar todas as migrations pendentes
```bash
npm run db:migrate
```
Este comando cria todas as tabelas no banco de dados do Supabase que ainda não foram criadas.

### Reverter a última migration
```bash
npm run db:migrate:undo
```
Desfaz a última migration executada (útil se algo der errado).

### Reverter todas as migrations
```bash
npm run db:migrate:undo:all
```
⚠️ **CUIDADO**: Remove TODAS as tabelas do banco de dados!

### Criar uma nova migration
```bash
npm run db:migration:create nome-da-migration
```
Gera um arquivo de migration em branco para você editar.

## 🏗️ Estrutura das Tabelas Criadas

As seguintes tabelas foram criadas no Supabase na ordem correta:

1. ✅ **user** - Usuários do sistema
2. ✅ **food_types** - Tipos de comida (Italiana, Japonesa, etc)
3. ✅ **place_types** - Tipos de estabelecimento (Restaurante, Café, etc)
4. ✅ **restaurants** - Restaurantes cadastrados
5. ✅ **reviews** - Avaliações dos usuários
6. ✅ **profile_mapping** - Perfil de preferências do usuário
7. ✅ **profile_mapping_food_type** - Relação perfil ↔ tipos de comida
8. ✅ **profile_mapping_place_type** - Relação perfil ↔ tipos de local

## 🔍 Como Verificar no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **GoEat**
3. No menu lateral, clique em **Table Editor**
4. Você verá todas as 8 tabelas listadas acima + **SequelizeMeta** (tabela de controle)

## 📊 Tabela SequelizeMeta

O Sequelize cria automaticamente uma tabela chamada `SequelizeMeta` que registra quais migrations já foram executadas. **NÃO delete esta tabela!**

## 🔄 Fluxo de Trabalho

### Ao atualizar o código do repositório:
```bash
# 1. Atualizar dependências
npm install

# 2. Executar novas migrations
npm run db:migrate
```

### Ao criar uma nova tabela:
```bash
# 1. Criar arquivo de migration manualmente ou gerar um template
npm run db:migration:create create-nome-tabela

# 2. Editar o arquivo gerado em src/lib/infra/database/migrations/

# 3. Executar a migration
npm run db:migrate
```

## ⚙️ Configuração

- **Arquivo de config**: `src/lib/infra/database/sequelize-cli.config.js`
- **Pasta de migrations**: `src/lib/infra/database/migrations/`
- **Variável de ambiente**: `DATABASE_URL` (no arquivo `.env`)

## 🚨 Troubleshooting

### Erro de conexão
- Verifique se o `DATABASE_URL` em `.env` está correto
- Confirme se o IP do seu computador está autorizado no Supabase

### Migration já foi executada
- Use `npm run db:migrate:undo` para reverter
- Ou ajuste manualmente a tabela `SequelizeMeta`

### Tabela já existe
- O Sequelize detecta automaticamente e não executa novamente
- Se precisar recriar, use `db:migrate:undo` primeiro

## 📝 Boas Práticas

✅ **SEMPRE** teste localmente antes de executar em produção  
✅ **NUNCA** edite migrations já executadas em produção  
✅ **SEMPRE** versione as migrations no Git  
✅ **CRIE** uma nova migration para cada mudança no schema  
✅ **IMPLEMENTE** sempre o método `down` para rollback  

## 🎯 Próximos Passos

Após executar as migrations:
1. ✅ Verifique as tabelas no Supabase Dashboard
2. ✅ Configure os models no NestJS para usar essas tabelas
3. ✅ Crie seeders se precisar popular dados iniciais
4. ✅ Teste a conexão com a aplicação
