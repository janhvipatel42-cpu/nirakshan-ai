# System Architecture

## Layers

| Layer | Responsibility | Implementation |
|---|---|---|
| Presentation | 12 screens, wizard flow, dashboards | React (Vite), `frontend/src/pages` |
| Application | Auth, inspection lifecycle, report/report download | FastAPI routers, `backend/app/routers` |
| AI / Processing | Image quality, OCR, information extraction | `image_quality.py`, `ocr_engine.py`, `extraction.py` |
| Compliance | Rule evaluation, evidence generation | `rules_engine.py` + `data/compliance_rules.json` |
| Data | Persistence, file storage | SQLite via SQLAlchemy, `backend/uploads/` |

## Data flow

```
USER (Inspector / Admin)
   │
   ▼
WEB APPLICATION  (React SPA)
   │  fetch() over HTTPS
   ▼
BACKEND API  (FastAPI)
   │
   ▼
IMAGE PROCESSING        — image_quality.py  (resolution / clarity / lighting / contrast)
   │
   ▼
OCR ENGINE              — ocr_engine.py     (Tesseract, labelled fallback if unavailable)
   │
   ▼
AI INFORMATION EXTRACTION — extraction.py   (pattern-based field extraction + confidence)
   │
   ▼
STRUCTURED PRODUCT DATA  (MRP, net qty, manufacturer, generic name, mfg date, consumer
                           care, country of origin, other declarations)
   │
   ▼
COMPLIANCE RULE ENGINE   — rules_engine.py  (reads data/compliance_rules.json; never
                           invents a requirement)
   │
   ▼
COMPLIANCE ANALYSIS → PASS / FAIL / NEEDS REVIEW  (+ per-check confidence & explanation)
   │
   ▼
EVIDENCE ENGINE          — region hints + OCR snippets attached to every non-PASS result
   │
   ▼
REPORT GENERATOR         — pdf_report.py (reportlab)
   │
   ▼
DATABASE / STORAGE       — SQLite (inspections, users, rules) + uploads/ (images)
   │
   ▼
HISTORY + DASHBOARD      — Inspection History, Inspector Dashboard, Admin Analytics
```

## Technology stack

- **Frontend:** React 18 + React Router 6, built with Vite. Plain CSS design system
  (`src/index.css`) — no UI framework dependency, kept deliberately lightweight.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.x, SQLite (swap `DATABASE_URL` for
  PostgreSQL in production without code changes).
- **AI / Processing:** Pillow + NumPy (image quality heuristics), Tesseract via `pytesseract`
  (OCR), regular-expression based information extraction (`extraction.py`).
- **Reporting:** ReportLab (server-rendered PDF).
- **Auth:** Salted SHA-256 password hashing + signed HMAC session tokens (prototype scope —
  see `backend/app/security.py` for the documented limitation).

## Why AI and rules are architecturally separate

The brief's core requirement — *"Do not allow an LLM to invent legal rules"* — is enforced
structurally, not just by convention:

- `extraction.py` has no knowledge of what is "required" — it only ever answers *"what text is
  printed, and how confident am I?"*
- `rules_engine.py` has no OCR/vision code at all. It takes structured fields in, and returns
  PASS/FAIL/NEEDS REVIEW out, driven entirely by rows loaded from `compliance_rules.json`
  (or the `compliance_rules` DB table once seeded).
- An Admin can edit, version or disable a rule from the Rule Management screen without
  redeploying or touching the extraction pipeline.
- Swapping the current regex-based extractor for a trained NLP/vision model later is a
  drop-in replacement for `extract_fields()` — the rest of the system is unaffected because it
  only depends on that function's return contract.
