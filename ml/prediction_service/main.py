from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from firebase_functions import https_fn
from pydantic import ValidationError

import app as prediction_app


def _json_response(body: dict[str, Any], status: int = 200) -> https_fn.Response:
    return https_fn.Response(
        json.dumps(body),
        status=status,
        headers={"Content-Type": "application/json"},
    )


def _load_model_once() -> None:
    if prediction_app.model is None:
        prediction_app.model = prediction_app.load_model()


@https_fn.on_request()
def health(req: https_fn.Request) -> https_fn.Response:
    _load_model_once()

    return _json_response(prediction_app.health())


@https_fn.on_request()
def predict(req: https_fn.Request) -> https_fn.Response:
    if req.method != "POST":
        return _json_response({"detail": "Method not allowed"}, status=405)

    _load_model_once()

    try:
        payload = prediction_app.PredictRequest.model_validate(
            req.get_json(silent=True) or {},
        )
        result = prediction_app.predict(
            payload,
            authorization=req.headers.get("Authorization"),
        )
        return _json_response(result)
    except HTTPException as error:
        return _json_response({"detail": error.detail}, status=error.status_code)
    except ValidationError as error:
        return _json_response({"detail": error.errors()}, status=422)
