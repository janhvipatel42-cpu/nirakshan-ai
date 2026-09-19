"""
MODULE 1 — Image Scanning & Preprocessing

Computes objective, deterministic image-quality signals (resolution,
sharpness/blur, brightness/lighting, and label contrast) directly from the
uploaded package photos using Pillow + NumPy. These are heuristic,
lightweight substitutes for a full computer-vision quality model — good
enough for a prototype gate, and clearly documented as such.

Text readability is filled in later by ocr_engine.py once OCR has actually
run, since "can this be read" is best judged from real extracted text.
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter

RESOLUTION_MIN_DIMENSION = 600
SHARPNESS_GOOD_THRESHOLD = 12.0
BRIGHTNESS_MIN = 60
BRIGHTNESS_MAX = 205
CONTRAST_GOOD_THRESHOLD = 28.0


def _load_grayscale(path: str) -> Image.Image:
    img = Image.open(path)
    img = img.convert("L")
    # Downscale very large images for faster, stable metric computation.
    if max(img.size) > 1600:
        ratio = 1600 / max(img.size)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)))
    return img


def _single_image_metrics(path: str) -> dict:
    img = Image.open(path)
    width, height = img.size
    gray = _load_grayscale(path)
    arr = np.asarray(gray, dtype=np.float32)

    brightness = float(arr.mean())
    contrast = float(arr.std())

    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_arr = np.asarray(edges, dtype=np.float32)
    sharpness = float(edge_arr.var()) ** 0.5 / 10.0  # scaled for friendlier thresholds

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "sharpness": round(sharpness, 1),
    }


def _status(is_good: bool) -> str:
    return "GOOD" if is_good else "REVIEW"


def analyze_images(image_paths: list[str]) -> dict:
    """Aggregate per-image metrics into the 5-row Image Quality Check screen."""
    if not image_paths:
        return {
            "resolution": {"status": "REVIEW", "detail": "No images were uploaded."},
            "clarity": {"status": "REVIEW", "detail": "No images were uploaded."},
            "lighting": {"status": "REVIEW", "detail": "No images were uploaded."},
            "label_visibility": {"status": "REVIEW", "detail": "No images were uploaded."},
            "text_readability": {"status": "REVIEW", "detail": "Pending OCR."},
            "per_image": [],
        }

    per_image = [_single_image_metrics(p) for p in image_paths]

    min_dim = min(min(m["width"], m["height"]) for m in per_image)
    avg_brightness = sum(m["brightness"] for m in per_image) / len(per_image)
    avg_contrast = sum(m["contrast"] for m in per_image) / len(per_image)
    avg_sharpness = sum(m["sharpness"] for m in per_image) / len(per_image)

    resolution_ok = min_dim >= RESOLUTION_MIN_DIMENSION
    clarity_ok = avg_sharpness >= SHARPNESS_GOOD_THRESHOLD
    lighting_ok = BRIGHTNESS_MIN <= avg_brightness <= BRIGHTNESS_MAX
    visibility_ok = avg_contrast >= CONTRAST_GOOD_THRESHOLD

    return {
        "resolution": {
            "status": _status(resolution_ok),
            "detail": f"Smallest image dimension {min_dim}px (minimum recommended {RESOLUTION_MIN_DIMENSION}px).",
        },
        "clarity": {
            "status": _status(clarity_ok),
            "detail": f"Average sharpness score {avg_sharpness:.1f} (heuristic edge-variance metric).",
        },
        "lighting": {
            "status": _status(lighting_ok),
            "detail": f"Average brightness {avg_brightness:.0f}/255.",
        },
        "label_visibility": {
            "status": _status(visibility_ok),
            "detail": f"Average label contrast {avg_contrast:.1f}.",
        },
        "text_readability": {
            "status": "REVIEW",
            "detail": "Pending OCR result.",
        },
        "per_image": per_image,
    }
