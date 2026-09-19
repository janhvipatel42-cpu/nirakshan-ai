"""
MODULE 2 (part B) — AI Information Extraction

Turns raw OCR text into the structured fields the Compliance Rule Engine
needs (MRP, net quantity, manufacturer, etc). This uses transparent,
pattern-based heuristics (regular expressions + keyword proximity) rather
than an opaque model, by design: the brief requires that AI *understand*
the package while a *separate, auditable* rule engine makes the legal
call. Keeping extraction inspectable makes the whole pipeline explainable
end to end, and confidence scores here reflect pattern-match strength
blended with OCR quality — not a black-box neural network's certainty.

Swap-in point for a future ML model: replace `extract_fields()` internals
while keeping its return contract the same, and the rest of the system
(rule engine, evidence, reporting) keeps working unchanged.
"""
from __future__ import annotations

import re

COMMODITY_KEYWORDS = [
    "oil", "biscuit", "biscuits", "soap", "shampoo", "snack", "juice", "water",
    "detergent", "chocolate", "spice", "tea", "coffee", "rice", "atta", "flour",
    "sauce", "cream", "lotion", "noodles", "namkeen", "candy", "toothpaste",
    "bar", "drink", "powder", "masala", "pickle", "ghee", "butter", "cereal",
]

UNIT_PATTERN = r"(kgs?|kilograms?|gms?|grams?|g|mls?|milliliters?|ml|litres?|liters?|l|n|u|pcs?|pieces?)"


def _clip(text: str, span, pad: int = 20) -> str:
    start = max(0, span[0] - pad)
    end = min(len(text), span[1] + pad)
    return text[start:end].strip().replace("\n", " ")


