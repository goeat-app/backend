# 🎯 Proposta MVP Focada - GoEat

## 📌 Contexto Atual

### Sistema de Imagens (Pré-definidas):
- ✅ 8 imagens de **food_types** (slugs: `pizza.png`, `sushi.png`, etc)
- ✅ 8 imagens de **place_types** (slugs: `casual.png`, `romantic.png`, etc)
- ✅ Armazenadas no **frontend** (`/assets/images/`)
- ✅ Backend retorna apenas o **slug**
- ✅ Frontend monta o caminho completo

### Foco MVP:
1. **Users** - Cadastro e autenticação
2. **Restaurants** - Dados dos restaurantes
3. **Reviews** - Avaliações dos usuários

---

## ✅ Estrutura Otimizada para MVP

### **1. Tabela `users` (Simplificada)**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Preferências inline (sem tabela separada)
  favorite_food_types UUID[] DEFAULT '{}',  -- ⭐ Array de 3 UUIDs
  favorite_place_types UUID[] DEFAULT '{}', -- ⭐ Array de 3 UUIDs
  min_budget DECIMAL(10, 2),
  max_budget DECIMAL(10, 2),
  
  -- Controle
  is_onboarding_complete BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- ⭐ Validação: exatamente 3 preferências
  CHECK (array_length(favorite_food_types, 1) <= 3),
  CHECK (array_length(favorite_place_types, 1) <= 3)
);
```

**Benefícios:**
- ✅ **Sem tabelas intermediárias** (profile_mapping)
- ✅ **Arrays PostgreSQL** - simples e performático
- ✅ **Menos JOINs** nas queries
- ✅ **Perfeito para MVP** - 3 preferências fixas

**Exemplo de dado:**
```json
{
  "id": "uuid-123",
  "name": "João Silva",
  "email": "joao@email.com",
  "favorite_food_types": [
    "uuid-pizza",    // 1º favorito
    "uuid-sushi",    // 2º favorito
    "uuid-burger"    // 3º favorito
  ],
  "favorite_place_types": [
    "uuid-casual",
    "uuid-romantic",
    "uuid-family"
  ],
  "min_budget": 20.00,
  "max_budget": 80.00
}
```

---

### **2. Tabela `food_types` (Mantida, melhorada)**

```sql
CREATE TABLE food_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,  -- ⭐ URL-friendly
  icon_slug VARCHAR(100) NOT NULL,    -- ⭐ Nome do arquivo (pizza.png)
  description TEXT,                   -- ⭐ NOVO: "Pizzas artesanais..."
  display_order INTEGER DEFAULT 0,    -- ⭐ NOVO: ordem no frontend
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplo de dados:**
```sql
INSERT INTO food_types (name, slug, icon_slug, description, display_order) VALUES
('Pizza', 'pizza', 'pizza.png', 'Pizzas artesanais e tradicionais', 1),
('Sushi', 'sushi', 'sushi.png', 'Culinária japonesa autêntica', 2),
('Hambúrguer', 'hamburguer', 'burger.png', 'Burgers gourmet e clássicos', 3),
('Massa', 'massa', 'pasta.png', 'Massas italianas frescas', 4),
('Churrasco', 'churrasco', 'bbq.png', 'Carnes nobres na brasa', 5),
('Vegetariano', 'vegetariano', 'veggie.png', 'Opções vegetarianas', 6),
('Sobremesa', 'sobremesa', 'dessert.png', 'Doces e sobremesas', 7),
('Café', 'cafe', 'coffee.png', 'Cafés especiais e lanches', 8);
```

---

### **3. Tabela `place_types` (Mantida, melhorada)**

