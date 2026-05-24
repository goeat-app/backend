## Plan: Restaurant Menu Entities and Endpoints

Build a dedicated menu domain under restaurants with three core data groups: categories, items, and item sizes. Use restaurant role guards already present in the codebase for admin operations and add public read endpoints for customer menu browsing. Use soft delete and manual ordering for both categories and items.

**Steps**

1. Phase 1: Data model and migrations
2. Create table menu_categories with columns: id, restaurant_id, name, slug, sort_order, is_active, deleted_at, created_at, updated_at. Add unique partial index per restaurant for active names/slugs and index on restaurant_id + sort_order.
3. Create table menu_items with columns: id, restaurant_id, category_id, name, description, base_price, image_key, is_available, has_sizes, sort_order, deleted_at, created_at, updated_at. Add indexes for restaurant_id + category_id + sort_order and availability.
4. Create table menu_item_sizes with columns: id, menu_item_id, label, price, sort_order, deleted_at, created_at, updated_at. This supports configurable sizes per item.
5. Optional optimization: add denormalized counters on menu_categories for items_count if list performance needs it later; exclude in first version unless required.
6. Phase 2: Domain module scaffolding
7. Add new module restaurant-menu with structure matching existing modules: app use-cases, domain interfaces/entities, dtos, infra controllers/database/repositories.
8. Register Sequelize models for category, item, size in the new module and wire repository interfaces to Sequelize implementations.
9. Reuse auth and role protection pattern from restaurant-access and restaurant-images for owner/manager write operations.
10. Phase 3: Admin endpoints (authenticated)
11. Categories admin:
12. POST /restaurants/:restaurantId/menu/categories create category
13. GET /restaurants/:restaurantId/menu/categories include soft-deleted=false by default; include item count and sort order
14. PATCH /restaurants/:restaurantId/menu/categories/:categoryId update name or active status
15. PATCH /restaurants/:restaurantId/menu/categories/reorder bulk reorder by ordered list of category ids
16. DELETE /restaurants/:restaurantId/menu/categories/:categoryId soft delete category; policy decision: also soft delete child items or block when active items exist (recommend block with clear error)
17. Items admin:
18. POST /restaurants/:restaurantId/menu/items create item with fields from screen, including optional sizes[] and optional image upload reference
19. GET /restaurants/:restaurantId/menu/items supports filters: category_id, search, status, page, limit, sort
20. GET /restaurants/:restaurantId/menu/items/:itemId item detail for edit screen
21. PATCH /restaurants/:restaurantId/menu/items/:itemId update item fields, sizes, and availability
22. PATCH /restaurants/:restaurantId/menu/items/:itemId/availability toggle is_available
23. PATCH /restaurants/:restaurantId/menu/items/reorder bulk reorder within category
24. DELETE /restaurants/:restaurantId/menu/items/:itemId soft delete
25. Phase 4: Public customer endpoints (no auth)
26. GET /public/restaurants/:restaurantId/menu returns active categories and active items only, already ordered, with available sizes and effective display price
27. GET /public/restaurants/:restaurantId/menu/items/:itemId returns active item detail for customer app
28. Add safeguards so disabled category/item or soft-deleted records are excluded.
29. Phase 5: Validation, business rules, and consistency
30. Enforce per-restaurant ownership through RestaurantRolesGuard for write routes (OWNER, MANAGER).
31. Validate price rules: if has_sizes=true, require at least one size; if has_sizes=false, require base_price.
32. Ensure category belongs to same restaurant before assigning item.
33. Keep names unique per restaurant among non-deleted records.
34. Apply transaction boundaries when updating item and sizes together.
35. Soft delete behavior: set deleted_at; list endpoints exclude deleted rows by default; optional include_deleted query for admin audit.
36. Phase 6: Integration tests
37. Add tests for auth/role guards, category CRUD, item CRUD, reorder, availability toggle, soft delete visibility, and public endpoint filtering.
38. Add tests for cross-restaurant access denial and invalid payloads.
39. Phase 7: Feature harness creation
40. Create a restaurant-menu harness focused on fast local validation and regression safety for this feature set.
41. Add test fixtures and builders in test/helpers for seeded restaurants, categories, items, and sizes to reduce duplication across new tests.
42. Add dedicated integration specs under test/integration/menu for category, item, size, reorder, availability, and public menu flows.
43. Add harness commands in package scripts for targeted runs (for example, menu:integration, menu:smoke, menu:seed:dev).
44. Add API smoke collection and environment variables for manual QA (restaurantId, owner token, manager token, viewer token).
45. Add a baseline seed strategy for menu categories and items so frontend and QA can test without manual setup.
46. Phase 8: Progress tracking and delivery management
47. Keep a running progress checklist in documentation with status fields (not started, in progress, blocked, done), owner, and target date.
48. Track completion by milestone: data model, admin APIs, public APIs, harness, docs, and release readiness.
49. Include a short changelog section for each milestone to capture schema changes, endpoint changes, and contract-impacting decisions.
50. Add a risk and blockers log with mitigation notes to avoid losing context between contributors.
51. Phase 9: General documentation and future references
52. Create implementation documentation covering architecture, route map, entity relationships, and lifecycle rules.
53. Create an API contract reference with request and response examples, validation rules, and error catalog.
54. Create an operations runbook with migration commands, rollback flow, seed flow, and troubleshooting for common failures.
55. Create a future work backlog documenting deferred capabilities: modifiers, stock, schedule-based availability, multilingual content, analytics, and media gallery support.
56. Organize all harness and feature documentation under harness/menu and keep docs reserved for developer-only documentation.

