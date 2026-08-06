from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf


def main() -> None:
    parser = argparse.ArgumentParser(description="Train GoEat restaurant ranker")
    parser.add_argument("--dataset", required=True, help="Path to dataset JSON")
    parser.add_argument("--output", required=True, help="Directory for model artifact")
    parser.add_argument("--model-version", default="restaurant_ranker_v1")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--validation-split", type=float, default=0.2)
    args = parser.parse_args()

    dataset = json.loads(Path(args.dataset).read_text())
    rows = dataset["rows"]
    if not rows:
        raise ValueError("Dataset has no rows")

    x = np.array([vectorize(row) for row in rows], dtype=np.float32)
    y = np.array([row["label"] for row in rows], dtype=np.float32)
    model = build_model(x.shape[1], label_mode=dataset.get("labelMode", "binary"))
    history = model.fit(x, y, epochs=args.epochs, validation_split=args.validation_split, verbose=1)
    metrics = evaluate(model, x, y)

    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    model.export(output / "model")
    model.save(output / "model.keras")
    (output / "metadata.json").write_text(
        json.dumps(
            {
                "model_name": "restaurant_ranker",
                "model_version": args.model_version,
                "feature_version": dataset["featureVersion"],
                "dataset_version": dataset["datasetVersion"],
                "label_mode": dataset.get("labelMode", "binary"),
                "schema_profile": dataset.get("schemaProfile"),
                "training_rows": len(rows),
                "input_size": int(x.shape[1]),
                "metrics": metrics,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "training_history": history.history,
                "artifact_uri": os.fspath(output / "model"),
                "keras_artifact_uri": os.fspath(output / "model.keras"),
            },
            indent=2,
        )
    )


def build_model(input_size: int, label_mode: str) -> tf.keras.Model:
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(input_size,)),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    if label_mode == "normalized":
        loss = "mse"
        metrics: list[Any] = ["mae"]
    else:
        loss = "binary_crossentropy"
        metrics = [
            "accuracy",
            tf.keras.metrics.AUC(name="auc"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ]

    model.compile(
        optimizer="adam",
        loss=loss,
        metrics=metrics,
    )
    return model


def evaluate(model: tf.keras.Model, x: np.ndarray, y: np.ndarray) -> dict[str, float]:
    values = model.evaluate(x, y, verbose=0, return_dict=True)
    predictions = model.predict(x, verbose=0).reshape(-1)
    values["precision_at_5"] = precision_at_k(predictions, y, 5)
    values["ndcg_at_5"] = ndcg_at_k(predictions, y, 5)
    return {key: float(value) for key, value in values.items()}


def vectorize(row: dict[str, Any]) -> list[float]:
    user = row["userFeatures"]
    restaurant = row["restaurantFeatures"]
    context = row["contextFeatures"]
    return [
        float(user.get("budgetLevel") or 0) / 5.0,
        float(user.get("age") or 0) / 100.0,
        float(user.get("big5Openness") or 0),
        float(user.get("big5Conscientiousness") or 0),
        float(user.get("big5Extraversion") or 0),
        float(user.get("big5Agreeableness") or 0),
        float(user.get("big5Neuroticism") or 0),
        float(restaurant.get("cuisineMatch") or 0),
        float(restaurant.get("budgetMatch") or 0),
        float(restaurant.get("ambianceMatch") or 0),
        float(restaurant.get("normalizedRating") or 0),
        float(restaurant.get("normalizedDistance") or 0),
        float(restaurant.get("popularityScore") or 0),
        float(restaurant.get("openNow") or 0),
        float(restaurant.get("priceLevel") or 0) / 5.0,
        float(restaurant.get("normalizedAvgBill") or 0),
        float(restaurant.get("normalizedSeats") or 0),
        float(restaurant.get("normalizedHallArea") or 0),
        float(restaurant.get("normalizedHallsCount") or 0),
        float(restaurant.get("normalizedStaffCount") or 0),
        float(restaurant.get("hasSummerTerrace") or 0),
        float(restaurant.get("hasVipZone") or 0),
        float(restaurant.get("michelinScore") or 0),
        float(context.get("dayOfWeek") or 0) / 6.0,
        float(context.get("hourOfDay") or 0) / 23.0,
    ]


def precision_at_k(predictions: np.ndarray, labels: np.ndarray, k: int) -> float:
    indexes = np.argsort(predictions)[::-1][:k]
    return float(np.mean(labels[indexes])) if len(indexes) else 0.0


def ndcg_at_k(predictions: np.ndarray, labels: np.ndarray, k: int) -> float:
    indexes = np.argsort(predictions)[::-1][:k]
    gains = labels[indexes]
    discounts = 1.0 / np.log2(np.arange(2, len(gains) + 2))
    dcg = float(np.sum(gains * discounts))
    ideal = np.sort(labels)[::-1][:k]
    ideal_dcg = float(np.sum(ideal * discounts[: len(ideal)]))
    return dcg / ideal_dcg if ideal_dcg else 0.0


if __name__ == "__main__":
    main()