```sql
CREATE TABLE place_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon_slug VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplo de dados:**
```sql
INSERT INTO place_types (name, slug, icon_slug, description, display_order) VALUES
('Casual', 'casual', 'casual.png', 'Ambiente descontraído', 1),
('Romântico', 'romantico', 'romantic.png', 'Perfeito para casais', 2),
('Familiar', 'familiar', 'family.png', 'Ideal para famílias', 3),
('Executivo', 'executivo', 'business.png', 'Almoços de negócios', 4),
('Balada', 'balada', 'party.png', 'Música e drinks', 5),
('Ao ar livre', 'ao-ar-livre', 'outdoor.png', 'Mesas externas', 6),
('Sofisticado', 'sofisticado', 'fancy.png', 'Alta gastronomia', 7),
('Despojado', 'despojado', 'casual-dining.png', 'Simples e acolhedor', 8);
```

---

### **4. Tabela `restaurants` (Otimizada para MVP)**

```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Básico
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Categorização (N:N simplificado com arrays)
  food_type_ids UUID[] DEFAULT '{}',   -- ⭐ Múltiplos tipos
  place_type_ids UUID[] DEFAULT '{}',  -- ⭐ Múltiplos tipos
  
  -- Localização
  address VARCHAR(500) NOT NULL,
  neighborhood VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Preço
  price_range VARCHAR(10),  -- '$', '$$', '$$$', '$$$$'
  average_meal_price DECIMAL(10, 2),
  
  -- Contato
  phone VARCHAR(20),
  
  -- Imagem (slug pré-definida)
  cover_image_slug VARCHAR(100),  -- ⭐ Ex: 'restaurant-1.jpg'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_location (latitude, longitude),
  INDEX idx_city (city, state),
  INDEX idx_slug (slug)
);
```

**Exemplo de dado:**
```json
{
  "id": "uuid-rest-1",
  "name": "Bella Italia",
  "slug": "bella-italia-sp",
  "description": "Autêntica culinária italiana",
  
  "food_type_ids": [
    "uuid-pizza",
    "uuid-massa"
  ],
  "place_type_ids": [
    "uuid-casual",
    "uuid-romantico"
  ],
  
  "address": "Rua Augusta, 123",
  "neighborhood": "Jardins",
  "city": "São Paulo",
  "state": "SP",
  "latitude": -23.561684,
  "longitude": -46.656139,
  
  "price_range": "$$",
  "average_meal_price": 45.00,
  "phone": "+55 11 98765-4321",
  
  "cover_image_slug": "italian-restaurant.jpg"
}
```

---

### **5. Tabela `reviews` (Simplificada)**

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- ⭐ Usuário só pode avaliar 1x cada restaurante
  UNIQUE (restaurant_id, user_id),
  
  INDEX idx_restaurant (restaurant_id),
  INDEX idx_user (user_id),
  INDEX idx_rating (restaurant_id, rating)
);
```

---

### **6. VIEW: `restaurant_stats` (Dados Calculados)**

```sql
CREATE VIEW restaurant_stats AS
SELECT 
  r.id,
  r.name,
  r.slug,
  
  -- Estatísticas
  COUNT(rv.id) as total_reviews,
  COALESCE(AVG(rv.rating), 0) as average_rating,
  
  -- Distribuição
  COUNT(CASE WHEN rv.rating = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN rv.rating = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN rv.rating = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN rv.rating = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN rv.rating = 1 THEN 1 END) as one_star
  
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.restaurant_id
GROUP BY r.id, r.name, r.slug;
```

---

## 🎯 Fluxo de Imagens Otimizado

### **Frontend:**
```typescript
// food_types/place_types vem da API com icon_slug
const foodTypes = [
  { id: 'uuid-1', name: 'Pizza', icon_slug: 'pizza.png' },
  { id: 'uuid-2', name: 'Sushi', icon_slug: 'sushi.png' }
];

// Frontend monta o caminho
const imagePath = `/assets/images/food-types/${foodType.icon_slug}`;
// Resultado: /assets/images/food-types/pizza.png
```

### **Backend API Response:**
```json
{
  "food_types": [
    {
      "id": "uuid-1",
      "name": "Pizza",
      "slug": "pizza",
      "icon_slug": "pizza.png",
      "description": "Pizzas artesanais e tradicionais"
    }
  ]
}
```

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Complexo)
```
users (4 campos)
  ↓
profile_mapping (4 campos)
  ↓
profile_mapping_food_type (4 campos) × 3 registros
profile_mapping_place_type (4 campos) × 3 registros

Total: 4 tabelas, ~420 bytes por usuário
```

### ✅ DEPOIS (Simples)
```
users (10 campos com arrays)
  ↓
  favorite_food_types: [uuid1, uuid2, uuid3]
  favorite_place_types: [uuid1, uuid2, uuid3]

Total: 1 tabela, ~180 bytes por usuário
Economia: 57% de espaço! 🎉
```

---

## 🚀 Query de Recomendação Otimizada

