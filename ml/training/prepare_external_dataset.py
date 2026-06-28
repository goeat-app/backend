from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


FEATURE_VERSION = "restaurant_recommendation_v1"
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare external restaurant rating dataset")
    parser.add_argument("--users", default=DEFAULT_DATA_DIR / "users.csv", help="Users CSV")
    parser.add_argument("--restaurants", default=DEFAULT_DATA_DIR / "restaurants.csv", help="Restaurants CSV")
    parser.add_argument("--ratings", default=DEFAULT_DATA_DIR / "ratings.csv", help="Ratings CSV")
    parser.add_argument("--output", required=True, help="Output dataset JSON")
    parser.add_argument("--dataset-version", default=None)
    parser.add_argument(
        "--profile",
        choices=["auto", "goeat-local", "generic"],
        default="auto",
        help="Input schema profile. auto detects the ml/data CSV schema.",
    )
    parser.add_argument(
        "--label-mode",
        choices=["auto", "binary", "normalized"],
        default="auto",
        help="binary drops neutral ratings; normalized keeps each rating as a 0..1 soft label.",
    )
    args = parser.parse_args()

    users_rows = read_rows(args.users)
    restaurant_rows = read_rows(args.restaurants)
    rating_rows = read_rows(args.ratings)
    profile = detect_profile(args.profile, users_rows, restaurant_rows)
    label_mode = detect_label_mode(args.label_mode, profile)

    if profile == "goeat-local":
        dataset = prepare_goeat_local_dataset(
            users_rows=users_rows,
            restaurant_rows=restaurant_rows,
            rating_rows=rating_rows,
            label_mode=label_mode,
        )
    else:
        dataset = prepare_generic_dataset(
            users_rows=users_rows,
            restaurant_rows=restaurant_rows,
            rating_rows=rating_rows,
            label_mode=label_mode,
        )

    Path(args.output).write_text(
        json.dumps(
            {
                "datasetVersion": args.dataset_version or build_dataset_version(),
                "featureVersion": FEATURE_VERSION,
                "source": "EXTERNAL",
                "schemaProfile": profile,
                "labelMode": label_mode,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "rows": dataset["rows"],
                "metadata": dataset["metadata"],
            },
            indent=2,
        )
    )


def prepare_generic_dataset(
    users_rows: list[dict[str, str]],
    restaurant_rows: list[dict[str, str]],
    rating_rows: list[dict[str, str]],
    label_mode: str,
) -> dict[str, Any]:
    users = by_id(users_rows, "user_id")
    restaurants = by_id(restaurant_rows, "restaurant_id")
    rows = []
    rating_scale = infer_rating_scale(rating_rows)

    for rating in rating_rows:
        label = to_label(float(rating["rating"]), rating_scale, label_mode)
        if label is None:
            continue

        user = users.get(rating["user_id"], {})
        restaurant = restaurants.get(rating["restaurant_id"], {})
        rows.append(
            {
                "userFeatures": user_features(user),
                "restaurantFeatures": restaurant_features(user, restaurant),
                "contextFeatures": {
                    "latitude": 0,
                    "longitude": 0,
                    "radiusMeters": 0,
                    "requestedAt": datetime.now(timezone.utc).isoformat(),
                    "dayOfWeek": 0,
                    "hourOfDay": 0,
                },
                "label": label,
            }
        )

    return {
        "rows": rows,
        "metadata": {
            "ratingScale": rating_scale,
            "inputRows": len(rating_rows),
            "outputRows": len(rows),
        },
    }


