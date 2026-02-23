# 🏗️ Proposta de Arquitetura Escalável - GoEat MVP → Produção

## 🔍 Análise da Estrutura Atual de Restaurantes

### ❌ Problemas Críticos Identificados:

#### 1. **Relação 1:1 com Food/Place Types (LIMITANTE)**
```sql
restaurants
├── food_type_id (FK) ❌ UM ÚNICO tipo de comida
└── place_type_id (FK) ❌ UM ÚNICO tipo de ambiente
```

**Problema Real:**
- Um restaurante italiano que serve pizza E massa não pode ter ambos
- Um restaurante casual que também é romântico só pode ter 1 tag
- **Isso quebra o algoritmo de recomendação!**

#### 2. **Campos Calculados no Banco (Anti-pattern)**
```sql
├── average_rating (DECIMAL)  ❌ Deveria ser calculado
└── total_reviews (INTEGER)   ❌ Deveria ser COUNT()
```

**Problemas:**
- Dados podem ficar dessincronizados
- Precisa de triggers ou lógica manual para atualizar
- Dificulta auditoria e histórico

#### 3. **Imagens como String (Não Escalável)**
```sql
food_types.tag_image = "pizza.png"  ❌ Apenas 1 imagem
```

**Limitações:**
- Restaurante não pode ter múltiplas fotos
- Sem controle de qualidade/tamanho
- Sem CDN/otimização
- Sem ordem de exibição

#### 4. **Falta de Campos Essenciais**
- ❌ Sem horário de funcionamento
- ❌ Sem telefone/contato
- ❌ Sem website/redes sociais
- ❌ Sem descrição
- ❌ Sem informações de acessibilidade
- ❌ Sem faixa de preço (apenas média)

#### 5. **Sem Preparação para Integração**
- ❌ Sem campo para ID externo (Google Places, Yelp, etc.)
- ❌ Sem controle de fonte dos dados (mock vs real)
- ❌ Sem versionamento de dados

---

## ✅ Arquitetura Proposta: MVP Escalável

### 🎯 Princípios de Design:

1. **Flexibilidade**: Suportar múltiplos tipos/categorias
2. **Extensibilidade**: Fácil adicionar campos sem quebrar
3. **Integridade**: Dados calculados derivados, não armazenados
4. **Preparação**: Pronto para APIs externas
5. **Performance**: Índices e queries otimizadas

---

## 📊 Nova Estrutura de Tabelas

### **1. Tabela `restaurants` (Refatorada)**

```sql
CREATE TABLE restaurants (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,  -- ⭐ NOVO: URL amigável
  name VARCHAR(255) NOT NULL,
  
  -- Dados Básicos
  description TEXT,  -- ⭐ NOVO
  phone VARCHAR(20),  -- ⭐ NOVO
  email VARCHAR(255),  -- ⭐ NOVO
  website VARCHAR(500),  -- ⭐ NOVO
  
  -- Localização
  address VARCHAR(500) NOT NULL,
  address_complement VARCHAR(255),  -- ⭐ NOVO: apto, sala, etc
  neighborhood VARCHAR(255),  -- ⭐ NOVO
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,  -- ⭐ Sigla (SP, RJ)
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(2) DEFAULT 'BR',  -- ⭐ NOVO: ISO code
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Preços (Range em vez de média)
  price_range VARCHAR(10),  -- ⭐ NOVO: '$', '$$', '$$$', '$$$$'
  average_meal_price DECIMAL(10, 2),  -- Mantido para referência
  
  -- Capacidade e Características
  capacity INTEGER,  -- ⭐ NOVO: número de pessoas
  has_parking BOOLEAN DEFAULT false,  -- ⭐ NOVO
  has_wifi BOOLEAN DEFAULT false,  -- ⭐ NOVO
  has_outdoor_seating BOOLEAN DEFAULT false,  -- ⭐ NOVO
  is_accessible BOOLEAN DEFAULT false,  -- ⭐ NOVO: acessibilidade
  accepts_reservations BOOLEAN DEFAULT false,  -- ⭐ NOVO
  
  -- Integração e Controle
  external_id VARCHAR(255),  -- ⭐ NOVO: ID do Google/Yelp
  external_source VARCHAR(50),  -- ⭐ NOVO: 'google', 'yelp', 'manual'
  data_source ENUM('mock', 'manual', 'api') DEFAULT 'mock',  -- ⭐ NOVO
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,  -- ⭐ NOVO: verificado pela equipe
  verification_date TIMESTAMP,  -- ⭐ NOVO
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,  -- ⭐ NOVO: soft delete
  
  -- Índices
  INDEX idx_location (latitude, longitude),  -- ⭐ Busca geográfica
  INDEX idx_city_state (city, state),
  INDEX idx_slug (slug),
  INDEX idx_external (external_source, external_id)
);
```

---

### **2. Tabela `restaurant_food_types` (N:N)**

