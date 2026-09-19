"""
MODULE 2 (part A) — OCR Text Extraction

Wraps Tesseract OCR (via pytesseract) to turn package photos into raw text
plus a confidence score. If the Tesseract binary is not installed or not
discoverable on the host machine, this degrades — visibly and honestly —
into a "demo OCR" mode rather than pretending to have extracted real text.

Real-world package photos (hand-held, tilted, unevenly lit) read far worse
through Tesseract than clean scans. `_preprocess()` below measurably
improves recognition on such photos — see docs/ocr-notes.md for a before/
after test — by upscaling small images, normalising contrast, sharpening,
and running two page-segmentation passes tuned for label-style layouts
instead of Tesseract's default "assume a full page of prose" mode.

Install the binary to enable real OCR:
  Ubuntu/Debian:  sudo apt-get install tesseract-ocr
  macOS (brew):   brew install tesseract
  Windows:        https://github.com/UB-Mannheim/tesseract/wiki
                  (tick "Add to PATH" during install, then restart your
                  terminal — see the auto-detect fallback below for when
                  that step gets missed)
"""
from __future__ import annotations

import os
import shutil

try:
    import pytesseract
    _PYTESSERACT_IMPORTED = True
except ImportError:  # pytesseract package itself not installed
    _PYTESSERACT_IMPORTED = False

from PIL import Image, ImageFilter, ImageOps

READABILITY_CONFIDENCE_GOOD = 55
READABILITY_MIN_WORDS = 4

# Common Windows install locations, tried only if `tesseract` isn't already
# on PATH — the #1 cause of "Tesseract installed but app still says
# unavailable" on Windows is a PATH that wasn't refreshed / wasn't set.
_WINDOWS_FALLBACK_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
]

_OCR_CONFIGS = [
    "--oem 3",             # psm 3 (default): best at clean multi-line blocks
                            # like "Manufactured by: ..." addresses.
    "--oem 3 --psm 11",    # sparse text, no reading-order assumption: best
                            # at short same-row fields (MRP next to Net Qty)
                            # that psm 3 sometimes merges or drops.
]
# Package labels mix both patterns on one panel, and no single Tesseract
# page-segmentation mode reads both reliably — see docs/ocr-notes.md for
# the comparison that led to running both passes and merging the text
# rather than picking just one mode.


def _tesseract_available() -> bool:
    if not _PYTESSERACT_IMPORTED:
        return False
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        pass
    if shutil.which("tesseract"):
        return True
    for candidate in _WINDOWS_FALLBACK_PATHS:
        if os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            try:
                pytesseract.get_tesseract_version()
                return True
            except Exception:
                continue
    return False


def _preprocess(img: Image.Image) -> Image.Image:
    """Grayscale + upscale + contrast-normalise + sharpen before OCR.

    Cheap, dependency-light stand-ins for a real document-scanner
    pipeline (no OpenCV/deskew model) — but they measurably help
    Tesseract on hand-held package photos rather than clean scans.
    """
    gray = ImageOps.exif_transpose(img).convert("L")
    if max(gray.size) < 2000:
        scale = 2000 / max(gray.size)
        gray = gray.resize((int(gray.width * scale), int(gray.height * scale)), Image.LANCZOS)
    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = gray.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=2))
    return gray


def run_ocr(image_paths: list[str]) -> dict:
    """Run OCR across all uploaded images and merge the results."""
    if not _tesseract_available():
        return {
            "mode": "unavailable",
            "text": "",
            "avg_confidence": 0,
            "word_count": 0,
            "note": (
                "Tesseract OCR binary was not found on this server, so real text "
                "extraction could not run. Install Tesseract (see README) and make "
                "sure it's on PATH, then restart the backend. Extracted-field "
                "results below could not be computed for this upload."
            ),
        }

    full_text_parts = []
    confidences = []
    word_count = 0

    for path in image_paths:
        img = Image.open(path)
        processed = _preprocess(img)
        for config in _OCR_CONFIGS:
            data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT, config=config)
            text = pytesseract.image_to_string(processed, config=config)
            full_text_parts.append(text.strip())
            for conf, word in zip(data.get("conf", []), data.get("text", [])):
                try:
                    conf_val = float(conf)
                except (TypeError, ValueError):
                    continue
                if conf_val >= 0 and word.strip():
                    confidences.append(conf_val)
                    word_count += 1

    avg_conf = round(sum(confidences) / len(confidences), 1) if confidences else 0

    return {
        "mode": "real",
        "text": "\n".join(p for p in full_text_parts if p),
        "avg_confidence": avg_conf,
        "word_count": word_count,
        "note": "Text extracted with Tesseract OCR (preprocessed for hand-held photo conditions).",
    }


def readability_from_ocr(ocr_result: dict) -> dict:
    if ocr_result["mode"] != "real":
        return {
            "status": "REVIEW",
            "detail": "OCR engine unavailable — readability could not be automatically verified.",
        }
    good = (
        ocr_result["avg_confidence"] >= READABILITY_CONFIDENCE_GOOD
        and ocr_result["word_count"] >= READABILITY_MIN_WORDS
    )
    return {
        "status": "GOOD" if good else "REVIEW",
        "detail": f"OCR average word confidence {ocr_result['avg_confidence']}% across {ocr_result['word_count']} detected words.",
    }