def prepare_goeat_local_dataset(
    users_rows: list[dict[str, str]],
    restaurant_rows: list[dict[str, str]],
    rating_rows: list[dict[str, str]],
    label_mode: str,
) -> dict[str, Any]:
    users = by_id(users_rows, "user_id")
    restaurants = by_id(restaurant_rows, "restaurant_id")
    rating_scale = infer_rating_scale(rating_rows)
    restaurant_metrics = build_restaurant_metrics(rating_rows, rating_scale)
    restaurant_stats = numeric_stats(
        restaurant_rows,
        ["hall_area_m2", "seats", "halls_count", "avg_bill_rub", "staff_count", "michelin_stars"],
    )
    bill_breakpoints = quantile_breakpoints(
        [float_or_zero(row.get("avg_bill_rub")) for row in restaurant_rows],
        buckets=5,
    )
    user_profiles: dict[str, dict[str, Any]] = {}
    rows = []

    for index, rating in enumerate(rating_rows):
        user_id = rating["user_id"]
        restaurant_id = rating["restaurant_id"]
        restaurant = restaurants.get(restaurant_id)
        if restaurant is None:
            continue

        rating_value = float(rating["rating"])
        label = to_label(rating_value, rating_scale, label_mode)
        if label is None:
            update_user_profile(
                profile=user_profiles.setdefault(user_id, empty_user_profile()),
                restaurant=restaurant,
                rating_value=rating_value,
                rating_scale=rating_scale,
                bill_breakpoints=bill_breakpoints,
            )
            continue

        profile = user_profiles.setdefault(user_id, empty_user_profile())
        user = users.get(user_id, {})
        rows.append(
            {
                "userFeatures": goeat_user_features(user, profile),
                "restaurantFeatures": goeat_restaurant_features(
                    user_profile=profile,
                    restaurant=restaurant,
                    restaurant_metrics=restaurant_metrics.get(restaurant_id, {}),
                    restaurant_stats=restaurant_stats,
                    bill_breakpoints=bill_breakpoints,
                ),
                "contextFeatures": {
                    "latitude": 0,
                    "longitude": 0,
                    "radiusMeters": 0,
                    "requestedAt": datetime.now(timezone.utc).isoformat(),
                    "dayOfWeek": index % 7,
                    "hourOfDay": 12,
                },
                "label": label,
                "source": {
                    "rating": rating_value,
                    "userId": user_id,
                    "restaurantId": restaurant_id,
                },
            }
        )
        update_user_profile(
            profile=profile,
            restaurant=restaurant,
            rating_value=rating_value,
            rating_scale=rating_scale,
            bill_breakpoints=bill_breakpoints,
        )

    return {
        "rows": rows,
        "metadata": {
            "ratingScale": rating_scale,
            "inputRows": len(rating_rows),
            "outputRows": len(rows),
            "featureMapping": {
                "favoriteCuisines": "Top cuisines from each user's prior ratings in CSV order",
                "budgetLevel": "Weighted average restaurant avg_bill_rub bucket from prior ratings",
                "normalizedRating": "Restaurant average rating divided by inferred rating scale",
                "popularityScore": "Restaurant rating-count popularity normalized by max count",
            },
        },
    }


def read_rows(path: str) -> list[dict[str, str]]:
    with open(path, newline="") as file:
        return list(csv.DictReader(file))


def by_id(rows: list[dict[str, str]], id_column: str) -> dict[str, dict[str, str]]:
    return {row[id_column]: row for row in rows if row.get(id_column)}


def detect_profile(profile: str, users: list[dict[str, str]], restaurants: list[dict[str, str]]) -> str:
    if profile != "auto":
        return profile

    user_columns = set(users[0].keys()) if users else set()
    restaurant_columns = set(restaurants[0].keys()) if restaurants else set()
    goeat_user_columns = {
        "age",
        "gender",
        "profession",
        "big5_openness",
        "big5_conscientiousness",
        "big5_extraversion",
        "big5_agreeableness",
        "big5_neuroticism",
    }
    goeat_restaurant_columns = {
        "cuisine",
        "hall_area_m2",
        "seats",
        "halls_count",
        "summer_terrace",
        "vip_zone",
        "avg_bill_rub",
        "staff_count",
        "michelin_stars",
    }
    if goeat_user_columns.issubset(user_columns) and goeat_restaurant_columns.issubset(restaurant_columns):
        return "goeat-local"
    return "generic"


