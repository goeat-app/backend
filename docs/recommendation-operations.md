# Recommendation Operations

This document covers monitoring, configuration, fallback behavior, maintenance
jobs, and debugging for the recommendation platform.

## Configuration

Recommendation behavior is controlled by environment variables.

### Scoring

```env
RECOMMENDATION_SCORER=rule_based
RECOMMENDATION_RULE_WEIGHTS={"cuisineMatch":0.35,"budgetMatch":0.25,"ambianceMatch":0.2,"rating":0.1,"distance":0.1}
```

Use ML scoring:

```env
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:8000
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
```

### Candidate Generation

```env
RECOMMENDATION_DEFAULT_RADIUS_METERS=5000
RECOMMENDATION_MAX_RADIUS_METERS=12000
RECOMMENDATION_MINIMUM_CANDIDATES=20
RECOMMENDATION_IDEAL_CANDIDATES=50
```

### Business Rules

```env
RECOMMENDATION_HERO_COUNT=1
RECOMMENDATION_SECONDARY_COUNT=4
RECOMMENDATION_RECENTLY_SHOWN_SUPPRESSION_HOURS=24
RECOMMENDATION_MINIMUM_CUISINE_DIVERSITY=2
RECOMMENDATION_CONFIG_VERSION=recommendation_ops_v1
```

Every session stores a config snapshot in
`recommendation_sessions.config_snapshot`.

## Required External Configuration

### Google Places

Nearby discovery requires:

```env
GOOGLE_PLACES_API_KEY=<google-places-api-key>
```

The backend calls:

```text
POST https://places.googleapis.com/v1/places:searchNearby
GET  https://places.googleapis.com/v1/places/{placeId}
```

The key must be allowed to use the Google Places API. Restrict the key by
environment and deployment needs.

### Firebase Auth

Protected APIs require Firebase ID tokens. Local development can use:

```env
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
EMULATOR_PROJECT_ID=demo-goeat
```

### PostgreSQL

All recommendation sessions, feedback, preferences, and cached restaurants are
stored in PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

Run migrations before using the recommendation APIs:

```bash
yarn db:migrate
```

## Structured Logs

Each recommendation request logs a JSON payload with:

- `userId`
- `sessionId`
- `strategy`
- `featureVersion`
- `candidateCount`
- `selectedCount`
- `radiusMeters`
- `googlePlacesLatencyMs`
- `scoringLatencyMs`
- `totalLatencyMs`
- `fallbackReason`

Feedback events log:

- `userId`
- `recommendationId`
- `type`
- `rating`

Background jobs log:

- `job`
- `status`
- `durationMs`
- `processedCount`
- `error`

## Fallbacks

Fallback reasons are stored in `recommendation_sessions.fallback_reason`.

Current reasons include:

- `GOOGLE_PLACES_UNAVAILABLE`
- `RECENTLY_SHOWN_SUPPRESSION_RELAXED`
- `FEATURE_STORE_FAILURE`
- `SCORER_FAILURE`
- `PREDICTION_SERVICE_UNAVAILABLE`

Behavior:

- Google Places unavailable -> cached nearby restaurants.
- Recently shown suppression too strict -> suppression is relaxed.
- Feature Store failure -> minimal popular-nearby features.
- Prediction service unavailable or invalid -> rule-based scoring.
- Scorer failure -> popular-nearby scoring.

## Maintenance Jobs

Jobs can be run manually through protected admin endpoints or enabled as an
in-process scheduler.

Enable scheduler:

```env
RECOMMENDATION_JOBS_ENABLED=true
RECOMMENDATION_JOBS_INTERVAL_HOURS=24
```

Manual endpoints:

```http
POST /admin/recommendation-sessions/jobs/refresh-restaurants
POST /admin/recommendation-sessions/jobs/recompute-user-profiles
```

Admin access requires Firebase auth and the user's email must be listed in:

```env
RECOMMENDATION_ADMIN_EMAILS=admin@example.com,ops@example.com
```

### Restaurant Refresh Job

Refreshes stale Google-backed restaurants through Google Place Details and
upserts Google-owned fields. App-owned fields are preserved.

### User Profile Recompute Job

Rebuilds learned profile affinities from recommendation interaction history.
This helps correct drift from incremental updates.

## Debugging

Inspect a recommendation session:

```http
GET /admin/recommendation-sessions/:sessionId
```

Response includes:

- user preferences used
- strategy
- model version
- feature version
- candidate count
- radius
- fallback reason
- config snapshot
- final ranking
- score breakdown

Inspect current recommendation config:

```http
GET /admin/recommendation-sessions/config/current
```

## Useful Local Checks

Run recommendation unit tests:

```bash
npm test -- --runInBand modules/recommendation
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

