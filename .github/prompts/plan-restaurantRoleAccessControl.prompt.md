## Plan: Restaurant Role Access Control

Implement per-restaurant RBAC using a user-to-restaurant role table, enforce owner/manager authorization on restaurant file operations immediately, and introduce role-assignment APIs so access can be managed in-app. This aligns with current architecture (NestJS modules + Sequelize models/repositories/use-cases) and prepares a reusable authorization component for future restaurant attribute write endpoints.

**Steps**

1. Phase 1 - Domain and data model foundation
2. Define role model for restaurant membership: `OWNER`, `MANAGER`, `VIEWER` and action policy: write/manage files and attributes allowed for `OWNER|MANAGER`; read/list membership allowed for all authenticated members.
3. Add DB migration for `restaurant_user_roles` (or equivalent name) with columns: `id`, `restaurant_id`, `user_id`, `role`, `created_at`, `updated_at`; enforce uniqueness on `(restaurant_id, user_id)`; FK to `restaurants.id` and `user.id`; index by `restaurant_id` and `user_id`.
4. Add Sequelize model for role assignment and register it in the relevant modules (`restaurant-images` now, reusable export for future modules).
5. Phase 2 - Authorization building blocks
6. Create authorization service/use-case that answers: “does user X have one of roles Y in restaurant Z?” and “what role does user X have in restaurant Z?”; repository should provide `findByUserAndRestaurant`, `assignOrUpdateRole`, `removeRole`, and `listByRestaurant`.
7. Implement reusable guard/decorator pair for restaurant-scoped role checks (e.g., route metadata for allowed roles), reading `restaurantId` from route params and `user.id` from JWT payload. Guard returns `403` when membership/role is insufficient.
8. Keep policy source centralized (enum/constants) so future restaurant attribute endpoints can reuse the same check without duplicating logic.
9. Phase 3 - Apply RBAC to current file operations
10. Update restaurant image endpoints to require `OWNER|MANAGER`:
11. `POST /restaurants/:restaurantId/images`
12. `DELETE /restaurants/:restaurantId/images/:imageId`
13. Ensure behavior: unauthenticated -> `401` (existing JWT guard), authenticated without membership/role -> `403`, non-existing target image -> `404` (existing delete use-case behavior).
14. Phase 4 - Role assignment and membership APIs
15. Add restaurant membership management endpoints (new controller in dedicated module or within restaurant access module):
16. Assign/update role for a user in a restaurant.
17. Remove user role from a restaurant.
18. List roles for a restaurant.
19. Authorization rule for management endpoints: only `OWNER` can assign/remove roles; optionally allow owner to promote/demote manager/viewer but prevent owner self-removal unless another owner exists (decide and enforce in use-case policy).
20. Add DTO validation for role values and UUID params.
21. Phase 5 - Future-proof for restaurant attribute management
22. Because no restaurant attribute write endpoints currently exist in this codebase, introduce the guard/decorator in a shared/reusable location and document exactly how to apply it to future restaurant create/update/delete endpoints.
23. Optionally add a no-op placeholder checklist in repository memory for future endpoint owners (attach required guard + roles + expected status codes).
24. Phase 6 - Test and validation
25. Add unit tests for role policy service/use-case (role matching, denied paths, edge cases).
26. Add guard tests (missing `restaurantId`, missing user, insufficient role, allowed role).
27. Add controller/use-case integration tests for image upload/delete authorization paths (`401`, `403`, `201`, `204`, `404`).
28. Add tests for assignment APIs (owner allowed, manager denied, validation failures).
29. Run lint/tests and migration up/down verification locally.

**Relevant files**

- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/auth/infra/jwt/jwt.strategy.ts` - JWT payload shape currently exposes `id`; reused by role guard.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-images/infra/controllers/restaurant-images.controller.ts` - immediate RBAC enforcement point for file operations.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-images/app/use-cases/upload-restaurant-image.use-case.ts` - remains business logic; auth should stay at controller/guard layer.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-images/app/use-cases/delete-restaurant-image.use-case.ts` - preserve not-found semantics after authorization.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/restaurant-images/restaurant-images.module.ts` - wire new role guard/service/repository dependencies.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/lib/infra/database/migrations` - add migration for role assignment table.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/ia/infra/database/restaurant.model.ts` - reference restaurant FK target.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/modules/auth/infra/database/user.model.ts` - reference user FK target.
- `/Users/marcostomaz/Data/source/github/goeat/backend/src/app.module.ts` - include new module if created.

**Verification**

1. Run migration and verify `restaurant_user_roles` constraints and indexes exist.
2. Call upload/delete image endpoints with JWT from: non-member user, viewer user, manager user, owner user; verify status codes (`403` for non-member/viewer, success for manager/owner).
3. Validate assignment endpoints:
4. Owner can assign manager/viewer.
5. Manager/viewer cannot assign/remove roles.
6. Invalid role payload returns validation error.
7. Confirm delete image still returns `404` when image does not belong to restaurant or does not exist (after passing authorization).
8. Run lint and automated tests for changed modules.

**Decisions**

- Roles in scope now: `OWNER`, `MANAGER`, `VIEWER`.
- Management permissions in scope now: only `OWNER|MANAGER` for restaurant files and restaurant attribute write actions.
- Include role-assignment API now.
- Included now: RBAC data model + authorization plumbing + image endpoint enforcement + role-assignment endpoints.
- Owner safety rule: always block removal/downgrade of the last `OWNER` in a restaurant.
- Excluded now: implementation of new restaurant attribute CRUD endpoints (none currently present). The plan only prepares reusable enforcement for when those endpoints are added.

**Further Considerations**

1. Owner cardinality policy recommendation: enforce at least one owner per restaurant to avoid orphaned administration; block last-owner removal/role downgrade.
2. Assignment audit recommendation: if needed later, add `created_by`/`updated_by` columns for role-change traceability.
3. Scalability recommendation: if permission matrix grows, switch from role-only checks to policy map by action key (e.g., `RESTAURANT_FILES_WRITE`, `RESTAURANT_ATTR_WRITE`).
