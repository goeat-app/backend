# Manual Recommendation E2E Test Plan

This runbook covers manual end-to-end checks for the backend recommendation
system, including rule-based scoring, TensorFlow scoring, Python fallback,
preferences, feedback learning, history, and dataset export.

## Scope

The checks exercise:

- NestJS API on `http://localhost:3000`.
- PostgreSQL recommendation tables.
- Firebase Auth Emulator authentication.
- Google Places candidate discovery or cached candidate fallback.
- Python prediction service on `http://localhost:8000`.
- Trained model artifact mounted from `ml/artifacts/restaurant_ranker_v1/model`.

## Required Setup

### Local Services

Start the local infrastructure:

```bash
yarn docker:up
```

Verify containers:

```bash
docker compose ps
```

Expected:

- `goeat-postgres` is healthy.
- `goeat-firebase-emulator` is running.
- `goeat-prediction-service` is running when ML scenarios are in scope.

Apply migrations:

```bash
yarn db:migrate
```

Start the backend:

```bash
yarn start:emulator
```

Expected:

- Backend listens on `http://localhost:3000`.
- No startup exception is thrown.
- With `RECOMMENDATION_SCORER=tensorflow`, startup logs the prediction-service
  health probe result without failing the app.

### Environment Checklist

For rule-based scenarios:

```env
RECOMMENDATION_SCORER=rule_based
GOOGLE_PLACES_API_KEY=<google-places-api-key>
AUTH_EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat
DATABASE_URL=postgresql://admin:goeat-admin@localhost:5432/goeat_db
```

For ML scenarios:

```env
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:8000
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
GOOGLE_PLACES_API_KEY=<google-places-api-key>
AUTH_EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat
DATABASE_URL=postgresql://admin:goeat-admin@localhost:5432/goeat_db
```

For Python service:

```env
MODEL_PATH=/model
MODEL_VERSION=restaurant_ranker_v1
FEATURE_VERSION=restaurant_recommendation_v1
PREDICTION_SERVICE_TOKEN=local-prediction-token
PREDICTION_ALLOW_HEURISTIC=true
```

### Model Artifact Checklist

Before ML success scenarios, confirm the trained artifact exists:

```bash
test -f ml/artifacts/restaurant_ranker_v1/model/saved_model.pb
test -f ml/artifacts/restaurant_ranker_v1/metadata.json
```

Confirm metadata:

```bash
python -m json.tool ml/artifacts/restaurant_ranker_v1/metadata.json
```

Expected:

- `model_version` is `restaurant_ranker_v1`.
- `feature_version` is `restaurant_recommendation_v1`.
- `input_size` is `25`.

### Authentication Checklist

Create or reuse a test user in Firebase Emulator UI:

```text
http://localhost:4000/auth
```

Get a Firebase emulator ID token for that user and export it:

```bash
export TOKEN=<firebase-emulator-id-token>
export API=http://localhost:3000
```

Verify a protected endpoint:

```bash
curl -s "$API/users/me/preferences" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

- HTTP `200`.
- Empty/default preferences or the user's saved preferences.

## Scenario 1: Rule-Based Recommendation Happy Path

Purpose: confirm the backend can generate recommendations without Python ML.

Setup:

- `RECOMMENDATION_SCORER=rule_based`.
- Backend restarted after env change.
- Valid Google Places key or enough cached restaurants near the test location.

Run:

```bash
curl -s -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected API result:

- `sessionId` is present.
- `strategy` is `RULE_BASED_V1`.
- `hero` is present.
- `secondary` is an array.
- Each recommendation has a `recommendationId`, `restaurantId`, `score`, and
  distance/rating fields where provider data exists.

Database checks:

- A row exists in `recommendation_sessions`.
- Rows exist in `recommendations` for the returned session.
- `feature_version` is `restaurant_recommendation_v1`.
- `fallback_reason` is null unless candidate generation had to use fallback.

## Scenario 2: Multiple Cuisine And Ambiance Preferences

Purpose: confirm saved user preferences support many preferred cuisines and
ambiance types, and generation uses them.

Run:

```bash
curl -s -X PUT "$API/users/me/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "favoriteCuisines": ["japanese", "italian", "seafood"],
    "preferredAmbiance": ["casual", "romantic"],
    "budgetLevel": 3
  }'
```

Verify:

