## Plan: Restaurant Image Upload to Supabase Storage

**TL;DR**: Add a `restaurant-images` module with a `POST /restaurants/:restaurantId/images` endpoint that uses `@supabase/supabase-js` initialized with the **service role key** (bypasses RLS, acts as a service account) to upload files to the `restaurant_pictures` bucket at path `{restaurant_id}/{file_id}`, then persists the record to the existing `restaurant_images` DB table.

---

**Steps**

### Phase 1 — Dependencies & Config

1. Install `@supabase/supabase-js`
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.example`

### Phase 2 — Supabase Storage Service (shared lib)

3. Create `src/lib/infra/external/supabase-storage.service.ts` — Injectable service that reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `ConfigService`, initializes the Supabase client with the service role key, and exposes an `uploadFile(bucket, path, buffer, mimetype)` method returning the storage path

### Phase 3 — Restaurant Images Module

4. Create `RestaurantImageModel` mapping to the existing `restaurant_images` table (fields: `id`, `restaurant_id`, `image_key`, `is_cover`, `created_at`)
5. Create `IRestaurantImageRepository` interface + `SequelizeRestaurantImageRepository`
6. Create `UploadRestaurantImageUseCase` — generates `file_id` (UUID v4), calls storage service with `{restaurantId}/{fileId}`, saves record to DB
7. Create `RestaurantImagesController` — `POST /restaurants/:restaurantId/images`, multipart via `FileInterceptor`, protected by `JwtAuthGuard`, optional `is_cover` body field
8. Create `RestaurantImagesModule` wiring everything

### Phase 4 — Registration

9. Add `RestaurantImageModel` to `DatabaseModule`'s models array _(depends on step 4)_
10. Import `RestaurantImagesModule` in `AppModule` _(depends on step 8)_

---

**Relevant files**

- `package.json` — add `@supabase/supabase-js`
- `.env.example` — add Supabase storage vars
- `src/lib/infra/database/database.module.ts` — register new model
- `src/app.module.ts` — import new module
- New: `src/lib/infra/external/supabase-storage.service.ts`
- New: `src/modules/restaurant-images/` — full module (model, repo, use-case, controller, module file)

---

**Verification**

1. `npm run build` compiles cleanly
2. `POST /restaurants/:restaurantId/images` with a valid JWT + multipart file → returns image record with `image_key`
3. File visible in Supabase Dashboard under `restaurant_pictures/{restaurantId}/{fileId}`
4. Row exists in `restaurant_images` table

---

**Decisions**

- **Service account = service role key**: The Supabase `service_role` key is the idiomatic "service account" for backend services. It bypasses all RLS policies, so the bucket's "authenticated only" policy is a non-issue from the backend. The endpoint itself is secured by `JwtAuthGuard`.
- `image_key` stores the storage path (`{restaurantId}/{fileId}`), not the full URL. The public URL can be derived at read time from `SUPABASE_URL`.
- New `restaurant-images` module is kept separate from the `ia` module (which is AI-recommendation-specific).
- `is_cover` defaults to `false`.
