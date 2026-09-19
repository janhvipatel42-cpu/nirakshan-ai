import { Link } from "react-router-dom";

const PIPELINE = [
  { n: "01", title: "Scan", desc: "Front, back & side package images" },
  { n: "02", title: "Extract", desc: "OCR reads every printed declaration" },
  { n: "03", title: "Understand", desc: "AI structures text into labelled fields" },
  { n: "04", title: "Check", desc: "Rule engine evaluates Legal Metrology requirements" },
  { n: "05", title: "Explain", desc: "Evidence & reasoning for every violation" },
  { n: "06", title: "Report", desc: "Signed digital inspection report" },
];

const FEATURES = [
  { title: "Structured Rule Engine", desc: "Compliance checks run on a versioned rule set mapped to the Legal Metrology (Packaged Commodities) Rules, 2011 — never invented by a model at request time.", icon: "M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z" },
  { title: "Explainable Evidence", desc: "Every Fail or Needs Review verdict is linked back to the exact declaration and label region it was decided from.", icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" },
  { title: "Confidence-Aware", desc: "Low-confidence extractions are routed to Needs Review instead of a false Pass or Fail, keeping a human in the loop.", icon: "M12 20V10M18 20V4M6 20v-4" },
  { title: "Digital Inspection Reports", desc: "One-click, print-ready PDF reports with the compliance table, violations and photographic evidence attached.", icon: "M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" },
  { title: "Inspection History", desc: "Every inspection, decision and piece of evidence is retained and searchable for audit and analytics.", icon: "M3 12a9 9 0 1 0 3-6.7M3 12V6m0 6h6" },
  { title: "Role-Based Access", desc: "Separate Inspector and Administrator roles, with rule versioning and user management reserved for Admins.", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
];

function FeatureIcon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="mark"><span>✦</span></span>
          <span>NIRAKSHAN <b>AI</b></span>
        </div>
        <div className="landing-nav-actions">
          <a href="#platform" className="nav-text-link">Platform</a>
          <a href="#features" className="nav-text-link">Capabilities</a>
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
          <Link to="/login" className="btn btn-primary">Start inspection <span>↗</span></Link>
        </div>
      </nav>

      <header className="landing-hero premium-hero">
        <div>
          <div className="eyebrow"><span className="eyebrow-pulse" /> AI-ASSISTED COMPLIANCE · 2026</div>
          <h1 className="landing-h1">Scan. Verify.<br /><span className="accent">Inspect.</span></h1>
          <p className="landing-sub">
            The visual intelligence layer for packaged commodity inspections. Read every label,
            verify every declaration, and make decisions backed by evidence.
          </p>
          <div className="landing-actions">
            <Link to="/login" className="btn btn-primary btn-lg">Start new inspection <span>↗</span></Link>
            <a href="#platform" className="btn btn-secondary btn-lg"><span className="play-icon">▶</span> Explore demo</a>
          </div>
          <div className="trust-line"><span className="avatar-stack"><i>R</i><i>S</i><i>V</i></span><span>Trusted by modern inspection teams</span><span className="trust-divider" /> <strong>8</strong> legal checks per label</div>
          <div className="landing-meta">
            <div><strong>01</strong><span>Capture the label</span></div>
            <div><strong>02</strong><span>Extract declarations</span></div>
            <div><strong>03</strong><span>Verify compliance</span></div>
          </div>
        </div>

        <div className="inspection-visual" id="platform">
          <div className="visual-grid" />
          <div className="scan-orbit orbit-one" /><div className="scan-orbit orbit-two" />
          <div className="visual-label label-top"><span className="status-dot" /> LIVE ANALYSIS <b>98.4%</b></div>
          <div className="product-card">
            <div className="product-brand">AURELIA <span>ORGANICS</span></div>
            <div className="product-bottle"><div className="bottle-cap" /><div className="bottle-body"><span>cold<br /><b>pressed</b></span><small>sunflower oil</small></div></div>
            <div className="product-copy">100% PURE · PREMIUM QUALITY<br /><b>NET QTY 1 L</b></div>
          </div>
          <div className="scan-line" />
          <div className="visual-label label-left"><span>✓</span> MRP DETECTED <b>₹145.00</b></div>
          <div className="visual-label label-right"><span>✓</span> NET QUANTITY <b>1 L</b></div>
          <div className="visual-result"><span className="result-check">✓</span><div><small>RULE ENGINE RESULT</small><strong>COMPLIANT</strong></div><span className="result-arrow">↗</span></div>
          <div className="visual-footer"><span>OCR confidence</span><b>96.8%</b><div><i style={{ width: "96.8%" }} /></div></div>
        </div>
      </header>

      <section className="landing-section" id="features">
        <div className="landing-section-head">
          <div className="eyebrow">THE INSPECTION OS</div><h2>Clarity at every step<br /><em>of the inspection.</em></h2>
          <p>
            A calm, auditable workflow for high-stakes decisions. Nirakshan separates what the AI
            reads from what the rules decide, so every result stays explainable.
          </p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="card feature-card" key={f.title}>
              <div className="icon"><FeatureIcon d={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>NIRAKSHAN <b>AI</b></span><span>AI-assisted preliminary inspection · not a final legal determination</span><span>© 2026</span>
      </footer>
    </div>
  );
}