```sql
CREATE TABLE restaurant_food_types (
  restaurant_id UUID NOT NULL,
  food_type_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,  -- ⭐ NOVO: tipo principal
  created_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (restaurant_id, food_type_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (food_type_id) REFERENCES food_types(id) ON DELETE CASCADE,
  
  -- ⭐ Garantir apenas 1 tipo primário por restaurante
  CONSTRAINT unique_primary_food_type 
    EXCLUDE (restaurant_id WITH =) WHERE (is_primary = true)
);
```

**Benefício:** Restaurante pode ter "Italiana" (primária) + "Pizza" + "Massa"

---

### **3. Tabela `restaurant_place_types` (N:N)**

```sql
CREATE TABLE restaurant_place_types (
  restaurant_id UUID NOT NULL,
  place_type_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,  -- ⭐ NOVO
  created_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (restaurant_id, place_type_id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (place_type_id) REFERENCES place_types(id) ON DELETE CASCADE,
  
  CONSTRAINT unique_primary_place_type 
    EXCLUDE (restaurant_id WITH =) WHERE (is_primary = true)
);
```

**Benefício:** Restaurante pode ser "Casual" (primário) + "Romântico" + "Familiar"

---

### **4. Tabela `restaurant_images` (Melhorada)**

```sql
CREATE TABLE restaurant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  
  -- Armazenamento
  image_url VARCHAR(500) NOT NULL,  -- ⭐ URL completa (CDN/S3)
  image_key VARCHAR(255),  -- ⭐ Chave no storage
  thumbnail_url VARCHAR(500),  -- ⭐ NOVO: versão pequena
  
  -- Metadados
  image_type ENUM('cover', 'menu', 'interior', 'exterior', 'food', 'other'),  -- ⭐ NOVO
  alt_text VARCHAR(255),  -- ⭐ NOVO: acessibilidade
  display_order INTEGER DEFAULT 0,  -- ⭐ NOVO: ordem de exibição
  width INTEGER,  -- ⭐ NOVO
  height INTEGER,  -- ⭐ NOVO
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID,  -- ⭐ NOVO: quem fez upload
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_restaurant_type (restaurant_id, image_type),
  INDEX idx_display_order (restaurant_id, display_order)
);
```

---

### **5. Tabela `restaurant_hours` (NOVA)**

```sql
CREATE TABLE restaurant_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  
  day_of_week INTEGER NOT NULL,  -- 0=Domingo, 6=Sábado
  opens_at TIME,  -- NULL = fechado
  closes_at TIME,
  
  -- Para horários especiais
  is_24_hours BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE (restaurant_id, day_of_week),
  
  CHECK (day_of_week BETWEEN 0 AND 6),
  CHECK (
    (is_closed = true AND opens_at IS NULL AND closes_at IS NULL) OR
    (is_24_hours = true) OR
    (opens_at IS NOT NULL AND closes_at IS NOT NULL)
  )
);
```

**Benefício:** Saber se restaurante está aberto AGORA

---

### **6. Tabela `reviews` (Melhorada)**

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),  -- ⭐ NOVO
  comment TEXT,
  
  -- Detalhes
  visit_date DATE,  -- ⭐ NOVO: quando visitou
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack'),  -- ⭐ NOVO
  
  -- Avaliações Detalhadas (opcional)
  food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),  -- ⭐ NOVO
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),  -- ⭐ NOVO
  ambiance_rating INTEGER CHECK (ambiance_rating BETWEEN 1 AND 5),  -- ⭐ NOVO
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),  -- ⭐ NOVO
  
  -- Moderação
  is_verified BOOLEAN DEFAULT false,  -- ⭐ NOVO: compra verificada
  is_flagged BOOLEAN DEFAULT false,  -- ⭐ NOVO: denunciado
  moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',  -- ⭐ NOVO
  
  -- Engajamento
  helpful_count INTEGER DEFAULT 0,  -- ⭐ NOVO: quantos acharam útil
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,  -- ⭐ Soft delete
  
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- ⭐ Usuário só pode avaliar 1x cada restaurante
  UNIQUE (restaurant_id, user_id),
  
  INDEX idx_restaurant_rating (restaurant_id, rating),
  INDEX idx_moderation (moderation_status, created_at)
);
```

---

### **7. VIEW: `restaurant_stats` (Dados Calculados)**

```sql
CREATE VIEW restaurant_stats AS
SELECT 
  r.id,
  r.name,
  
  -- Estatísticas de Reviews
  COUNT(rv.id) as total_reviews,
  COALESCE(AVG(rv.rating), 0) as average_rating,
  COALESCE(AVG(rv.food_rating), 0) as avg_food_rating,
  COALESCE(AVG(rv.service_rating), 0) as avg_service_rating,
  COALESCE(AVG(rv.ambiance_rating), 0) as avg_ambiance_rating,
  
  -- Distribuição de Ratings
  COUNT(CASE WHEN rv.rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rv.rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rv.rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rv.rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rv.rating = 1 THEN 1 END) as one_star_count,
  
  -- Imagens
  COUNT(DISTINCT ri.id) as total_images,
  
  -- Última atualização
  MAX(rv.created_at) as last_review_date
  
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.restaurant_id AND rv.deleted_at IS NULL
LEFT JOIN restaurant_images ri ON r.id = ri.restaurant_id AND ri.is_active = true
GROUP BY r.id, r.name;
```

**Benefício:** Dados sempre atualizados, sem triggers complexos

---

## 🚀 Estratégia de Migração: MVP → Produção

### **Fase 1: MVP (Atual - Mocks)**
```
✅ Estrutura simples
✅ Dados mockados
✅ 1 food_type, 1 place_type por restaurante
✅ Imagens locais (slugs)
```

### **Fase 2: Transição (Preparação)**
```
1. Criar novas tabelas (N:N, hours, images melhorada)
2. Migrar dados existentes
3. Manter compatibilidade com código antigo
4. Adicionar campos novos como NULLABLE
```

### **Fase 3: Integração (APIs Externas)**
```
1. Integrar Google Places API
2. Popular external_id e external_source
3. Sincronizar dados automaticamente
4. Migrar imagens para CDN (Cloudinary/S3)
```

### **Fase 4: Produção (Escalável)**
```
1. Remover campos antigos (food_type_id, place_type_id)
2. Tornar campos obrigatórios
3. Adicionar índices de performance
4. Implementar cache (Redis)
```

---

## 📝 Script de Migração de Dados

```sql
-- Migrar food_types de 1:1 para N:N
INSERT INTO restaurant_food_types (restaurant_id, food_type_id, is_primary)
SELECT id, food_type_id, true
FROM restaurants
WHERE food_type_id IS NOT NULL;