def _find_mrp(text: str):
    pattern = re.compile(
        r"(?:MRP|M\.?\s*R\.?\s*P\.?|Maximum\s+Retail\s+Price|Max\.?\s*Retail\s*Price)"
        r"[^\d₹]{0,20}(?:₹|Rs\.?|INR)?\s*([0-9]+(?:[.,][0-9]{1,2})?)",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    if m:
        value = m.group(1).replace(",", "")
        return {"value": f"₹{value}", "confidence": 96, "evidence_snippet": _clip(text, m.span())}

    loose = re.search(r"₹\s*([0-9]+(?:\.[0-9]{1,2})?)", text)
    if loose:
        return {
            "value": f"₹{loose.group(1)}",
            "confidence": 72,
            "evidence_snippet": _clip(text, loose.span()),
        }
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_net_quantity(text: str):
    labelled = re.compile(
        r"(?:Net\s*(?:Wt\.?|Weight|Qty\.?|Quantity|Contents?)|NET\s*WT)"
        r"[:\s]{0,10}([0-9]+(?:\.[0-9]+)?)\s*" + UNIT_PATTERN,
        re.IGNORECASE,
    )
    m = labelled.search(text)
    if m:
        return {
            "value": f"{m.group(1)} {m.group(2).lower()}",
            "confidence": 95,
            "evidence_snippet": _clip(text, m.span()),
        }
    loose = re.compile(r"\b([0-9]+(?:\.[0-9]+)?)\s*" + UNIT_PATTERN + r"\b", re.IGNORECASE)
    m = loose.search(text)
    if m:
        return {
            "value": f"{m.group(1)} {m.group(2).lower()}",
            "confidence": 68,
            "evidence_snippet": _clip(text, m.span()),
        }

    # Low-confidence fallback: a number sits right after the "Net Wt/Qty"
    # keyword but OCR garbled the unit itself (very common on tilted or
    # low-light photos — e.g. "1 L" misread as "1b" or "14"). Surfacing
    # this as a NEEDS_REVIEW value beats silently saying "not detected"
    # when a quantity was clearly printed; a human can confirm the unit.
    garbled = re.compile(
        r"(?:Net\s*(?:Wt\.?|Weight|Qty\.?|Quantity|Contents?)|NET\s*WT)"
        r"[:\s]{0,10}([0-9]+(?:\.[0-9]+)?\s*[A-Za-z]{0,4})",
        re.IGNORECASE,
    )
    m = garbled.search(text)
    if m:
        return {
            "value": f"{m.group(1).strip()} (unit unclear — verify manually)",
            "confidence": 42,
            "evidence_snippet": _clip(text, m.span()),
        }
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_manufacturer(text: str):
    pattern = re.compile(
        r"(?:Manufactured\s*(?:(?:and|&)\s*(?:Marketed|Packed|Distributed)\s*)?by|"
        r"Mfd\.?\s*(?:(?:and|&)\s*Mktd\.?\s*)?by|Mfg\.?\s*by|"
        r"Packed\s*by|Marketed\s*(?:(?:and|&)\s*Distributed\s*)?by|Mktd\.?\s*by|"
        r"Imported\s*by|Manufacturer)\s*[:\-]?\s*(.{5,90})",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    if m:
        value = m.group(1).splitlines()[0].strip(" .,:-")
        return {"value": value, "confidence": 93, "evidence_snippet": _clip(text, m.span())}
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_generic_name(text: str, product_name: str, category: str):
    for candidate in filter(None, [product_name, category]):
        m = re.search(re.escape(candidate), text, re.IGNORECASE)
        if m:
            return {
                "value": candidate,
                "confidence": 90,
                "evidence_snippet": _clip(text, m.span()),
            }
    for kw in COMMODITY_KEYWORDS:
        m = re.search(r"\b" + re.escape(kw) + r"\b", text, re.IGNORECASE)
        if m:
            return {"value": kw.title(), "confidence": 62, "evidence_snippet": _clip(text, m.span())}
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_mfg_date(text: str):
    pattern = re.compile(
        r"(?:Mfg\.?\s*Date|Manufactur(?:ed|ing)\s*(?:on|Date)|Pkd\.?\s*(?:on|Date)|"
        r"Packed\s*on|Month\s*(?:&|and)?\s*Year\s*of\s*(?:Mfg|Manufacture|Packing))"
        r"[: \t]{0,10}([A-Za-z0-9\/\-\. ]{3,15})",
        re.IGNORECASE,
    )
    m = pattern.search(text)
    if m:
        return {
            "value": m.group(1).strip(" .,:-"),
            "confidence": 88,
            "evidence_snippet": _clip(text, m.span()),
        }
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_consumer_care(text: str):
    email = re.search(r"[\w.\-]+@[\w.\-]+\.\w+", text)
    phone = re.search(r"(?:1800[-\s]?\d{2,3}[-\s]?\d{3,4})|(?:\+?91[-\s]?)?[6-9]\d{9}\b", text)
    care_keyword = re.search(
        r"(?:Consumer|Customer)\s*Care|for\s*complaints?|Grievance|Helpline|Toll[-\s]?Free|Care\s*No\.?",
        text, re.IGNORECASE,
    )

    parts = []
    span = None
    if care_keyword:
        span = care_keyword.span()
    if email:
        parts.append(email.group(0))
        span = span or email.span()
    if phone:
        parts.append(phone.group(0))
        span = span or phone.span()

    if parts:
        confidence = 94 if (email and phone) else 80 if (email or phone) else 55
        return {
            "value": " / ".join(parts),
            "confidence": confidence,
            "evidence_snippet": _clip(text, span) if span else None,
        }
    if care_keyword:
        return {
            "value": "Consumer care mentioned, but no phone/email detected",
            "confidence": 45,
            "evidence_snippet": _clip(text, care_keyword.span()),
        }
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_country_of_origin(text: str):
    pattern = re.compile(r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z ]{3,25})", re.IGNORECASE)
    m = pattern.search(text)
    if m:
        return {
            "value": m.group(1).strip(" .,:-"),
            "confidence": 92,
            "evidence_snippet": _clip(text, m.span()),
        }
    return {"value": None, "confidence": 0, "evidence_snippet": None}


def _find_other_declarations(text: str) -> list[str]:
    found = []
    fssai = re.search(r"FSSAI[^\d]{0,20}(\d{10,14})", text, re.IGNORECASE)
    if fssai:
        found.append(f"FSSAI Lic. No. {fssai.group(1)}")
    best_before = re.search(r"Best\s*Before[:\s]{0,10}([A-Za-z0-9\/\-\.\s]{3,20})", text, re.IGNORECASE)
    if best_before:
        found.append(f"Best Before {best_before.group(1).strip()}")
    batch = re.search(r"Batch\s*No\.?[:\s]{0,5}([A-Za-z0-9\-]{2,15})", text, re.IGNORECASE)
    if batch:
        found.append(f"Batch No. {batch.group(1)}")
    veg = re.search(r"\b(vegetarian|non[- ]vegetarian)\b", text, re.IGNORECASE)
    if veg:
        found.append(f"{veg.group(1).title()} mark mentioned")
    return found


def _apply_ocr_confidence(field: dict, ocr_avg_confidence: float | None, ocr_mode: str) -> dict:
    """Blend pattern-match strength with actual OCR confidence for real uploads."""
    if field["value"] is None:
        return field
    if ocr_mode == "real" and ocr_avg_confidence:
        blended = round((field["confidence"] + ocr_avg_confidence) / 2)
        field = {**field, "confidence": max(1, min(99, blended))}
    return field


def extract_fields(ocr_text: str, ocr_mode: str, ocr_avg_confidence: float, product_name: str, category: str) -> dict:
    text = ocr_text or ""
    fields = {
        "mrp": _find_mrp(text),
        "net_quantity": _find_net_quantity(text),
        "manufacturer": _find_manufacturer(text),
        "generic_name": _find_generic_name(text, product_name, category),
        "mfg_date": _find_mfg_date(text),
        "consumer_care": _find_consumer_care(text),
        "country_of_origin": _find_country_of_origin(text),
    }
    fields = {k: _apply_ocr_confidence(v, ocr_avg_confidence, ocr_mode) for k, v in fields.items()}
    fields["other_declarations"] = _find_other_declarations(text)
    return fields
