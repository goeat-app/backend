from __future__ import annotations

import os
from typing import Any

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

try:
    import tensorflow as tf
except Exception:  # pragma: no cover - allows health checks without TF locally
    tf = None


MODEL_VERSION = os.getenv("MODEL_VERSION", "restaurant_ranker_v1")
FEATURE_VERSION = os.getenv("FEATURE_VERSION", "restaurant_recommendation_v1")
MODEL_PATH = os.getenv("MODEL_PATH", "model")
PREDICTION_SERVICE_TOKEN = os.getenv("PREDICTION_SERVICE_TOKEN")
ALLOW_HEURISTIC_PREDICTIONS = (
    os.getenv("PREDICTION_ALLOW_HEURISTIC", "true").lower() == "true"
)

app = FastAPI(title="GoEat Recommendation Prediction Service")
model = None


class RestaurantFeaturePayload(BaseModel):
    restaurantId: str
    features: dict[str, Any] = Field(default_factory=dict)


class PredictRequest(BaseModel):
    modelVersion: str = MODEL_VERSION
    featureVersion: str = FEATURE_VERSION
    userFeatures: dict[str, Any] = Field(default_factory=dict)
    contextFeatures: dict[str, Any] = Field(default_factory=dict)
    restaurantFeatures: list[RestaurantFeaturePayload]


def load_model():
    if tf is None or not os.path.exists(MODEL_PATH):
        return None

    if os.path.isdir(MODEL_PATH) and os.path.exists(
        os.path.join(MODEL_PATH, "saved_model.pb")
    ):
        return tf.keras.layers.TFSMLayer(MODEL_PATH, call_endpoint="serve")

    return tf.keras.models.load_model(MODEL_PATH)


@app.on_event("startup")
def startup() -> None:
    global model
    model = load_model()
    print(f"Model loaded: {model is not None}")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "modelLoaded": model is not None,
        "modelVersion": MODEL_VERSION,
        "featureVersion": FEATURE_VERSION,
    }


@app.post("/predict")
def predict(
    payload: PredictRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    authorize(authorization)
    validate_versions(payload)

    vectors = np.array(
        [vectorize(payload.userFeatures, payload.contextFeatures, item.features) for item in payload.restaurantFeatures],
        dtype=np.float32,
    )

    if model is not None and len(vectors):
        predictions = predict_model(model, vectors)
    else:
        if not ALLOW_HEURISTIC_PREDICTIONS:
            raise HTTPException(status_code=503, detail="Model is not loaded")
        predictions = np.array([heuristic_score(item.features) for item in payload.restaurantFeatures])

    return {
        "modelVersion": payload.modelVersion,
        "featureVersion": payload.featureVersion,
        "scores": [
            {
                "restaurantId": item.restaurantId,
                "score": float(max(0.0, min(1.0, predictions[index]))),
            }
            for index, item in enumerate(payload.restaurantFeatures)
        ],
    }


def predict_model(loaded_model: Any, vectors: np.ndarray) -> np.ndarray:
    if hasattr(loaded_model, "predict"):
        return loaded_model.predict(vectors, verbose=0).reshape(-1)

    output = loaded_model(vectors)
    if isinstance(output, dict):
        output = next(iter(output.values()))
    return output.numpy().reshape(-1)


def authorize(authorization: str | None) -> None:
    if not PREDICTION_SERVICE_TOKEN:
        return

    expected = f"Bearer {PREDICTION_SERVICE_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid prediction service token")


def validate_versions(payload: PredictRequest) -> None:
    if payload.modelVersion != MODEL_VERSION:
        raise HTTPException(status_code=400, detail="Unsupported model version")

    if payload.featureVersion != FEATURE_VERSION:
        raise HTTPException(status_code=400, detail="Unsupported feature version")


def vectorize(
    user_features: dict[str, Any],
    context_features: dict[str, Any],
    restaurant_features: dict[str, Any],
) -> list[float]:
    return [
        float(user_features.get("budgetLevel") or 0) / 5.0,
        float(user_features.get("age") or 0) / 100.0,
        float(user_features.get("big5Openness") or 0),
        float(user_features.get("big5Conscientiousness") or 0),
        float(user_features.get("big5Extraversion") or 0),
        float(user_features.get("big5Agreeableness") or 0),
        float(user_features.get("big5Neuroticism") or 0),
        float(restaurant_features.get("cuisineMatch") or 0),
        float(restaurant_features.get("budgetMatch") or 0),
        float(restaurant_features.get("ambianceMatch") or 0),
        float(restaurant_features.get("normalizedRating") or 0),
        float(restaurant_features.get("normalizedDistance") or 0),
        float(restaurant_features.get("popularityScore") or 0),
        float(restaurant_features.get("openNow") or 0),
        float(restaurant_features.get("priceLevel") or 0) / 5.0,
        float(restaurant_features.get("normalizedAvgBill") or 0),
        float(restaurant_features.get("normalizedSeats") or 0),
        float(restaurant_features.get("normalizedHallArea") or 0),
        float(restaurant_features.get("normalizedHallsCount") or 0),
        float(restaurant_features.get("normalizedStaffCount") or 0),
        float(restaurant_features.get("hasSummerTerrace") or 0),
        float(restaurant_features.get("hasVipZone") or 0),
        float(restaurant_features.get("michelinScore") or 0),
        float(context_features.get("dayOfWeek") or 0) / 6.0,
        float(context_features.get("hourOfDay") or 0) / 23.0,
    ]


def heuristic_score(features: dict[str, Any]) -> float:
    return (
        0.35 * float(features.get("cuisineMatch") or 0)
        + 0.25 * float(features.get("budgetMatch") or 0)
        + 0.20 * float(features.get("ambianceMatch") or 0)
        + 0.10 * float(features.get("normalizedRating") or 0)
        + 0.10 * float(features.get("normalizedDistance") or 0)
    )
