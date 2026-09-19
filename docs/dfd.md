# Data Flow Diagrams

## DFD Level 0 (Context Diagram)

```
                 ┌───────────────────────────────────┐
  Login info,    │                                     │   Analytics,
  product        │                                     │   inspection data,
  details,       │           NIRAKSHAN AI              │   rule status,
  images,        │  Packaged Commodity Compliance      │   user info
  inspection ──▶ │        Inspection System            │ ◀───────────────
  request        │                                     │
                 │                                     │
  Extracted      │                                     │   User mgmt
  info,          │                                     │   requests,
  compliance     │                                     │   rule mgmt
  result,        │                                     │   requests
  violations, ◀──┤                                     │◀───────────────
  evidence,      │                                     │
  report,        └───────────────────────────────────┘
  history                    ▲              ▲
        │                    │              │
        ▼                    │              ▼
  ┌───────────┐              │        ┌───────────────┐
  │ Inspector │──────────────┘        │ Administrator │
  └───────────┘                       └───────────────┘
```

## DFD Level 1

**Processes**
1.0 User Authentication · 2.0 Image Processing · 3.0 OCR & AI Information Extraction ·
4.0 Compliance Checking · 5.0 Evidence & Violation Analysis · 6.0 Report & History Management ·
7.0 Dashboard & Administration

**Data stores**
D1 Users · D2 Product Images · D3 Product Data · D4 Compliance Rules · D5 Inspection Records ·
D6 Reports/Evidence

```
Inspector
   │ credentials
   ▼
[1.0 User Authentication] ──▶ D1 Users
   │ session token
   ▼
[2.0 Image Processing] ──▶ D2 Product Images
   │ quality-checked images
   ▼
[3.0 OCR & AI Extraction] ──▶ D3 Product Data
   │ structured fields
   ▼
[4.0 Compliance Checking] ◀──▶ D4 Compliance Rules
   │ PASS/FAIL/NEEDS REVIEW
   ▼
[5.0 Evidence & Violation Analysis] ──▶ D6 Reports/Evidence
   │ annotated result
   ▼
[6.0 Report & History Management] ──▶ D5 Inspection Records
   │ report / history
   ▼
Inspector

Administrator ◀──▶ [7.0 Dashboard & Administration] ◀──▶ D1 Users / D4 Compliance Rules / D5 Inspection Records
```

## Mapping to code

| DFD Process | Backend module |
|---|---|
| 1.0 User Authentication | `app/routers/auth.py`, `app/security.py` |
| 2.0 Image Processing | `app/image_quality.py`, `app/routers/inspections.py` (`upload_images`) |
| 3.0 OCR & AI Extraction | `app/ocr_engine.py`, `app/extraction.py` |
| 4.0 Compliance Checking | `app/rules_engine.py` |
| 5.0 Evidence & Violation Analysis | `rules_engine.REGION_HINTS` + explanation strings on each rule result |
| 6.0 Report & History Management | `app/pdf_report.py`, `app/routers/inspections.py` (`list_inspections`, `download_report`) |
| 7.0 Dashboard & Administration | `app/routers/analytics.py`, `app/routers/rules.py`, `app/routers/users.py` |
