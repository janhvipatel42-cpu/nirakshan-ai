# Nirakshan AI

**AI-Powered Packaged Commodity Compliance Inspection System**
Smart India Hackathon 2026 — Problem Statement **SIH26034**
Ministry of Consumer Affairs, Food & Public Distribution · Department of Consumer Affairs

Nirakshan AI scans packaged-commodity label photos, extracts the printed declarations with
OCR + AI, and checks them against a **separate, versioned compliance rule engine** modelled on
the Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 (mandatory declarations) and
Rule 9 (legibility). The AI never decides compliance itself; it only reads and structures the
label. A human-readable rule engine makes the PASS / FAIL / NEEDS REVIEW call, and every result
is explainable back to the exact text or image evidence it came from.

> This is an SIH prototype. Results are an **AI-assisted preliminary inspection**, not a final
> legal determination — every screen and report says so.

---

## Project layout

```
nirakshan-ai/
├── backend/     FastAPI + SQLite service — pipeline, rule engine, PDF reports
├── frontend/    React (Vite) single-page app — all 12 screens
└── docs/        Architecture, DFDs and module notes
```

## Quick start

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt --break-system-packages   # or omit the flag inside a venv
uvicorn app.main:app --reload --port 8000
```

On first run the server automatically creates `nirakshan.db` (SQLite), seeds the compliance
rules, three demo user accounts, and three switchable demo inspections. Watch the terminal for
the printed demo login credentials.

**Optional — enable real OCR** (otherwise the pipeline still runs end-to-end and clearly labels
itself as running in demo/no-OCR mode for that upload):

```bash
sudo apt-get install tesseract-ocr      # Ubuntu/Debian
brew install tesseract                  # macOS
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads` to
`http://localhost:8000`, so no `.env` is required for local development.

### Demo logins

| Role      | Email                          | Password       |
|-----------|---------------------------------|----------------|
| Inspector | `inspector@nirakshan.gov.in`   | `Inspector@123`|
| Admin     | `admin@nirakshan.gov.in`       | `Admin@123`    |

> Auth here uses a small HMAC session token and salted SHA-256 hashing — enough for a local demo,
> not a production auth stack. See `backend/app/security.py`.

---

## Live demo script (matches Section 15 of the brief)

1. Open the landing page → **Start Inspection** → log in as Inspector.
2. Dashboard → **New Inspection**.
3. Either upload real front/back/side photos of a package, **or** click one of the three
   **Presentation shortcut** demo-sample buttons (Compliant / Non-Compliant / Needs Review) to
   jump straight into a fully worked example.
4. Walk through: Image Quality Check → AI Analysis → Extracted Information → **Compliance
   Result** (the main demo screen) → Evidence & Violation Details (highlighted label region) →
   Generate Report → Download PDF.
5. Open **History** to show the new inspection recorded, then back to **Dashboard**.
6. Log in as Admin to show **Rule Management** (rules are data, versioned, editable — never
   invented by the AI) and **Analytics**.

The **Non-Compliant** demo sample reproduces the brief's own worked example exactly: MRP Pass,
Net Quantity Pass, Manufacturer Fail, Consumer Care Needs Review, Readability Fail → 3 issues,
Non-Compliant.

---

## How the pipeline works

```
Upload (front/back/side/additional)
   → Image Quality Check        (app/image_quality.py — Pillow/NumPy heuristics)
   → OCR Text Extraction        (app/ocr_engine.py — Tesseract, with a labelled fallback)
   → AI Information Extraction  (app/extraction.py — pattern-based field extraction + confidence)
   → Compliance Rule Engine     (app/rules_engine.py — reads data/compliance_rules.json)
   → PASS / FAIL / NEEDS REVIEW → Evidence & Violation Engine → PDF Report → Inspection History
```

**Why extraction and rules are separate modules:** `extraction.py` only understands *what is
printed*. `rules_engine.py` only knows *what the law requires* (loaded from
`data/compliance_rules.json`, editable by an Admin from the Rule Management screen without
touching a line of extraction or OCR code). Swapping the regex-based extractor for a trained
model later only means replacing `extract_fields()` — its input/output contract stays the same.

See `docs/architecture.md` and `docs/dfd.md` for the layered architecture and DFD Level 0 / 1
diagrams, and `docs/modules.md` for the six-module breakdown used in the brief.

---

## Compliance rules currently modelled

Sourced from the Legal Metrology (Packaged Commodities) Rules, 2011:

| Rule ID | Requirement | Reference |
|---|---|---|
| RULE-6-1-A | Manufacturer / Packer / Importer details | Rule 6(1)(a) |
| RULE-6-1-B | Common / generic name of commodity | Rule 6(1)(b) |
| RULE-6-1-C | Net quantity declaration | Rule 6(1)(c) |
| RULE-6-1-D | Month & year of manufacture/packing/import | Rule 6(1)(d) |
| RULE-6-1-E | Retail Sale Price (MRP) declaration | Rule 6(1)(e) |
| RULE-6-2 | Consumer care details | Rule 6(2) |
| RULE-10-COO | Country of origin (imported packages only) | Rule 6(1)(a) / Rule 10(1) |
| RULE-9-1-A | Legible & prominent declaration (readability) | Rule 9(1)(a) |

This is a **starting rule set for the prototype**, not a complete or certified legal database —
an Admin can extend `data/compliance_rules.json` (re-seeded only if the `compliance_rules` table
is empty) or edit rules live from the Rule Management screen.

## Known prototype limitations (see also docs/future-scope.md)

- Evidence highlight boxes are illustrative (typical on-label positions), not the output of a
  trained layout-detection model.
- Confidence scores are transparent heuristics (regex-match strength blended with OCR
  confidence), not a calibrated ML probability.
- Auth, secrets and the SQLite database are demo-grade — replace before any real deployment.
- The rule set covers the core Rule 6 / Rule 9 declarations, not every exemption and schedule in
  the full Act.
- OCR accuracy on hand-held photos depends on lighting/focus/angle. The pipeline preprocesses
  images (upscale, contrast, sharpen) and runs two Tesseract passes to handle label layouts
  better, but very poor photos will still under-extract — that's what the Needs Review status
  and the "Show Raw OCR Text" panel on the Results screen are for.

## Troubleshooting: "Not detected" everywhere / OCR not working

1. Confirm Tesseract is actually installed and on PATH:
   ```bash
   tesseract --version
   ```
   If that fails, install it (see above), tick **"Add to PATH"** on Windows during install, then
   **restart your terminal and the backend** — a running `uvicorn` process won't pick up a PATH
   change until it's restarted.
2. On Windows, if PATH still isn't picked up, the backend auto-detects Tesseract at
   `C:\Program Files\Tesseract-OCR\tesseract.exe` (and the `(x86)` / per-user equivalents) as a
   fallback — no code change needed, just restart the backend after installing.
3. Open a completed inspection's **Results → Extracted Data → Show Raw OCR Text** to see exactly
   what Tesseract read. If it's empty, OCR genuinely isn't running (see steps 1–2). If it has text
   but a field still says "Not detected", the wording on that particular label doesn't match the
   extraction patterns yet — that's an `extraction.py` pattern-coverage gap, not a broken pipeline.