**Relevant files**

- /Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-access/infra/auth/restaurant-roles.guard.ts — reuse guard behavior for restaurant-scoped authorization.
- /Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-images/infra/controllers/restaurant-images.controller.ts — reuse controller route style and owner/manager role restrictions.
- /Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-access/app/services/restaurant-access.service.ts — reuse role-checking service patterns and restaurant existence checks.
- /Users/marcostomaz/Data/source/github/goeat/backend/src/lib/infra/database/migrations — place new migrations here using current sequelize-cli style.
- /Users/marcostomaz/Data/source/github/goeat/backend/src/app.module.ts — register the new restaurant-menu module.
- /Users/marcostomaz/Data/source/github/goeat/backend/test/integration/restaurant-images.test.ts — use as template for endpoint integration tests and authorization assertions.

**Verification**

1. Migration verification: run migration up/down cycle and confirm indexes plus FK constraints.
2. Admin endpoint tests: create category/item, reorder, update availability, delete (soft), and confirm records disappear from default lists.
3. Public endpoint tests: only active and non-deleted categories/items appear; unavailable/deleted records excluded.
4. Security tests: non-member gets 403 on write endpoints; manager and owner allowed; viewer denied for write.
5. Consistency tests: category-item restaurant mismatch rejected; has_sizes validation enforced.
6. Harness verification: execute targeted harness scripts and ensure CI-friendly deterministic results.
7. Documentation verification: confirm all new docs are linked from README and include last-updated date and owner.

**Harness Deliverables**

1. Test harness: reusable test data builders and scenario helpers for menu categories, items, and sizes.
2. Smoke harness: scriptable end-to-end API smoke flow for create, update, reorder, toggle availability, and soft delete.
3. Seed harness: dev seed command to bootstrap a realistic restaurant menu quickly.
4. CI harness: dedicated job or command set to run menu tests independently from full suite.

**Progress Tracking Template**

1. Milestone: Data model and migrations | Status: not started | Owner: TBD | ETA: TBD
2. Milestone: Admin endpoints | Status: not started | Owner: TBD | ETA: TBD
3. Milestone: Public endpoints | Status: not started | Owner: TBD | ETA: TBD
4. Milestone: Harness and QA readiness | Status: not started | Owner: TBD | ETA: TBD
5. Milestone: Documentation and handoff | Status: not started | Owner: TBD | ETA: TBD

**Documentation and References**

1. Product and architecture overview: harness/menu/architecture.md
2. Endpoint contract reference: harness/menu/api-reference.md
3. Data model and migrations notes: harness/menu/data-model.md
4. QA and smoke guide: harness/menu/testing-and-harness.md
5. Operations runbook: harness/menu/operations.md
6. Future roadmap and deferred work: harness/menu/future-work.md
7. Progress tracker and milestones: harness/menu/progress.md

**Decisions**

- Included: configurable sizes per item, manual ordering, public read endpoints, soft delete.
- Included: one dedicated menu module instead of extending IA/profile-mapping modules.
- Excluded for now: inventory/stock tracking, modifiers/add-ons, multi-language fields, schedule-based availability, analytics.
- Recommended deletion policy: block category deletion while active non-deleted items exist, then allow after items are moved/deleted.

**Further Considerations**

1. Image strategy for items: Option A store image_key in menu_items (simple, fastest). Option B create menu_item_images table if multiple images per item are needed.
2. Public API shape: Option A nested payload by categories with item arrays (best for screen rendering). Option B flat items plus category map (best for filtering-heavy clients).
3. Slug generation: server-side deterministic slug with collision suffix to keep URLs stable.
4. Documentation ownership: assign maintainers for each harness/menu page and define review cadence each release.
