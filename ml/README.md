# GoEat ML

This folder contains the first machine-learning scaffolding for restaurant ranking.

## Prediction Service

Host Python is not required when running the prediction service through Docker
Compose. Docker builds the Python runtime from `ml/prediction_service/Dockerfile`.

```bash
cd ml/prediction_service
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

NestJS can use it with:

```text
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:8000
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
```

If the service is unavailable, NestJS falls back to the rule-based scorer.

For Docker Compose local development, the service mounts:

```text
ml/artifacts/restaurant_ranker_v1/model -> /model
```

## Firebase Functions

The same prediction code is exposed as Firebase Python HTTPS functions from
`ml/prediction_service/main.py`:

```text
health
predict
```

Local Firebase emulator base URL:

```text
http://localhost:5001/demo-goeat/us-central1
```

NestJS can call the Firebase-hosted recommender with:

```env
RECOMMENDATION_SCORER=tensorflow
PREDICTION_SERVICE_URL=http://localhost:5001/demo-goeat/us-central1
PREDICTION_SERVICE_TOKEN=local-prediction-token
RECOMMENDATION_MODEL_VERSION=restaurant_ranker_v1
```

## Training

The commands below run Python directly on your machine. Install Python 3.12+
first, or run them inside a Python container.

Prepare the local CSV dataset from `ml/data`:

```bash
python ml/training/prepare_external_dataset.py \
  --output /tmp/goeat-training-dataset.json
```

The script auto-detects the local `goeat-local` schema:

- `users.csv`: `age`, `gender`, `profession`, and Big Five personality scores.
- `restaurants.csv`: `cuisine`, capacity, terrace/VIP flags, average bill,
  staffing, and Michelin stars.
- `ratings.csv`: `user_id`, `restaurant_id`, and numeric ratings.

Local ratings are normalized to `0..1` soft labels by default because the
dataset is on a wider scale than the app's first-party 1-5 ratings.

Prepare a generic CSV dataset:

```bash
python ml/training/prepare_external_dataset.py \
  --users users.csv \
  --restaurants restaurants.csv \
  --ratings ratings.csv \
  --output external-dataset.json \
  --profile generic \
  --label-mode binary
```

Export a first-party dataset from NestJS:

```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:3000/recommendations/ml/training-dataset > dataset.json
```

Train a model:

```bash
python ml/training/train_ranker.py \
  --dataset /tmp/goeat-training-dataset.json \
  --output ml/artifacts/restaurant_ranker_v1 \
  --model-version restaurant_ranker_v1
```