```bash
curl -s "$API/users/me/preferences" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

- All cuisine values are returned as an array.
- All ambiance values are returned as an array.
- Values are normalized to lowercase underscore format if spaces were sent.

Generate recommendations again:

```bash
curl -s -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected:

- Request still only requires location.
- Backend loads the saved arrays for the authenticated user.
- Recommendations are returned and persisted.
- Debug/config snapshots should reflect recommendation settings; preferences
  should be visible through the user preferences endpoint.

## Scenario 3: TensorFlow Recommendation Happy Path

Purpose: confirm Nest calls Python `/predict` and persists an ML-scored session.

Setup:

- `RECOMMENDATION_SCORER=tensorflow`.
- `PREDICTION_SERVICE_URL=http://localhost:8000`.
- `PREDICTION_SERVICE_TOKEN=local-prediction-token`.
- Trained model artifact exists.
- Restart `prediction-service` after model generation if it was already running.
- Restart Nest after env changes.

Check Python health:

```bash
curl -s http://localhost:8000/health
```

Expected:

- `status` is `ok`.
- `modelLoaded` is `true`.
- `modelVersion` is `restaurant_ranker_v1`.
- `featureVersion` is `restaurant_recommendation_v1`.

Generate recommendations:

```bash
curl -s -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected API result:

- `strategy` is `TENSORFLOW_V1`.
- `hero` is present.
- `secondary` is present.
- Scores are within `0..1`.

Service checks:

- Python service logs show a `/predict` request.
- Nest does not log prediction fallback for the request.

Database checks:

- `recommendation_sessions.strategy` is `TENSORFLOW_V1`.
- `model_version` is `restaurant_ranker_v1`.
- `fallback_reason` is null.
- `config_snapshot` includes the active recommendation config.

## Scenario 4: Prediction Service Fallback

Purpose: confirm recommendation generation still works when Python is down.

Setup:

- Keep `RECOMMENDATION_SCORER=tensorflow`.
- Stop only the prediction service:

```bash
docker compose stop prediction-service
```

Run:

```bash
curl -s -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected API result:

- Request succeeds.
- `hero` and `secondary` are still returned.
- Strategy is rule-based fallback behavior.

Database checks:

- `recommendation_sessions.strategy` is `RULE_BASED_V1`.
- `fallback_reason` is `PREDICTION_SERVICE_UNAVAILABLE`.
- `model_version` is `NONE`.
- `config_snapshot` preserves the attempted TensorFlow configuration.

Recovery:

```bash
docker compose start prediction-service
```

Repeat Scenario 3 and expect ML scoring again.

## Scenario 5: Prediction Service Auth Rejection

Purpose: confirm Python rejects invalid service tokens and Nest falls back.

Direct Python check:

```bash
curl -s -X POST http://localhost:8000/predict \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{
    "modelVersion": "restaurant_ranker_v1",
    "featureVersion": "restaurant_recommendation_v1",
    "userFeatures": {},
    "contextFeatures": {},
    "restaurantFeatures": [
      { "restaurantId": "manual-test", "features": {} }
    ]
  }'
```

Expected:

- HTTP `401`.
- Error mentions invalid prediction service token.

Nest fallback check:

- Temporarily set Nest `PREDICTION_SERVICE_TOKEN` to a wrong value.
- Restart Nest.
- Generate recommendations.

Expected:

- Request succeeds through fallback.
- Session records `fallback_reason = PREDICTION_SERVICE_UNAVAILABLE`.

## Scenario 6: Feedback And Learning Loop

Purpose: confirm recommendation feedback persists and updates learned profile
signals.

Generate recommendations and capture a `recommendationId` from `hero` or
`secondary`.

Send positive feedback:

```bash
curl -s -X POST "$API/recommendations/<recommendation-id>/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "type": "LIKE" }'
```

Send rating feedback:

```bash
curl -s -X POST "$API/recommendations/<recommendation-id>/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "type": "RATING", "rating": 5 }'
```

Expected API result:

- HTTP `201` or success response from the controller.
- Response identifies the recorded interaction.

Database checks:

- `recommendation_interactions` has append-only rows.
- `recommendation_feedback_state` has the latest state for that user and
  recommendation.
- `restaurant_ratings` is upserted for rating feedback.
- `user_profiles` affinity fields are updated.

Follow-up recommendation check:

- Generate recommendations again.
- Confirm the request still succeeds.
- Inspect ranking changes manually if enough similar candidates exist.

## Scenario 7: Recommendation History