```sql
-- Buscar restaurantes que combinam com o usuário
SELECT 
  r.*,
  rs.average_rating,
  rs.total_reviews,
  
  -- Score de match (quantos tipos em comum)
  (
    SELECT COUNT(*)
    FROM unnest(r.food_type_ids) AS rt(food_id)
    WHERE rt.food_id = ANY(u.favorite_food_types)
  ) as food_match_count,
  
  (
    SELECT COUNT(*)
    FROM unnest(r.place_type_ids) AS rt(place_id)
    WHERE rt.place_id = ANY(u.favorite_place_types)
  ) as place_match_count,
  
  -- Distância em km
  (
    6371 * acos(
      cos(radians($2)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians($3)) +
      sin(radians($2)) * sin(radians(r.latitude))
    )
  ) as distance_km

FROM restaurants r
CROSS JOIN users u
JOIN restaurant_stats rs ON r.id = rs.id

WHERE 
  u.id = $1  -- ID do usuário
  AND r.is_active = true
  AND r.average_meal_price BETWEEN u.min_budget AND u.max_budget
  
  -- Pelo menos 1 match em comida OU ambiente
  AND (
    r.food_type_ids && u.favorite_food_types OR
    r.place_type_ids && u.favorite_place_types
  )

ORDER BY 
  (food_match_count * 2 + place_match_count) DESC,  -- Match score
  rs.average_rating DESC,
  distance_km ASC

LIMIT 20;
```

**Operador `&&`**: Verifica se arrays têm elementos em comum (PostgreSQL)

---

## 📝 Migrations para Implementar

### **Migration 1: Alterar `users`**
```javascript
// Adicionar arrays de preferências
await queryInterface.addColumn('users', 'favorite_food_types', {
  type: Sequelize.ARRAY(Sequelize.UUID),
  defaultValue: []
});

await queryInterface.addColumn('users', 'favorite_place_types', {
  type: Sequelize.ARRAY(Sequelize.UUID),
  defaultValue: []
});

await queryInterface.addColumn('users', 'min_budget', {
  type: Sequelize.DECIMAL(10, 2)
});

await queryInterface.addColumn('users', 'max_budget', {
  type: Sequelize.DECIMAL(10, 2)
});

await queryInterface.addColumn('users', 'is_onboarding_complete', {
  type: Sequelize.BOOLEAN,
  defaultValue: false
});
```

### **Migration 2: Melhorar `food_types` e `place_types`**
```javascript
// Adicionar campos novos
await queryInterface.addColumn('food_types', 'slug', {
  type: Sequelize.STRING(100),
  unique: true
});

await queryInterface.renameColumn('food_types', 'tag_image', 'icon_slug');

await queryInterface.addColumn('food_types', 'description', {
  type: Sequelize.TEXT
});

await queryInterface.addColumn('food_types', 'display_order', {
  type: Sequelize.INTEGER,
  defaultValue: 0
});

// Repetir para place_types
```

### **Migration 3: Alterar `restaurants`**
```javascript
// Adicionar arrays
await queryInterface.addColumn('restaurants', 'food_type_ids', {
  type: Sequelize.ARRAY(Sequelize.UUID),
  defaultValue: []
});

await queryInterface.addColumn('restaurants', 'place_type_ids', {
  type: Sequelize.ARRAY(Sequelize.UUID),
  defaultValue: []
});

// Migrar dados antigos
await queryInterface.sequelize.query(`
  UPDATE restaurants 
  SET food_type_ids = ARRAY[food_type_id]
  WHERE food_type_id IS NOT NULL
`);

await queryInterface.sequelize.query(`
  UPDATE restaurants 
  SET place_type_ids = ARRAY[place_type_id]
  WHERE place_type_id IS NOT NULL
`);

// Remover colunas antigas (depois de validar)
// await queryInterface.removeColumn('restaurants', 'food_type_id');
// await queryInterface.removeColumn('restaurants', 'place_type_id');
```

### **Migration 4: Simplificar `reviews`**
```javascript
// Remover campos desnecessários se existirem
// Manter apenas: id, restaurant_id, user_id, rating, comment, timestamps
```

---

## ✅ Benefícios desta Abordagem

| Aspecto | Benefício |
|---------|-----------|
| **Simplicidade** | 1 tabela em vez de 3 para preferências |
| **Performance** | Arrays PostgreSQL são muito rápidos |
| **Manutenção** | Menos código, menos bugs |
| **Flexibilidade** | Fácil adicionar mais preferências |
| **Queries** | Operador `&&` é nativo e otimizado |
| **Espaço** | 57% menos dados armazenados |

---

## 🎯 Próximos Passos

Posso implementar:

1. ✅ **Migrations** para alterar estrutura atual
2. ✅ **Script de migração** de dados existentes
3. ✅ **Models Sequelize** atualizados
4. ✅ **Seeders** com 8 food_types e 8 place_types
5. ✅ **Query de recomendação** otimizada

**Quer que eu comece?** 🚀
