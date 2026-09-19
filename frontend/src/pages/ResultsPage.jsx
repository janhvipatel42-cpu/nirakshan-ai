import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StepProgress from "../components/StepProgress.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfidenceBar from "../components/ConfidenceBar.jsx";
import { useInspection } from "../context/InspectionContext.jsx";

const FIELD_ROWS = [
  { key: "generic_name", label: "Product Name / Generic Name" },
  { key: "mrp", label: "MRP" },
  { key: "net_quantity", label: "Net Quantity" },
  { key: "manufacturer", label: "Manufacturer / Packer / Importer" },
  { key: "country_of_origin", label: "Country of Origin" },
  { key: "consumer_care", label: "Consumer Care Details" },
  { key: "mfg_date", label: "Manufacturing / Packing Date" },
];

const RESULT_COPY = {
  COMPLIANT: "All applicable declarations were detected and validated.",
  NON_COMPLIANT: "One or more required declarations are missing or failed validation.",
  NEEDS_REVIEW: "No failures detected, but some declarations need manual verification.",
};

const STATUS_COLOR = { FAIL: "var(--fail)", NEEDS_REVIEW: "var(--review)" };

function CheckMark({ status }) {
  const paths = {
    PASS: "M20 6 9 17l-5-5",
    FAIL: "M18 6 6 18M6 6l12 12",
    NEEDS_REVIEW: "M12 9v4M12 17h.01M10.3 3.9 2 18a1.5 1.5 0 0 0 1.3 2.2h17.4A1.5 1.5 0 0 0 22 18L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z",
    NOT_APPLICABLE: "M5 12h14",
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[status] || paths.NOT_APPLICABLE} />
    </svg>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const { inspection, loadInspection } = useInspection();
  const [tab, setTab] = useState("overview"); // overview | extracted | evidence
  const [selectedIssue, setSelectedIssue] = useState(0);
  const [error, setError] = useState("");
  const [showRawOcr, setShowRawOcr] = useState(false);

  useEffect(() => { loadInspection(id).catch((e) => setError(e.message)); }, [id]);

  const data = inspection?.extracted_data || {};
  const results = inspection?.rule_results || [];
  const overall = inspection?.overall_result;
  const issues = results.filter((r) => r.status === "FAIL" || r.status === "NEEDS_REVIEW");
  const counts = {
    total: results.length,
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
    review: results.filter((r) => r.status === "NEEDS_REVIEW").length,
    na: results.filter((r) => r.status === "NOT_APPLICABLE").length,
  };
  const image = inspection?.images?.[0];
  const currentIssue = issues[selectedIssue];

  function goToEvidence(ruleIndexInIssues) {
    setSelectedIssue(ruleIndexInIssues);
    setTab("evidence");
  }

  return (
    <Layout title="Inspection Results" subtitle={inspection ? `${inspection.inspection_code} · ${inspection.product_name}` : "Loading…"}>
      <StepProgress current="results" />
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}
      {inspection?.is_demo && <div className="demo-tag" style={{ marginBottom: 14 }}>PROTOTYPE SAMPLE DATA</div>}

      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "var(--surface-sunken)", padding: 4, borderRadius: 9, width: "fit-content" }}>
        {[
          { key: "overview", label: "Compliance Result" },
          { key: "extracted", label: "Extracted Data" },
          { key: "evidence", label: `Evidence${issues.length ? ` (${issues.length})` : ""}` },
        ].map((t) => (
          <button
            key={t.key}
            className="btn"
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "var(--surface)" : "transparent",
              boxShadow: tab === t.key ? "var(--shadow-card)" : "none",
              color: tab === t.key ? "var(--ink)" : "var(--ink-soft)",
              padding: "8px 16px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {overall && (
            <div className={`result-banner ${overall} premium-result-banner`}>
              <div>
                <div className="result-banner-label">OVERALL RESULT</div>
                <div className="result-banner-value">{overall.replace("_", " ")} <span className="result-spark">✦</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="result-banner-issues">{inspection.issues_count} Issue{inspection.issues_count === 1 ? "" : "s"} Detected</div>
                <div className="text-soft" style={{ fontSize: 12.5, marginTop: 4, maxWidth: 320 }}>{RESULT_COPY[overall]}</div>
              </div>
            </div>
          )}

          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            <div className="card stat-card"><div className="stat-label">Total Checks</div><div className="stat-value">{counts.total}</div></div>
            <div className="card stat-card"><div className="stat-label">Passed</div><div className="stat-value pass">{counts.pass}</div></div>
            <div className="card stat-card"><div className="stat-label">Failed</div><div className="stat-value fail">{counts.fail}</div></div>
            <div className="card stat-card"><div className="stat-label">Needs Review</div><div className="stat-value review">{counts.review}</div></div>
            <div className="card stat-card"><div className="stat-label">N/A</div><div className="stat-value">{counts.na}</div></div>
          </div>

          <div className="card card-pad results-card">
            <div className="results-heading"><div><div className="eyebrow">RULE ENGINE / {counts.total} CHECKS</div><h2>Compliance breakdown</h2></div><span className="pill">Legal Metrology 2011</span></div>
            <div className="check-list">
              {results.map((r) => {
                const issueIdx = issues.findIndex((i) => i.rule_id === r.rule_id);
                return (
                  <div className="check-row" key={r.rule_id}>
                    <div className="check-row-main">
                      <div className={`check-icon ${r.status.toLowerCase()}`}><CheckMark status={r.status} /></div>
                      <div>
                        <div className="check-name">{r.name}</div>
                        <div className="check-sub">{r.legal_reference}</div>
                      </div>
                    </div>
                    <div className="check-right">
                      {r.confidence !== null && r.confidence !== undefined && <span className="confidence-pill">{r.confidence}%</span>}
                      <StatusBadge status={r.status} />
                      {issueIdx !== -1 && (
                        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => goToEvidence(issueIdx)}>
                          View Evidence
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Link className="btn btn-secondary btn-lg" to={`/inspections/${id}/report`}>Generate Report</Link>
            <Link className="btn btn-ghost btn-lg" to="/dashboard">← Back to Dashboard</Link>
          </div>
        </>
      )}

      {tab === "extracted" && (
        <>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="section-title">Declarations Detected on Package</div>
            {FIELD_ROWS.map((row) => {
              const field = data[row.key];
              const hasValue = field && field.value;
              const isImported = inspection?.is_imported;
              const naOrigin = row.key === "country_of_origin" && !isImported;
              return (
                <div className="field-row" key={row.key}>
                  <div className="field-name">{row.label}</div>
                  {naOrigin ? (
                    <div className="field-value empty" style={{ flex: 1 }}>Not applicable — domestic product</div>
                  ) : (
                    <div className={`field-value${hasValue ? "" : " empty"}`} style={{ flex: 1 }}>{hasValue ? field.value : "Not detected"}</div>
                  )}
                  {!naOrigin && <ConfidenceBar value={hasValue ? field.confidence : null} />}
                </div>
              );
            })}
          </div>

          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="section-title">Other Detected Declarations</div>
            {(data.other_declarations || []).length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {data.other_declarations.map((d, i) => <span className="pill" key={i}>{d}</span>)}
              </div>
            ) : <p className="text-soft" style={{ fontSize: 13.5 }}>No additional declarations detected.</p>}
          </div>

          <div className="card card-pad">
            <button className="btn btn-ghost" style={{ padding: "6px 4px", fontSize: 12.5 }} onClick={() => setShowRawOcr((s) => !s)}>
              {showRawOcr ? "Hide" : "Show"} Raw OCR Text {inspection?.ocr_mode ? `(mode: ${inspection.ocr_mode})` : ""}
            </button>
            {showRawOcr && (
              <pre className="mono" style={{ marginTop: 10, background: "var(--surface-sunken)", padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }}>
                {inspection?.ocr_text || "(no OCR text captured)"}
              </pre>
            )}
          </div>
        </>
      )}

      {tab === "evidence" && (
        <>
          {issues.length === 0 && inspection && (
            <div className="card card-pad empty-state">No violations or review items were found — every applicable declaration passed.</div>
          )}
          {issues.length > 0 && (
            <div className="evidence-layout">
              <div className="evidence-image-wrap">
                {image ? <img src={image.url} alt="Package evidence" /> : <div className="empty-state">No image available</div>}
                {currentIssue?.region_hint && (
                  <div
                    className="evidence-highlight"
                    data-label={currentIssue.status === "FAIL" ? "Missing / Failed" : "Needs Review"}
                    style={{
                      left: `${currentIssue.region_hint.x}%`, top: `${currentIssue.region_hint.y}%`,
                      width: `${currentIssue.region_hint.w}%`, height: `${currentIssue.region_hint.h}%`,
                      borderColor: STATUS_COLOR[currentIssue.status],
                    }}
                  >
                    <style>{`.evidence-highlight::after{background:${STATUS_COLOR[currentIssue.status]}}`}</style>
                  </div>
                )}
                <p style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(11,42,32,0.82)", color: "white", fontSize: 11, padding: "8px 12px" }}>
                  Illustrative label region — approximate position, not a precise layout-detection output.
                </p>
              </div>
              <div>
                <div className="section-title">Flagged Requirements ({issues.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {issues.map((r, i) => (
                    <div
                      key={r.rule_id}
                      className="card card-pad"
                      onClick={() => setSelectedIssue(i)}
                      style={{ cursor: "pointer", borderColor: i === selectedIssue ? STATUS_COLOR[r.status] : "var(--border)", borderWidth: i === selectedIssue ? 1.5 : 1 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.name}</div>
                        <StatusBadge status={r.status} small />
                      </div>
                      <div className="text-soft mono" style={{ fontSize: 11.5, marginBottom: 8 }}>{r.legal_reference}</div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{r.explanation}</p>
                      {r.evidence_snippet && (
                        <div style={{ marginTop: 10, background: "var(--surface-sunken)", borderRadius: 6, padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>
                          "…{r.evidence_snippet}…"
                        </div>
                      )}
                      {r.confidence !== null && r.confidence !== undefined && (
                        <div className="text-faint" style={{ fontSize: 11.5, marginTop: 8 }}>Confidence: {r.confidence}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
