# Future Scope

The current prototype focuses on proving the end-to-end workflow with a real, auditable pipeline.
Beyond the SIH prototype stage, the natural next steps are:

- **Multilingual label recognition** — extend OCR/extraction beyond English to the scheduled
  languages commonly printed on Indian packaging.
- **Trained layout/vision model** — replace the illustrative `REGION_HINTS` bounding boxes with a
  real label-layout detection model so evidence highlights are pixel-accurate, not typical-position
  approximations.
- **Larger, validated product dataset** — move past the three demo scenarios to a labelled dataset
  spanning many categories, for proper accuracy evaluation of extraction and OCR.
- **Broader rule coverage** — extend `compliance_rules.json` beyond the core Rule 6 / Rule 9
  declarations to cover category-specific schedules and exemptions in the full Act.
- **Human-in-the-loop verification** — a lightweight review queue where an Inspector confirms or
  corrects NEEDS_REVIEW items, feeding corrections back to improve extraction over time.
- **Mobile application** — a camera-first mobile app for field inspectors, reusing the same
  backend API.
- **Advanced analytics** — trend lines, category/region breakdowns, and repeat-offender tracking
  for the Admin analytics screen.
- **Centralized deployment** — move from SQLite/local uploads to a managed database and object
  storage for multi-office use.
- **Rule version history & audit trail** — track who changed a rule and when, not just its current
  active/inactive state.
- **Integration with official systems** — where permitted, integrate with departmental case
  management or e-Maapan-style systems instead of standing alone.
