import importlib
import os
import unittest

from fastapi.testclient import TestClient


class PredictionServiceTest(unittest.TestCase):
    def setUp(self):
        os.environ["MODEL_VERSION"] = "restaurant_ranker_v1"
        os.environ["FEATURE_VERSION"] = "restaurant_recommendation_v1"
        os.environ["PREDICTION_SERVICE_TOKEN"] = "secret-token"
        os.environ["PREDICTION_ALLOW_HEURISTIC"] = "true"

        import app

        self.app_module = importlib.reload(app)
        self.app_module.model = None
        self.client = TestClient(self.app_module.app)

    def test_health_reports_model_state(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "modelLoaded": False,
                "modelVersion": "restaurant_ranker_v1",
                "featureVersion": "restaurant_recommendation_v1",
            },
        )

    def test_predict_rejects_missing_token(self):
        response = self.client.post("/predict", json=self.payload())

        self.assertEqual(response.status_code, 401)

    def test_predict_rejects_invalid_token(self):
        response = self.client.post(
            "/predict",
            json=self.payload(),
            headers={"Authorization": "Bearer wrong"},
        )

        self.assertEqual(response.status_code, 401)

    def test_predict_rejects_version_mismatch(self):
        payload = self.payload()
        payload["featureVersion"] = "other"

        response = self.client.post(
            "/predict",
            json=payload,
            headers={"Authorization": "Bearer secret-token"},
        )

        self.assertEqual(response.status_code, 400)

    def test_predict_returns_clamped_scores_for_each_restaurant(self):
        response = self.client.post(
            "/predict",
            json=self.payload(),
            headers={"Authorization": "Bearer secret-token"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["modelVersion"], "restaurant_ranker_v1")
        self.assertEqual(body["featureVersion"], "restaurant_recommendation_v1")
        self.assertEqual(len(body["scores"]), 1)
        self.assertEqual(body["scores"][0]["restaurantId"], "restaurant-1")
        self.assertGreaterEqual(body["scores"][0]["score"], 0)
        self.assertLessEqual(body["scores"][0]["score"], 1)

    def test_predict_rejects_heuristic_mode_when_disabled(self):
        os.environ["PREDICTION_ALLOW_HEURISTIC"] = "false"
        self.app_module = importlib.reload(self.app_module)
        self.app_module.model = None
        client = TestClient(self.app_module.app)

        response = client.post(
            "/predict",
            json=self.payload(),
            headers={"Authorization": "Bearer secret-token"},
        )

        self.assertEqual(response.status_code, 503)

    def payload(self):
        return {
            "modelVersion": "restaurant_ranker_v1",
            "featureVersion": "restaurant_recommendation_v1",
            "userFeatures": {"budgetLevel": 2},
            "contextFeatures": {"dayOfWeek": 1, "hourOfDay": 18},
            "restaurantFeatures": [
                {
                    "restaurantId": "restaurant-1",
                    "features": {
                        "cuisineMatch": 1,
                        "budgetMatch": 1,
                        "ambianceMatch": 1,
                        "normalizedRating": 1,
                        "normalizedDistance": 1,
                        "popularityScore": 1,
                        "openNow": 1,
                    },
                }
            ],
        }


if __name__ == "__main__":
    unittest.main()
