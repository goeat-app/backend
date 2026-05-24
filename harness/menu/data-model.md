# Restaurant Menu Data Model

## Tables

### menu_categories

- id UUID PK
- restaurant_id UUID FK restaurants.id
- name string
- slug string
- sort_order int
- is_active boolean
- deleted_at timestamp nullable
- created_at timestamp
- updated_at timestamp

### menu_items

- id UUID PK
- restaurant_id UUID FK restaurants.id
- category_id UUID FK menu_categories.id
- name string
- description text nullable
- base_price decimal nullable
- image_key string nullable
- is_available boolean
- has_sizes boolean
- sort_order int
- deleted_at timestamp nullable
- created_at timestamp
- updated_at timestamp

### menu_item_sizes

- id UUID PK
- menu_item_id UUID FK menu_items.id
- label string
- price decimal
- sort_order int
- deleted_at timestamp nullable
- created_at timestamp
- updated_at timestamp

## Indexes

- menu_categories: restaurant_id, (restaurant_id, sort_order), unique active name and slug per restaurant
- menu_items: restaurant_id, category_id, (restaurant_id, category_id, sort_order), (restaurant_id, is_available), unique active name per category
- menu_item_sizes: menu_item_id, (menu_item_id, sort_order), unique active label per item