def detect_label_mode(label_mode: str, profile: str) -> str:
    if label_mode != "auto":
        return label_mode
    return "normalized" if profile == "goeat-local" else "binary"


def to_label(rating: float, rating_scale: float, label_mode: str) -> float | None:
    normalized = clamp(rating / rating_scale)
    if label_mode == "normalized":
        return normalized
    if normalized >= 0.8:
        return 1
    if normalized <= 0.4:
        return 0
    return None


def user_features(user: dict[str, str]) -> dict[str, Any]:
    return {
        "userId": user.get("user_id", ""),
        "favoriteCuisines": split_list(user.get("favorite_cuisines", "")),
        "preferredAmbiance": split_list(user.get("preferred_ambiance", "")),
        "budgetLevel": nullable_int(user.get("budget_level")),
        "cuisineAffinities": {},
        "ambianceAffinities": {},
        "budgetAffinity": {},
    }


def restaurant_features(user: dict[str, str], restaurant: dict[str, str]) -> dict[str, Any]:
    cuisines = split_list(restaurant.get("types", "")) + [normalize(restaurant.get("primary_type", ""))]
    favorites = split_list(user.get("favorite_cuisines", ""))
    preferred_ambiance = split_list(user.get("preferred_ambiance", ""))
    price_level = nullable_int(restaurant.get("price_level"))
    budget_level = nullable_int(user.get("budget_level"))

    return {
        "restaurantId": restaurant.get("restaurant_id", ""),
        "cuisineMatch": 1 if set(cuisines).intersection(favorites) else 0.5,
        "budgetMatch": budget_match(price_level, budget_level),
        "ambianceMatch": 1 if set(cuisines).intersection(preferred_ambiance) else 0.5,
        "normalizedRating": clamp(float_or_zero(restaurant.get("rating")) / 5),
        "normalizedDistance": 1,
        "popularityScore": clamp(float_or_zero(restaurant.get("rating_count")) / 1000),
        "openNow": 1,
        "distanceMeters": 0,
    }


def goeat_user_features(user: dict[str, str], profile: dict[str, Any]) -> dict[str, Any]:
    cuisine_affinities = averaged_profile_values(profile["cuisines"])
    budget_level = weighted_bucket_average(profile["budgetBuckets"])
    return {
        "userId": user.get("user_id", ""),
        "favoriteCuisines": top_keys(cuisine_affinities, limit=3),
        "preferredAmbiance": preferred_ambiance(profile),
        "budgetLevel": round(budget_level) if budget_level else None,
        "cuisineAffinities": cuisine_affinities,
        "ambianceAffinities": {
            "summer_terrace": averaged_value(profile["summerTerrace"]),
            "vip_zone": averaged_value(profile["vipZone"]),
            "michelin": averaged_value(profile["michelin"]),
        },
        "budgetAffinity": averaged_profile_values(profile["budgetBuckets"]),
        "age": nullable_int(user.get("age")),
        "gender": normalize(user.get("gender", "")),
        "profession": normalize(user.get("profession", "")),
        "big5Openness": float_or_zero(user.get("big5_openness")),
        "big5Conscientiousness": float_or_zero(user.get("big5_conscientiousness")),
        "big5Extraversion": float_or_zero(user.get("big5_extraversion")),
        "big5Agreeableness": float_or_zero(user.get("big5_agreeableness")),
        "big5Neuroticism": float_or_zero(user.get("big5_neuroticism")),
    }


