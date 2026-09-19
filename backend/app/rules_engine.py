"""
MODULE 3 — Compliance Rule Engine

Deliberately kept free of any AI/LLM call. Rules are loaded from the
database (seeded from data/compliance_rules.json) and versioned there —
never invented at request time. This function is a pure(-ish) evaluator:
structured extracted data + image-quality signals in, PASS/FAIL/
NEEDS_REVIEW verdicts out. That separation is the core architectural claim
of Nirakshan AI: "AI extracts and understands the package, a controlled
rule engine decides compliance."

Every result also carries an approximate `region_hint` (percentage
bounding box) used to draw an illustrative highlight on the Evidence
screen. These are typical on-label positions, not a trained layout-
detection output — that is flagged as future scope, not claimed as
precise computer vision.
"""
from __future__ import annotations

from app.config import CONFIDENCE_REVIEW_THRESHOLD

REGION_HINTS = {
    "generic_name": {"x": 8, "y": 6, "w": 60, "h": 14},
    "mrp": {"x": 62, "y": 60, "w": 32, "h": 12},
    "net_quantity": {"x": 8, "y": 60, "w": 32, "h": 12},
    "manufacturer": {"x": 8, "y": 74, "w": 84, "h": 14},
    "mfg_date": {"x": 8, "y": 46, "w": 40, "h": 10},
    "consumer_care": {"x": 8, "y": 88, "w": 84, "h": 10},
    "country_of_origin": {"x": 8, "y": 34, "w": 40, "h": 10},
    "__readability__": {"x": 4, "y": 4, "w": 92, "h": 92},
}


def _presence_result(rule, field: dict):
    if field is None or field.get("value") in (None, ""):
        return (
            "FAIL",
            0,
            "Required declaration was not detected anywhere in the analyzed label text. "
            "Verify manually — the declaration may be missing, or on a panel not captured "
            "in the uploaded images.",
            None,
        )
    confidence = field.get("confidence", 0)
    value = field["value"]
    snippet = field.get("evidence_snippet")
    if confidence < CONFIDENCE_REVIEW_THRESHOLD:
        return (
            "NEEDS_REVIEW",
            confidence,
            f"A possible declaration was detected ('{value}') but extraction confidence "
            f"({confidence}%) is below the {CONFIDENCE_REVIEW_THRESHOLD}% review threshold. "
            "Recommend manual verification against the physical package.",
            snippet,
        )
    return (
        "PASS",
        confidence,
        f"Declaration detected and validated: '{value}'.",
        snippet,
    )


def _readability_result(image_quality: dict):
    clarity = image_quality.get("clarity", {}).get("status", "REVIEW")
    readability = image_quality.get("text_readability", {}).get("status", "REVIEW")
    detail = image_quality.get("text_readability", {}).get("detail", "")

    if clarity == "REVIEW" and readability == "REVIEW":
        return (
            "FAIL",
            35,
            "Label text is not reliably legible: both image sharpness and OCR word "
            f"confidence were low. {detail}".strip(),
            None,
        )
    if readability == "REVIEW":
        return (
            "NEEDS_REVIEW",
            60,
            f"Some label text could not be read with confidence. {detail}".strip(),
            None,
        )
    return ("PASS", 90, f"Label text is legible and prominent. {detail}".strip(), None)


def evaluate_rules(extracted_data: dict, image_quality: dict, is_imported: bool, rules: list) -> list[dict]:
    """
    rules: list of dict-like objects with rule_id, name, legal_reference,
    field_key, check_type, applicability, version, active.
    Returns a list of result dicts ready to serialize to JSON.
    """
    results = []
    for rule in rules:
        if not rule["active"]:
            continue

        if rule["check_type"] == "conditional_presence":
            if not is_imported:
                results.append({
                    "rule_id": rule["rule_id"],
                    "name": rule["name"],
                    "legal_reference": rule["legal_reference"],
                    "field_key": rule["field_key"],
                    "status": "NOT_APPLICABLE",
                    "confidence": None,
                    "explanation": "Not applicable — package was not marked as an imported product.",
                    "evidence_snippet": None,
                    "region_hint": REGION_HINTS.get(rule["field_key"]),
                })
                continue
            field = extracted_data.get(rule["field_key"])
            status, confidence, explanation, snippet = _presence_result(rule, field)

        elif rule["check_type"] == "quality_derived":
            status, confidence, explanation, snippet = _readability_result(image_quality)

        else:  # field_presence (default)
            field = extracted_data.get(rule["field_key"])
            status, confidence, explanation, snippet = _presence_result(rule, field)

        results.append({
            "rule_id": rule["rule_id"],
            "name": rule["name"],
            "legal_reference": rule["legal_reference"],
            "field_key": rule["field_key"],
            "status": status,
            "confidence": confidence,
            "explanation": explanation,
            "evidence_snippet": snippet,
            "region_hint": REGION_HINTS.get(rule["field_key"]),
        })
    return results


def overall_result_from(results: list[dict]) -> tuple[str, int]:
    statuses = [r["status"] for r in results]
    issues = sum(1 for s in statuses if s in ("FAIL", "NEEDS_REVIEW"))
    if any(s == "FAIL" for s in statuses):
        return "NON_COMPLIANT", issues
    if any(s == "NEEDS_REVIEW" for s in statuses):
        return "NEEDS_REVIEW", issues
    return "COMPLIANT", issues