Purpose: confirm generated sessions are visible to the user.

Run:

```bash
curl -s "$API/recommendations/history" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

- Recent sessions are returned for the authenticated user.
- Sessions include hero/secondary recommendations.
- Sessions generated by another test user are not returned.

## Scenario 8: Training Dataset Export

Purpose: confirm the backend can export first-party training rows from recorded
feedback.

Setup:

- Run at least one recommendation generation.
- Record at least one `LIKE`, `DISLIKE`, or `RATING` feedback event.

Run:

```bash
curl -s "$API/recommendations/ml/training-dataset" \
  -H "Authorization: Bearer $TOKEN" \
  > /tmp/backend-training-dataset.json
```

Expected:

- JSON contains `datasetVersion`, `featureVersion`, `source`, `createdAt`, and
  `rows`.
- Rows include `userFeatures`, `restaurantFeatures`, `contextFeatures`, and
  `label`.
- Ratings follow app thresholds:
  - `LIKE` maps to `1`.
  - `DISLIKE` maps to `0`.
  - rating `>= 4` maps to `1`.
  - rating `<= 2` maps to `0`.
  - rating `3` is ignored.

Optional validation:

```bash
python -m json.tool /tmp/backend-training-dataset.json >/dev/null
```

## Scenario 9: Cold Start User

Purpose: confirm a user with no preferences or profile still gets useful
recommendations.

Setup:

- Create a second Firebase emulator user.
- Export that user's token as `TOKEN`.
- Do not save preferences.

Run:

```bash
curl -s "$API/users/me/preferences" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

- Empty arrays for cuisine and ambiance.
- `budgetLevel` is null.

Generate recommendations:

```bash
curl -s -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected:

- Request succeeds.
- Scoring uses neutral preference defaults.
- Session is persisted for the second user only.

## Scenario 10: Bad Request And Auth Guards

Purpose: confirm validation and authentication failures are clear.

Missing auth:

```bash
curl -i -X POST "$API/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -22.9068,
    "longitude": -47.0626
  }'
```

Expected:

- HTTP `401` or auth guard failure.

Invalid location:

```bash
curl -i -X POST "$API/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -999,
    "longitude": -47.0626,
    "radiusMeters": 5000
  }'
```

Expected:

- HTTP `400`.
- Validation error mentions latitude bounds.

Invalid preferences:

```bash
curl -i -X PUT "$API/users/me/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "favoriteCuisines": ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"],
    "preferredAmbiance": [],
    "budgetLevel": 3
  }'
```

Expected:

- HTTP `400`.
- Validation rejects more than 10 cuisines.

## Database Inspection Queries

Use these when you need to confirm persistence manually:

```bash
docker compose exec postgres psql -U admin -d goeat_db
```

Recent sessions:

```sql
select id, user_id, strategy, model_version, feature_version, fallback_reason, created_at
from recommendation_sessions
order by created_at desc
limit 10;
```

Recommendations for a session:

```sql
select id, session_id, restaurant_id, rank, role, score
from recommendations
where session_id = '<session-id>'
order by rank asc;
```

Feedback:

```sql
select user_id, recommendation_id, interaction_type, rating, created_at
from recommendation_interactions
order by created_at desc
limit 20;
```

User preferences:

```sql
select user_id, favorite_cuisines, preferred_ambiance, budget_level
from user_preferences
order by updated_at desc
limit 10;
```

User profile learning:

```sql
select user_id, cuisine_affinities, ambiance_affinities, budget_affinity, updated_at
from user_profiles
order by updated_at desc
limit 10;
```

## Pass Criteria

The manual E2E pass is acceptable when:

- Rule-based generation returns hero and secondary recommendations.
- Saved multi-value preferences are accepted and used during generation.
- ML generation returns recommendations with `TENSORFLOW_V1` when Python is
  healthy and the model is loaded.
- Stopping or misconfiguring Python falls back without breaking the API.
- Feedback writes interaction/state/rating/profile records.
- History returns only the authenticated user's sessions.
- Training dataset export returns valid JSON with labeled rows after feedback.

## Notes

- `POST /recommendations` does not accept one-off cuisine filters today. It uses
  the authenticated user's saved preferences.
- If Google Places quota or network access is unavailable, run the happy path
  once while Google is available, then use cached restaurants for fallback
  checks.
- The generated model artifact and local Python virtualenv are intentionally
  ignored by git.
