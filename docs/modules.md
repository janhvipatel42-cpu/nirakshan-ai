# Modules

## Module 1 — Image Scanning & Preprocessing
Upload, validate and quality-check package images (resolution, sharpness/blur, brightness,
label contrast). **Code:** `backend/app/image_quality.py`,
`upload_images()`/`analyze_inspection()` in `backend/app/routers/inspections.py`.

## Module 2 — OCR & AI Information Extraction
Text detection (`ocr_engine.py`, Tesseract with a labelled fallback) followed by structured-field
extraction with per-field confidence (`extraction.py`). **Input:** processed images.
**Output:** structured fields (MRP, net quantity, manufacturer, generic name, mfg date,
consumer care, country of origin, other declarations).

## Module 3 — Compliance Rule Engine
Loads versioned requirements from `data/compliance_rules.json` / the `compliance_rules` table
and evaluates each applicable rule against the extracted fields, returning
PASS / FAIL / NEEDS REVIEW / NOT APPLICABLE. **Code:** `rules_engine.py`. Deliberately contains
no OCR/AI logic — rules are data, versioned and admin-editable.

## Module 4 — Violation & Evidence Engine
Identifies failed/review checks, attaches the OCR evidence snippet and an illustrative on-label
region hint, and generates the human-readable explanation shown on the Evidence screen.
**Code:** `REGION_HINTS` + explanation strings inside `rules_engine.py`, rendered by
`frontend/src/pages/EvidencePage.jsx`.

## Module 5 — Report & Inspection Management
Generates the PDF inspection report, persists the inspection record, and supports search/filter
across inspection history. **Code:** `pdf_report.py`, `routers/inspections.py`
(`list_inspections`, `download_report`).

## Module 6 — Dashboard & User Management
Inspector dashboard/history/reports; Admin analytics, rule management and user/role management.
**Code:** `routers/analytics.py`, `routers/rules.py`, `routers/users.py`, and the corresponding
`frontend/src/pages/Admin*.jsx` / `DashboardPage.jsx` / `HistoryPage.jsx`.
