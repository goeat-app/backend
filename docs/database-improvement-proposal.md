# 📊 Análise e Proposta de Melhoria do MER - GoEat

## 🔍 Estrutura Atual

### Problemas Identificados:

1. **❌ Redundância de Tabela**: `profile_mapping` é desnecessária
   - Serve apenas como intermediária entre `user` e as preferências
   - Adiciona complexidade sem valor semântico
   - Relação 1:1 com `user` poderia ser direta

2. **❌ Falta de Priorização**: Não há como saber qual é a preferência #1, #2 ou #3
   - As 3 comidas favoritas não têm ordem de preferência
   - Os 3 ambientes favoritos não têm ordem de preferência
   - Isso dificulta algoritmos de recomendação

3. **❌ Campo `id` desnecessário nas tabelas N:N**
   - `profile_mapping_food_type` e `profile_mapping_place_type` têm `id` UUID
   - Em tabelas de junção, a chave primária composta é suficiente
   - Desperdiça espaço e processamento

4. **❌ Nomenclatura inconsistente**:
   - `user` deveria ser `users` (plural)
   - `profile_mapping` é vago - deveria ser `user_preferences`

5. **❌ Falta de validação de quantidade**:
   - Não há constraint garantindo exatamente 3 tipos de comida
   - Não há constraint garantindo exatamente 3 tipos de ambiente

6. **❌ Falta de campos úteis**:
   - Sem campo para raio de busca preferido
   - Sem campo para horários preferidos (almoço/jantar)
   - Sem histórico de mudanças de preferências

---

## ✅ Proposta de Melhoria

### Estrutura Otimizada:

```
users (renomeado de 'user')
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR)
├── phone (VARCHAR, NULLABLE)
├── created_at
└── updated_at

user_preferences (substitui 'profile_mapping')
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id, UNIQUE) ⭐ Garante 1:1
├── min_budget (DECIMAL)
├── max_budget (DECIMAL)
├── preferred_radius_km (INTEGER, DEFAULT 5)
├── preferred_meal_time (ENUM: 'lunch', 'dinner', 'both')
├── is_onboarding_complete (BOOLEAN, DEFAULT false)
├── created_at
└── updated_at

user_food_preferences (substitui 'profile_mapping_food_type')
├── user_id (UUID, FK -> users.id, PK) ⭐ Chave composta
├── food_type_id (UUID, FK -> food_types.id, PK) ⭐ Chave composta
├── preference_rank (INTEGER, CHECK 1-3) ⭐ NOVO: ordem de preferência
├── created_at
└── CONSTRAINT: user pode ter no máximo 3 food_types

user_place_preferences (substitui 'profile_mapping_place_type')
├── user_id (UUID, FK -> users.id, PK) ⭐ Chave composta
├── place_type_id (UUID, FK -> place_types.id, PK) ⭐ Chave composta
├── preference_rank (INTEGER, CHECK 1-3) ⭐ NOVO: ordem de preferência
├── created_at
└── CONSTRAINT: user pode ter no máximo 3 place_types
```

---

## 🎯 Benefícios da Nova Estrutura

### 1. **Simplicidade**
- ✅ Elimina tabela intermediária desnecessária
- ✅ Relação direta `user` → `preferences`
- ✅ Menos JOINs nas queries

### 2. **Priorização**
- ✅ Campo `preference_rank` (1, 2, 3) indica ordem de importância
- ✅ Algoritmo de recomendação pode ponderar preferências
- ✅ UX pode mostrar "sua comida favorita é X"

### 3. **Performance**
- ✅ Chave primária composta em vez de UUID extra
- ✅ Menos índices necessários
- ✅ Queries mais rápidas

### 4. **Validação de Dados**
- ✅ CHECK constraints garantem exatamente 3 preferências
- ✅ UNIQUE constraint em `user_id` garante 1 perfil por usuário
- ✅ Impossível ter dados inconsistentes

