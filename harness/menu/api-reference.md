# Restaurant Menu API Reference

## Admin Endpoints

- POST /restaurants/:restaurantId/menu/categories
- GET /restaurants/:restaurantId/menu/categories
- PATCH /restaurants/:restaurantId/menu/categories/:categoryId
- PATCH /restaurants/:restaurantId/menu/categories/reorder
- DELETE /restaurants/:restaurantId/menu/categories/:categoryId

- POST /restaurants/:restaurantId/menu/items
- GET /restaurants/:restaurantId/menu/items
- GET /restaurants/:restaurantId/menu/items/:itemId
- PATCH /restaurants/:restaurantId/menu/items/:itemId
- PATCH /restaurants/:restaurantId/menu/items/:itemId/availability
- PATCH /restaurants/:restaurantId/menu/items/reorder
- DELETE /restaurants/:restaurantId/menu/items/:itemId

## Public Endpoints

- GET /public/restaurants/:restaurantId/menu
- GET /public/restaurants/:restaurantId/menu/items/:itemId

## Validation Rules

- has_sizes=true requires at least one size.
- has_sizes=false requires base_price.
- category_id must belong to the same restaurant.

## Error Catalog

- 400 validation errors
- 401 unauthenticated
- 403 insufficient role
- 404 resource not found
- 409 uniqueness conflict
