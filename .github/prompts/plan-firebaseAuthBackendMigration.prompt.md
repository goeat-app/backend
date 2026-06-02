## Plan: Firebase Auth Backend Migration

Replace backend JWT/Supabase-protected endpoint auth with direct Firebase ID token validation across all protected routes, then auto-provision/link users in PostgreSQL using a new nullable unique firebase UID column. This matches your decisions and keeps behavior deterministic without assumptions.

**Steps**

Execute phases strictly in order 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7. Do not begin a phase until the previous phase is fully implemented and verified.

1. Phase 1: Auth surface inventory
2. Enumerate every controller currently using `JwtAuthGuard` and all request-user contracts to ensure full migration coverage and no partially unprotected endpoints.
3. Phase 2: Database and model update (_blocks provisioning logic_)
4. Add a Sequelize migration to create `users.firebase_uid` as nullable + unique (with rollback removing index and column).
5. Extend user model/repository/domain mapping with `firebaseUid`, plus lookup by Firebase UID and email.
6. Phase 3: Firebase verification guard (_depends on phase 2_)
7. Implement Firebase Admin token verification for `Authorization: Bearer <id-token>`.
8. Introduce a Firebase auth guard that validates token claims and resolves/attaches internal user identity for downstream controllers. The Firebase guard must return HTTP 401 with body `{"message": "Unauthorized"}` for missing or malformed tokens, and HTTP 401 with body `{"message": "Token expired"}` for expired tokens. Never return 403 for token validation failures.
9. If the Firebase Admin SDK throws a network or initialization error during token verification, return HTTP 503 with body `{"message": "Auth service unavailable"}` and log the error. Do not fall through to an unprotected state.
10. Replace all `JwtAuthGuard` usage in protected endpoints with the Firebase guard, preserving composed guard behavior (for example, auth + role guard ordering). Keep JWT strategy/guard infrastructure files in place until Phase 5 decommission.
11. Phase 4: User provisioning/linking on authenticated access (_depends on phase 3_)
12. Resolve user by `firebase_uid`. If not found and the Firebase ID token contains no email claim (for example phone or anonymous sign-in), reject the request with HTTP 403 and message `Email-based identity required.` Do not attempt provisioning without an email.
13. If email exists and a user is found by email, link by email only when Firebase `email_verified` is true. If email is unverified, do not link to an existing user; create a new user record instead and log a warning.
14. Set the user's name from Firebase `displayName` only at creation time. If `displayName` is null, undefined, or empty string, use the portion of the email address before the first `@` character. Do not update the name on subsequent logins.
15. Handle concurrent first-login race conditions by catching a unique-constraint violation on `firebase_uid` insert, then re-fetching the existing row. Do not use upsert or application-level retry loops.
16. Phase 5: Remove Supabase/JWT auth bridge (_depends on phase 4_)
17. Remove `/auth/login/supabase` and JWT issuance/refresh/logout paths that are no longer valid in direct-Firebase mode.
18. Remove obsolete JWT strategy/guard wiring only after endpoint migration is complete and verified.
19. Phase 6: Dashboard alignment for direct backend auth (_depends on phase 5_)
20. Remove backend JWT bridge usage from dashboard auth flow and send Firebase ID token directly on backend API calls.
21. Ensure Firebase token refresh is consistently applied before protected requests.
22. Phase 7: Tests, docs, rollout checks
23. Add/update integration tests for valid/invalid/expired Firebase tokens and first-signin user provisioning/linking.
24. Update docs for the new auth flow and migration behavior.

**Relevant files**

- [backend/src/modules/auth/infra/controllers/auth.controller.ts](backend/src/modules/auth/infra/controllers/auth.controller.ts) — retire Supabase/JWT bridge endpoints and keep Firebase-auth-compatible endpoints.
- [backend/src/modules/auth/app/services/auth.service.ts](backend/src/modules/auth/app/services/auth.service.ts) — move to Firebase principal resolution + user linking/provisioning.
- [backend/src/modules/auth/auth.module.ts](backend/src/modules/auth/auth.module.ts) — register/export Firebase verifier + guard providers.
- [backend/src/modules/auth/infra/jwt/jwt-auth.guard.ts](backend/src/modules/auth/infra/jwt/jwt-auth.guard.ts) — reference for decommission/replacement.
- [backend/src/modules/auth/infra/jwt/jwt.strategy.ts](backend/src/modules/auth/infra/jwt/jwt.strategy.ts) — reference for removal/replacement.
- [backend/src/modules/auth/infra/database/user.model.ts](backend/src/modules/auth/infra/database/user.model.ts) — add `firebaseUid` mapping.
- [backend/src/modules/auth/infra/repositories/user.repository.ts](backend/src/modules/auth/infra/repositories/user.repository.ts) — add lookup/link operations for Firebase UID + email.
- [backend/src/lib/infra/database/migrations](backend/src/lib/infra/database/migrations) — add migration for `firebase_uid` and unique index.
- [backend/src/modules/restaurant-access/infra/controllers/my-restaurants.controller.ts](backend/src/modules/restaurant-access/infra/controllers/my-restaurants.controller.ts) — representative protected route migration.
- [goeat-dashboard/src/auth/auth-api.ts](goeat-dashboard/src/auth/auth-api.ts) — remove `/auth/login/supabase` bridge and use Firebase token directly.
- [goeat-dashboard/src/auth/auth-context.tsx](goeat-dashboard/src/auth/auth-context.tsx) — adjust auth state/token handling after JWT bridge removal.
- [goeat-dashboard/src/lib/firebase-client.ts](goeat-dashboard/src/lib/firebase-client.ts) — token retrieval/refresh source for backend calls.

**Verification**

1. Run DB migration up/down and verify `firebase_uid` uniqueness semantics and rollback safety.
2. Run backend integration tests for protected endpoints with valid, missing, malformed, and expired Firebase tokens.
3. Validate first login creates user, repeat login reuses same user, and existing-email user is linked with `firebase_uid`.
4. Validate role-protected endpoints still enforce restaurant authorization after guard migration.
5. Validate dashboard login flows (email/password + Google) and protected API requests without `/auth/login/supabase`.

**Decisions captured**

- Direct Firebase tokens only for protected backend endpoints.
- Remove Supabase auth flow.
- Add nullable unique `firebase_uid`.
- Link by email if existing user, else create.
- Fallback name = email prefix.
- Migrate all endpoints currently protected by JWT guard.