def goeat_restaurant_features(
    user_profile: dict[str, Any],
    restaurant: dict[str, str],
    restaurant_metrics: dict[str, float],
    restaurant_stats: dict[str, dict[str, float]],
    bill_breakpoints: list[float],
) -> dict[str, Any]:
    cuisine = normalize(restaurant.get("cuisine", ""))
    price_level = bucket_for_value(float_or_zero(restaurant.get("avg_bill_rub")), bill_breakpoints)
    budget_level = weighted_bucket_average(user_profile["budgetBuckets"])
    cuisine_affinities = averaged_profile_values(user_profile["cuisines"])
    ambiance = {
        "summer_terrace": averaged_value(user_profile["summerTerrace"]),
        "vip_zone": averaged_value(user_profile["vipZone"]),
        "michelin": averaged_value(user_profile["michelin"]),
    }
    terrace_score = ambiance_match(yes_no(restaurant.get("summer_terrace")), ambiance["summer_terrace"])
    vip_score = ambiance_match(yes_no(restaurant.get("vip_zone")), ambiance["vip_zone"])
    michelin_score = normalize_numeric(restaurant.get("michelin_stars"), restaurant_stats["michelin_stars"])

    return {
        "restaurantId": restaurant.get("restaurant_id", ""),
        "cuisineMatch": cuisine_affinities.get(cuisine, 0.5),
        "budgetMatch": budget_match(price_level, round(budget_level) if budget_level else None),
        "ambianceMatch": clamp((terrace_score + vip_score + michelin_score) / 3),
        "normalizedRating": restaurant_metrics.get("averageRating", 0.5),
        "normalizedDistance": 1,
        "popularityScore": restaurant_metrics.get("popularityScore", 0.0),
        "openNow": 1,
        "distanceMeters": 0,
        "cuisine": cuisine,
        "priceLevel": price_level,
        "normalizedAvgBill": normalize_numeric(restaurant.get("avg_bill_rub"), restaurant_stats["avg_bill_rub"]),
        "normalizedSeats": normalize_numeric(restaurant.get("seats"), restaurant_stats["seats"]),
        "normalizedHallArea": normalize_numeric(restaurant.get("hall_area_m2"), restaurant_stats["hall_area_m2"]),
        "normalizedHallsCount": normalize_numeric(restaurant.get("halls_count"), restaurant_stats["halls_count"]),
        "normalizedStaffCount": normalize_numeric(restaurant.get("staff_count"), restaurant_stats["staff_count"]),
        "hasSummerTerrace": yes_no(restaurant.get("summer_terrace")),
        "hasVipZone": yes_no(restaurant.get("vip_zone")),
        "michelinScore": michelin_score,
    }


def build_restaurant_metrics(ratings: list[dict[str, str]], rating_scale: float) -> dict[str, dict[str, float]]:
    aggregates: dict[str, dict[str, float]] = {}
    for row in ratings:
        restaurant_id = row.get("restaurant_id", "")
        if not restaurant_id:
            continue
        aggregate = aggregates.setdefault(restaurant_id, {"sum": 0.0, "count": 0.0})
        aggregate["sum"] += float(row["rating"])
        aggregate["count"] += 1

    max_count = max((aggregate["count"] for aggregate in aggregates.values()), default=1.0)
    return {
        restaurant_id: {
            "averageRating": clamp((aggregate["sum"] / aggregate["count"]) / rating_scale),
            "popularityScore": clamp(aggregate["count"] / max_count),
        }
        for restaurant_id, aggregate in aggregates.items()
    }


def update_user_profile(
    profile: dict[str, Any],
    restaurant: dict[str, str],
    rating_value: float,
    rating_scale: float,
    bill_breakpoints: list[float],
) -> None:
    score = clamp(rating_value / rating_scale)
    add_profile_value(profile["cuisines"], normalize(restaurant.get("cuisine", "")), score)
    add_profile_value(
        profile["budgetBuckets"],
        str(bucket_for_value(float_or_zero(restaurant.get("avg_bill_rub")), bill_breakpoints)),
        score,
    )
    add_average(profile["summerTerrace"], score if yes_no(restaurant.get("summer_terrace")) else 1 - score)
    add_average(profile["vipZone"], score if yes_no(restaurant.get("vip_zone")) else 1 - score)
    add_average(profile["michelin"], score if float_or_zero(restaurant.get("michelin_stars")) > 0 else 1 - score)