-- Migrar place_types de 1:1 para N:N
INSERT INTO restaurant_place_types (restaurant_id, place_type_id, is_primary)
SELECT id, place_type_id, true
FROM restaurants
WHERE place_type_id IS NOT NULL;

-- Migrar imagens
INSERT INTO restaurant_images (restaurant_id, image_url, image_type, display_order)
SELECT 
  r.id,
  '/images/' || ft.tag_image,  -- Converter slug para URL
  'cover',
  0
FROM restaurants r
JOIN food_types ft ON r.food_type_id = ft.id;
```

---

## 🎯 Queries de Exemplo Otimizadas

### **1. Buscar Restaurantes por Preferências do Usuário**

```sql
SELECT DISTINCT
  r.*,
  rs.average_rating,
  rs.total_reviews,
  
  -- Score de Match (quanto mais tipos coincidem, melhor)
  (
    SELECT COUNT(*)
    FROM restaurant_food_types rft
    JOIN user_food_preferences ufp ON rft.food_type_id = ufp.food_type_id
    WHERE rft.restaurant_id = r.id AND ufp.user_id = $1
  ) as food_match_score,
  
  (
    SELECT COUNT(*)
    FROM restaurant_place_types rpt
    JOIN user_place_preferences upp ON rpt.place_type_id = upp.place_type_id
    WHERE rpt.restaurant_id = r.id AND upp.user_id = $1
  ) as place_match_score,
  
  -- Distância
  (
    6371 * acos(
      cos(radians($2)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians($3)) +
      sin(radians($2)) * sin(radians(r.latitude))
    )
  ) as distance_km

FROM restaurants r
JOIN restaurant_stats rs ON r.id = rs.id
JOIN user_preferences up ON up.user_id = $1

WHERE 
  r.is_active = true
  AND r.average_meal_price BETWEEN up.min_budget AND up.max_budget
  AND (
    6371 * acos(
      cos(radians($2)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians($3)) +
      sin(radians($2)) * sin(radians(r.latitude))
    )
  ) <= up.preferred_radius_km

ORDER BY 
  (food_match_score * 3 + place_match_score * 2) DESC,  -- Peso maior para comida
  rs.average_rating DESC,
  distance_km ASC

LIMIT 20;
```

---

## 💡 Recomendações Finais

### **Para MVP (Agora):**
1. ✅ Manter estrutura atual funcionando
2. ✅ Adicionar tabelas N:N em paralelo
3. ✅ Popular com dados mockados
4. ✅ Testar algoritmo de recomendação

### **Para Crescimento (3-6 meses):**
1. 🔄 Migrar para N:N completamente
2. 🔄 Integrar Google Places API
3. 🔄 Implementar upload de imagens (S3/Cloudinary)
4. 🔄 Adicionar horários de funcionamento

### **Para Escala (6-12 meses):**
1. 🚀 Cache com Redis
2. 🚀 Elasticsearch para busca textual
3. 🚀 PostGIS para queries geográficas avançadas
4. 🚀 Machine Learning para recomendações personalizadas

---

**Quer que eu implemente a estrutura otimizada?** 🎯

Posso criar:
- ✅ Migrations completas
- ✅ Script de migração de dados
- ✅ Models do Sequelize atualizados
- ✅ Queries otimizadas
