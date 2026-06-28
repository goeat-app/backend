# Recommendation Platform

This document explains the recommendation backend added around Google Places,
rule-based scoring, user learning, ML scoring, and operational tooling.

## Architecture

The recommendation request flow is:

```text
POST /recommendations
  -> Google Places nearby discovery
  -> restaurant upsert/cache
  -> candidate generation and hard filters
  -> Feature Store v1
  -> RecommendationScorer
  -> business selection
  -> recommendation session persistence
  -> response with hero + secondary recommendations
```

The scorer is pluggable:

- `RuleBasedRecommendationScorer` is the default.
- `TensorFlowRecommendationScorer` is enabled with
  `RECOMMENDATION_SCORER=tensorflow`.
- `PopularNearbyRecommendationScorer` is used as an internal fallback when
  feature generation or scoring cannot run safely.

## Public API

All recommendation APIs that use user state require Firebase authentication:

```http
Authorization: Bearer <firebase-id-token>
```

### Generate Recommendations

```http
POST /recommendations
```

Request:

```json
{
  "latitude": -22.9068,
  "longitude": -47.0626,
  "radiusMeters": 5000
}
```

Response:

```json
{
  "sessionId": "uuid",
  "strategy": "RULE_BASED_V1",
  "hero": {
    "recommendationId": "uuid",
    "restaurantId": "uuid",
    "name": "Sushi House",
    "score": 0.92,
    "rating": 4.7,
    "ratingCount": 1200,
    "priceLevel": 2,
    "distanceMeters": 850
  },
  "secondary": []
}
```

### Recommendation History

```http
GET /recommendations/history
```

Returns recent persisted recommendation sessions for the authenticated user.

### User Preferences

```http
GET /users/me/preferences
PUT /users/me/preferences
```

`PUT` request:

```json
{
  "favoriteCuisines": ["japanese", "italian"],
  "preferredAmbiance": ["casual", "romantic"],
  "budgetLevel": 2
}
```

Preferences are stored in `user_preferences`. If the new preference record does
not exist yet, the feature store falls back to the older profile mapping data.

### Recommendation Feedback

```http
POST /recommendations/:recommendationId/feedback
```

Examples:

```json
{ "type": "LIKE" }
```

```json
{ "type": "DISLIKE" }
```

```json
{ "type": "RATING", "rating": 5 }
```

Feedback creates immutable `recommendation_interactions`, updates
`recommendation_feedback_state`, upserts `restaurant_ratings` for ratings, and
updates `user_profiles` incrementally.

## Data Model

The recommendation platform uses these tables:

- `restaurants`
- `user_preferences`
- `user_profiles`
- `recommendation_sessions`
- `recommendations`
- `recommendation_interactions`
- `recommendation_feedback_state`
- `restaurant_ratings`
- `ml_models`

Important persistence behavior:

- Restaurants discovered from Google are matched by
  `provider + provider_place_id`.
- Google-owned restaurant fields are updated during sync.
- App-owned fields such as internal ratings, roles, menu data, and learned
  profile information are not overwritten by Google sync.
- Recommendation sessions are immutable.
- Feedback events are append-only.

## Feature Store

Feature Store v1 uses:

- Explicit preferences from `user_preferences`.
- Fallback preferences from profile mapping when explicit preferences are
  missing.
- Learned affinities from `user_profiles`.
- Restaurant Google fields such as type, price level, rating, rating count, open
  status, and distance.
- Request context such as radius, timestamp, day of week, and hour.

Feature version:

```text
restaurant_recommendation_v1
```

Every recommendation session stores the feature version and a config snapshot.

## Fallback Behavior

The API is designed to keep returning useful recommendations when possible:

- Google Places failure: use cached nearby restaurants.
- Too few candidates: expand radius, then relax recently-shown suppression.
- Feature Store failure: use minimal popular-nearby features.
- Prediction service failure: use rule-based scoring and record
  `fallback_reason = PREDICTION_SERVICE_UNAVAILABLE`.
- General scoring failure: use `PopularNearbyRecommendationScorer`.

Fallback usage is stored in `recommendation_sessions.fallback_reason` and logged.