def empty_user_profile() -> dict[str, Any]:
    return {
        "cuisines": {},
        "budgetBuckets": {},
        "summerTerrace": {"sum": 0.0, "count": 0.0},
        "vipZone": {"sum": 0.0, "count": 0.0},
        "michelin": {"sum": 0.0, "count": 0.0},
    }


def add_profile_value(profile: dict[str, dict[str, float]], key: str, value: float) -> None:
    if not key:
        return
    entry = profile.setdefault(key, {"sum": 0.0, "count": 0.0})
    add_average(entry, value)


def add_average(entry: dict[str, float], value: float) -> None:
    entry["sum"] += value
    entry["count"] += 1


def averaged_profile_values(profile: dict[str, dict[str, float]]) -> dict[str, float]:
    return {key: averaged_value(value) for key, value in profile.items()}


def averaged_value(entry: dict[str, float]) -> float:
    if entry["count"] == 0:
        return 0.5
    return clamp(entry["sum"] / entry["count"])


def top_keys(values: dict[str, float], limit: int) -> list[str]:
    return [key for key, _ in sorted(values.items(), key=lambda item: item[1], reverse=True)[:limit]]


def preferred_ambiance(profile: dict[str, Any]) -> list[str]:
    values = {
        "summer_terrace": averaged_value(profile["summerTerrace"]),
        "vip_zone": averaged_value(profile["vipZone"]),
        "michelin": averaged_value(profile["michelin"]),
    }
    return [key for key, value in values.items() if value >= 0.6]


def weighted_bucket_average(profile: dict[str, dict[str, float]]) -> float | None:
    total_weight = 0.0
    total = 0.0
    for key, entry in profile.items():
        weight = entry["sum"]
        total += int(key) * weight
        total_weight += weight
    if total_weight == 0:
        return None
    return total / total_weight


def split_list(value: str) -> list[str]:
    return [normalize(item) for item in value.split("|") if normalize(item)]


def normalize(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def nullable_int(value: str | None) -> int | None:
    if value in (None, ""):
        return None
    return int(float(value))


def float_or_zero(value: str | None) -> float:
    if value in (None, ""):
        return 0.0
    return float(value)


def budget_match(price_level: int | None, budget_level: int | None) -> float:
    if price_level is None or budget_level is None:
        return 0.5
    return clamp(1 - abs(price_level - budget_level) / 4)


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def yes_no(value: str | None) -> int:
    return 1 if normalize(value or "") in {"yes", "true", "1"} else 0


def infer_rating_scale(ratings: list[dict[str, str]]) -> float:
    max_rating = max((float(row["rating"]) for row in ratings), default=5.0)
    return 10.0 if max_rating > 5.0 else 5.0


def numeric_stats(rows: list[dict[str, str]], columns: list[str]) -> dict[str, dict[str, float]]:
    stats = {}
    for column in columns:
        values = [float_or_zero(row.get(column)) for row in rows]
        stats[column] = {
            "min": min(values, default=0.0),
            "max": max(values, default=1.0),
        }
    return stats


def normalize_numeric(value: str | None, stats: dict[str, float]) -> float:
    minimum = stats["min"]
    maximum = stats["max"]
    if maximum == minimum:
        return 0.0
    return clamp((float_or_zero(value) - minimum) / (maximum - minimum))


def quantile_breakpoints(values: list[float], buckets: int) -> list[float]:
    if not values:
        return []
    sorted_values = sorted(values)
    return [sorted_values[min(len(sorted_values) - 1, int(len(sorted_values) * index / buckets))] for index in range(1, buckets)]


def bucket_for_value(value: float, breakpoints: list[float]) -> int:
    for index, breakpoint in enumerate(breakpoints, start=1):
        if value <= breakpoint:
            return index
    return len(breakpoints) + 1


def ambiance_match(has_feature: int, affinity: float) -> float:
    return affinity if has_feature else 1 - affinity


def build_dataset_version() -> str:
    now = datetime.now(timezone.utc)
    return f"restaurant_recs_dataset_{now:%Y_%m_%d}_v1"


if __name__ == "__main__":
    main()
