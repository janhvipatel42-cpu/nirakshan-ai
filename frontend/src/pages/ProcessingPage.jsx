import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StepProgress from "../components/StepProgress.jsx";
import { useInspection } from "../context/InspectionContext.jsx";

const QUALITY_ROWS = [
  { key: "resolution", label: "Resolution" },
  { key: "clarity", label: "Clarity" },
  { key: "lighting", label: "Lighting" },
  { key: "label_visibility", label: "Label Visibility" },
  { key: "text_readability", label: "Text Readability" },
];

const STAGES = [
  "Image Pre-processing",
  "OCR Text Extraction",
  "AI Information Extraction",
  "Compliance Rule Checking",
  "Generating Results",
];

function CheckIcon({ ok }) {
  return ok ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 2 18a1.5 1.5 0 0 0 1.3 2.2h17.4A1.5 1.5 0 0 0 22 18L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" /></svg>
  );
}

export default function ProcessingPage() {
  const { id } = useParams();
  const { inspection, loadInspection } = useInspection();
  const [phase, setPhase] = useState("quality"); // quality -> pipeline -> done
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => { loadInspection(id).catch((e) => setError(e.message)); }, [id]);

  // Phase 1: show the quality check briefly, then move into the pipeline animation.
  useEffect(() => {
    if (phase !== "quality" || !inspection) return;
    const t = setTimeout(() => setPhase("pipeline"), 1100);
    return () => clearTimeout(t);
  }, [phase, inspection]);

  // Phase 2: step through the pipeline stages, then go to Results.
  useEffect(() => {
    if (phase !== "pipeline") return;
    if (activeStage >= STAGES.length) {
      const t = setTimeout(() => navigate(`/inspections/${id}/results`), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveStage((s) => s + 1), 500);
    return () => clearTimeout(t);
  }, [phase, activeStage, id, navigate]);

  const quality = inspection?.image_quality || {};
  const anyReview = QUALITY_ROWS.some((r) => quality[r.key]?.status !== "GOOD");

  return (
    <Layout title="Processing Inspection" subtitle={inspection ? `${inspection.inspection_code} · ${inspection.product_name}` : "Loading…"}>
      <StepProgress current="processing" />
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      <div className="card card-pad page-narrow processing-card">
        <div className="processing-hero"><div className="processing-orb"><span className="processing-ring" /><span>✦</span></div><div><div className="eyebrow">NIRAKSHAN VISION ENGINE</div><h2>{phase === "quality" ? "Reading your label." : "Analyzing product..."}</h2><p>We are turning visual evidence into an explainable inspection.</p></div></div>
        <div className="section-title">Image Quality Check</div>
        <div className="check-list">
          {QUALITY_ROWS.map((row) => {
            const item = quality[row.key];
            const ok = item?.status === "GOOD";
            return (
              <div className="check-row" key={row.key}>
                <div className="check-row-main">
                  <div className={`check-icon ${ok ? "pass" : "review"}`}><CheckIcon ok={ok} /></div>
                  <div>
                    <div className="check-name">{row.label}</div>
                    {item?.detail && <div className="check-sub">{item.detail}</div>}
                  </div>
                </div>
                <span className={`badge badge-${ok ? "pass" : "review"}`}><span className="badge-dot" /> {ok ? "Good" : "Review"}</span>
              </div>
            );
          })}
        </div>

        {anyReview && phase === "quality" && (
          <p className="text-soft" style={{ fontSize: 12.5, marginTop: 12 }}>
            Some checks need review — this does not fail the product. Low-confidence readings are
            simply flagged for manual verification later in the results.
          </p>
        )}

        {phase !== "quality" && (
          <>
            <div className="divider" />
            <div className="section-title">Running Compliance Pipeline</div>
            <div className="check-list">
              {STAGES.map((label, i) => {
                const done = i < activeStage;
                const running = i === activeStage;
                return (
                  <div className="check-row" key={label}>
                    <div className="check-row-main">
                      <div className={`check-icon ${done ? "pass" : "not_applicable"}`}>
                        {done ? "✓" : running ? <span className="spinner spinner-dark" /> : "○"}
                      </div>
                      <div className="check-name" style={{ color: done || running ? "var(--ink)" : "var(--ink-faint)" }}>{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: "var(--surface-sunken)", overflow: "hidden" }}>
              <div style={{ width: `${(Math.min(activeStage, STAGES.length) / STAGES.length) * 100}%`, height: "100%", background: "var(--brand)", transition: "width 0.4s ease" }} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
