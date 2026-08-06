# Recommendation ML Integration

This document covers the Python prediction service, NestJS scorer integration,
training dataset pipeline, and required external configuration.

## Runtime Shape

NestJS remains the recommendation orchestrator. Python only scores candidate
restaurants that Nest already generated.

```text
Nest recommendation pipeline
  -> Feature Store v1
  -> TensorFlowRecommendationScorer
  -> Python /predict
  -> scores
  -> Nest business selection + session persistence
```

The Python service is opt-in. Rule-based scoring remains the default.

```env
RECOMMENDATION_SCORER=rule_based
```

Enable ML scoring:

```env
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:8000
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
```

## Local Prediction Service

Docker Compose includes a `prediction-service` container:

```bash
docker compose up -d prediction-service
```

You do not need Python installed on your host machine to run this container.
Docker builds the Python runtime and dependencies from
`ml/prediction_service/Dockerfile`.

The service listens on:

```text
http://localhost:8000
```

The container mounts the model artifact from:

```text
ml/artifacts/restaurant_ranker_v1/model
```

into:

```text
/model
```

If no model exists and `PREDICTION_ALLOW_HEURISTIC=true`, the service uses a
local heuristic scorer. This is intended only for development. Production should
set:

```env
PREDICTION_ALLOW_HEURISTIC=false
```

## Firebase Python Prediction Functions

The Python recommender can also run as a Firebase Functions codebase from
`ml/prediction_service`.

Firebase exports two HTTPS functions:

```text
health
predict
```

Local emulator URLs:

```text
http://localhost:5001/demo-goeat/us-central1/health
http://localhost:5001/demo-goeat/us-central1/predict
```

When Nest should call the Python recommender through Firebase Functions, set the
base URL without the endpoint suffix:

```env
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:5001/demo-goeat/us-central1
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
```

The Firebase emulator Docker image mounts the local model artifacts at:

```text
/workspace/ml/artifacts
```

and sets:

```env
MODEL_PATH=/workspace/ml/artifacts/restaurant_ranker_v1/model
MODEL_VERSION=restaurant_ranker_v1
FEATURE_VERSION=restaurant_recommendation_v1
```

Production deploys should configure equivalent runtime variables. If no model
artifact is packaged or made available, keep `PREDICTION_ALLOW_HEURISTIC=false`
so deployment fails closed instead of silently using heuristic scoring.

## Python API

### Health

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "modelLoaded": true,
  "modelVersion": "restaurant_ranker_v1",
  "featureVersion": "restaurant_recommendation_v1"
}
```

Nest probes this endpoint on startup when
`RECOMMENDATION_SCORER=tensorflow`. Probe failure does not fail Nest startup;
recommendation requests still fall back per request.

### Predict

```http
POST /predict
Authorization: Bearer <PREDICTION_SERVICE_TOKEN>
```

Request:

```json
{
  "modelVersion": "restaurant_ranker_v1",
  "featureVersion": "restaurant_recommendation_v1",
  "userFeatures": {},
  "contextFeatures": {},
  "restaurantFeatures": [
    {
      "restaurantId": "uuid",
      "features": {}
    }
  ]
}
```

Response:

```json
{
  "modelVersion": "restaurant_ranker_v1",
  "featureVersion": "restaurant_recommendation_v1",
  "scores": [
    {
      "restaurantId": "uuid",
      "score": 0.91
    }
  ]
}
```

The Python service validates:

- Bearer token when `PREDICTION_SERVICE_TOKEN` is configured.
- `modelVersion`.
- `featureVersion`.
- Model availability when heuristic scoring is disabled.

Nest validates the returned model version, feature version, score count,
restaurant ids, and score numeric shape before accepting ML scores.

## Training Dataset Export

First-party dataset export:

```http
GET /recommendations/ml/training-dataset
Authorization: Bearer <firebase-id-token>
```

Example:

```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:3000/recommendations/ml/training-dataset > dataset.json
```

The dataset uses the same Feature Store definitions as inference and includes:

- `datasetVersion`
- `featureVersion`
- `source`
- `createdAt`
- labeled rows

Labels:

- `LIKE` -> `1`
- `DISLIKE` -> `0`
- rating `>= 4` -> `1`
- rating `<= 2` -> `0`
- rating `3` -> ignored

## External Dataset Preparation

The commands in this section run Python directly on your host machine. Install
Python 3.12+ and the prediction-service requirements first, or run the commands
inside a Python container.

Prepare the checked-in local CSV data from `ml/data`:

```bash
python ml/training/prepare_external_dataset.py \
  --output /tmp/goeat-training-dataset.json
```

The script auto-detects the `goeat-local` schema currently stored under
`ml/data`:

- `users.csv`: `age`, `gender`, `profession`, and Big Five personality scores.
- `restaurants.csv`: `cuisine`, `hall_area_m2`, `seats`, `halls_count`,
  `summer_terrace`, `vip_zone`, `avg_bill_rub`, `staff_count`, and
  `michelin_stars`.
- `ratings.csv`: `user_id`, `restaurant_id`, and numeric `rating`.

For this local schema the prepared dataset uses normalized `0..1` labels,
because ratings are wider than the app's first-party 1-5 scale. User cuisine,
budget, and ambiance affinities are derived from each user's prior ratings in
CSV order, while restaurant quality and popularity are derived from aggregate
rating statistics.

Prepare generic external CSV data:

```bash
python ml/training/prepare_external_dataset.py \
  --users users.csv \
  --restaurants restaurants.csv \
  --ratings ratings.csv \
  --output external-dataset.json \
  --profile generic \
  --label-mode binary
```

Expected CSV ids:

- `users.csv`: `user_id`
- `restaurants.csv`: `restaurant_id`
- `ratings.csv`: `user_id`, `restaurant_id`, `rating`

Optional CSV columns used when present:

- user: `favorite_cuisines`, `preferred_ambiance`, `budget_level`
- restaurant: `types`, `primary_type`, `price_level`, `rating`,
  `rating_count`

List values use `|` separators, for example:

```text
japanese|italian|burger
```

## Training

Training runs Python directly unless you wrap it in Docker. Install Python
3.12+ on the host only if you plan to run training scripts locally.

Install Python dependencies in a virtual environment:

```bash
cd ml/prediction_service
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

Train:

```bash
python ml/training/train_ranker.py \
  --dataset /tmp/goeat-training-dataset.json \
  --output ml/artifacts/restaurant_ranker_v1 \
  --model-version restaurant_ranker_v1
```

The training script writes:

```text
ml/artifacts/restaurant_ranker_v1/model
ml/artifacts/restaurant_ranker_v1/metadata.json
```

## Production Hosting

Production target is a separate Firebase Python HTTPS Function exposing the same
`/health` and `/predict` contract.

Required external resources:

- Firebase project with Python Functions enabled.
- Runtime environment variables for the Python service:
  - `MODEL_VERSION`
  - `FEATURE_VERSION`
  - `MODEL_PATH`
  - `PREDICTION_SERVICE_TOKEN`
  - `PREDICTION_ALLOW_HEURISTIC=false`
- Model artifact storage accessible by the Python function.
- Nest runtime env:
  - `RECOMMENDATION_SCORER=tensorflow`
  - `PREDICTION_SERVICE_URL=<python-function-url>`
  - `PREDICTION_SERVICE_TOKEN=<same-token>`
  - `RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1`

If production hosting changes later, Nest only needs a compatible
`PREDICTION_SERVICE_URL`.