### 5. **Extensibilidade**
- ✅ Fácil adicionar novos campos (raio, horário, etc.)
- ✅ Campo `is_onboarding_complete` para controle de fluxo
- ✅ Preparado para features futuras

---

## 📝 Exemplo de Queries

### Query Atual (Complexa):
```sql
SELECT u.*, pm.maxPrice, pm.minPrice, ft.name as food_type
FROM user u
JOIN profile_mapping pm ON u.id = pm.userId
JOIN profile_mapping_food_type pmft ON pm.id = pmft.profileMappingId
JOIN food_types ft ON pmft.foodTypeId = ft.id
WHERE u.id = ?
```

### Query Proposta (Simples):
```sql
SELECT u.*, up.max_budget, up.min_budget, 
       ft.name as food_type, ufp.preference_rank
FROM users u
JOIN user_preferences up ON u.id = up.user_id
JOIN user_food_preferences ufp ON u.id = ufp.user_id
JOIN food_types ft ON ufp.food_type_id = ft.id
WHERE u.id = ?
ORDER BY ufp.preference_rank
```

---

## 🚀 Implementação

### Opção 1: Migration Incremental (Recomendado para produção)
- Criar novas tabelas
- Migrar dados
- Depreciar tabelas antigas
- Remover após validação

### Opção 2: Reset Completo (Recomendado para desenvolvimento)
- Dropar tudo
- Criar estrutura nova
- Popular com dados de teste

---

## 📊 Comparação de Espaço

### Estrutura Atual (por usuário):
- `profile_mapping`: 1 registro (UUID + 2 DECIMALs + timestamps) ≈ 60 bytes
- `profile_mapping_food_type`: 3 registros × 60 bytes = 180 bytes
- `profile_mapping_place_type`: 3 registros × 60 bytes = 180 bytes
- **Total: ~420 bytes por usuário**

### Estrutura Proposta (por usuário):
- `user_preferences`: 1 registro ≈ 80 bytes
- `user_food_preferences`: 3 registros × 40 bytes = 120 bytes
- `user_place_preferences`: 3 registros × 40 bytes = 120 bytes
- **Total: ~320 bytes por usuário**

**Economia: ~24% de espaço** 🎉

---

## 🎨 Diagrama MER Proposto

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password        │
│ phone           │
└────────┬────────┘
         │ 1
         │
         │ 1
┌────────┴────────────────┐
│  user_preferences       │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK, UNIQUE)    │
│ min_budget              │
│ max_budget              │
│ preferred_radius_km     │
│ preferred_meal_time     │
│ is_onboarding_complete  │
└─────────────────────────┘

         ┌────────────────────────────┐
         │                            │
         │ N                          │ N
┌────────┴──────────────┐    ┌────────┴──────────────┐
│ user_food_preferences │    │ user_place_preferences│
├───────────────────────┤    ├───────────────────────┤
│ user_id (PK, FK)      │    │ user_id (PK, FK)      │
│ food_type_id (PK, FK) │    │ place_type_id (PK, FK)│
│ preference_rank (1-3) │    │ preference_rank (1-3) │
└───────┬───────────────┘    └───────┬───────────────┘
        │ N                          │ N
        │                            │
        │ 1                          │ 1
┌───────┴────────┐          ┌────────┴────────┐
│  food_types    │          │  place_types    │
├────────────────┤          ├─────────────────┤
│ id (PK)        │          │ id (PK)         │
│ name           │          │ name            │
│ tag_image      │          │ tag_image       │
└────────────────┘          └─────────────────┘
```

---

## 💡 Recomendações Adicionais

1. **Adicionar Soft Delete**: Campo `deleted_at` para auditoria
2. **Versionamento de Preferências**: Tabela de histórico para ML
3. **Índices Compostos**: Para queries de recomendação
4. **Triggers**: Validar exatamente 3 preferências
5. **Views Materializadas**: Para dashboards de analytics

---

Quer que eu implemente essa nova estrutura? 🚀
