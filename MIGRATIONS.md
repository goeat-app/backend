# 🗃️ Guia de Migrations - GoEat Backend

## 📋 Comandos Disponíveis

### Executar todas as migrations pendentes

```bash
yarn db:migrate
```

Este comando cria todas as tabelas no banco de dados PostgreSQL (local ou produção) que ainda não foram criadas.

### Reverter a última migration

```bash
yarn db:migrate:undo
```

Desfaz a última migration executada (útil se algo der errado).

### Reverter todas as migrations

```bash
yarn db:migrate:undo:all
```

⚠️ **CUIDADO**: Remove TODAS as tabelas do banco de dados!

### Criar uma nova migration

```bash
yarn db:migration:create nome-da-migration
```

Gera um arquivo de migration em branco para você editar.

## 🏗️ Estrutura das Tabelas Criadas

As seguintes tabelas foram criadas na ordem correta:

1. ✅ **user** - Usuários do sistema
2. ✅ **food_types** - Tipos de comida (Italiana, Japonesa, etc)
3. ✅ **place_types** - Tipos de estabelecimento (Restaurante, Café, etc)
4. ✅ **restaurants** - Restaurantes cadastrados
5. ✅ **reviews** - Avaliações dos usuários
6. ✅ **profile_mapping** - Perfil de preferências do usuário
7. ✅ **profile_mapping_food_type** - Relação perfil ↔ tipos de comida
8. ✅ **profile_mapping_place_type** - Relação perfil ↔ tipos de local

## 🔍 Como Verificar o Estado das Migrations

### Em desenvolvimento local (Docker)

```bash
# Conectar ao container PostgreSQL
docker compose exec postgres psql -U admin -d goeat_db

# No psql, listar todas as migrations já executadas
SELECT * FROM "SequelizeMeta";

# Sair
\q
```

### Em produção

Depende de onde seu banco está hospedado. Se usar um PaaS como AWS RDS, Heroku, ou similar, use o cliente de banco fornecido pela plataforma.

## 📊 Tabela SequelizeMeta

O Sequelize CLI mantém o registro de todas as migrations executadas em uma tabela chamada `SequelizeMeta`. Você **não deve** editar ou deletar registros dessa tabela manualmente.

## 🔄 Fluxo de Desenvolvimento

### Primeiro setup local

```bash
# 1. Subir containers
docker compose up -d

# 2. Aguardar o banco estar saudável (veja logs se necessário)
docker compose logs postgres

# 3. Executar migrations
npm run db:migrate

# 4. Verificar se criou as tabelas
docker compose exec postgres psql -U admin -d goeat_db -c "SELECT * FROM \"SequelizeMeta\";"
```

### Ao adicionar uma nova feature com tabelas

```bash
# 1. Criar arquivo de migration
yarn db:migration:create adicionar-nova-tabela

# 2. Editar o arquivo gerado em `src/lib/infra/database/migrations/`

# 3. Testar localmente
yarn db:migrate

# 4. Se der erro, reverter
yarn db:migrate:undo

# 5. Corrigir e tentar novamente

# 6. Comitar o arquivo de migration junto com seu código
git add src/lib/infra/database/migrations/
```

### Ao fazer checkout de um branch com novas migrations

```bash
# Já tem a branch checada out

# 1. Aplicar todas as migrations pendentes
yarn db:migrate

# 2. Verificar se seu banco agora está com as novas tabelas
```

## ⚠️ Boas Práticas

- **Nunca** edite um arquivo de migration já commitado. Ao invés disso, crie uma nova migration que reverte/altera a anterior.
- **Sempre** teste suas migrations localmente antes de fazer push.
- **Nunca** use `db:migrate:undo:all` em produção sem verificar backups primeiro.
- Se fez alterações no `sequelize.config.json` ou em como conecta ao banco, certifique-se de que ambientes de dev e produção usam as mesmas migrações.

## 🚨 Recuperação de Erros

### Uma migration falhou em produção

1. Veja o erro em `SequelizeMeta` (a migration não deve estar listada)
2. Valide seu código de migration localmente
3. Corrija e crie uma nova migration com o nome representativo (ex: `fix-migration-xxx`)
4. Teste localmente completo
5. Deploy da nova migration

### Preciso desfazer a última migration

```bash
yarn db:migrate:undo
```

Isso desfaz a última migration e remove seu registro de `SequelizeMeta`.

O Sequelize cria automaticamente uma tabela chamada `SequelizeMeta` que registra quais migrations já foram executadas. **NÃO delete esta tabela!**

## 🔄 Fluxo de Trabalho

### Ao atualizar o código do repositório:

```bash
# 1. Atualizar dependências
yarn install

# 2. Executar novas migrations
yarn db:migrate
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
