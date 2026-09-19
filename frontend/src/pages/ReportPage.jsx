import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StepProgress from "../components/StepProgress.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api/client.js";
import { useInspection } from "../context/InspectionContext.jsx";

export default function ReportPage() {
  const { id } = useParams();
  const { inspection, loadInspection } = useInspection();
  const [error, setError] = useState("");

  useEffect(() => { loadInspection(id).catch((e) => setError(e.message)); }, [id]);

  const results = inspection?.rule_results || [];
  const issues = results.filter((r) => r.status !== "PASS");

  return (
    <Layout title="Inspection Report" subtitle={inspection ? inspection.inspection_code : "Loading…"}>
      <StepProgress current="report" />
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      {inspection && (
        <div className="card" style={{ maxWidth: 760 }}>
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "var(--brand-deep)" }}>NIRAKSHAN AI</div>
                <div className="text-soft" style={{ fontSize: 12.5 }}>Inspection Report</div>
              </div>
              {inspection.is_demo && <span className="demo-tag">PROTOTYPE SAMPLE DATA</span>}
            </div>

            <div className="form-row" style={{ marginTop: 18 }}>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Inspection ID</div>
                <div className="mono" style={{ fontWeight: 600 }}>{inspection.inspection_code}</div>
              </div>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Date</div>
                <div style={{ fontWeight: 600 }}>{new Date(inspection.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Inspector</div>
                <div style={{ fontWeight: 600 }}>{inspection.inspector_name || "—"}</div>
              </div>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Category</div>
                <div style={{ fontWeight: 600 }}>{inspection.product_category || "—"}</div>
              </div>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Product</div>
                <div style={{ fontWeight: 600 }}>{inspection.product_name}</div>
              </div>
              <div>
                <div className="text-soft" style={{ fontSize: 12 }}>Brand</div>
                <div style={{ fontWeight: 600 }}>{inspection.brand || "—"}</div>
              </div>
            </div>
          </div>

          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className={`result-banner ${inspection.overall_result}`} style={{ marginBottom: 0 }}>
              <div>
                <div className="result-banner-label">OVERALL RESULT</div>
                <div className="result-banner-value">{inspection.overall_result?.replace("_", " ")}</div>
              </div>
              <div className="result-banner-issues">{inspection.issues_count} issue(s) detected</div>
            </div>
          </div>

          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="section-title">Compliance Check Table</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Requirement</th><th>Legal Reference</th><th>Status</th><th>Confidence</th></tr></thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.rule_id}>
                      <td>{r.name}</td>
                      <td className="text-soft" style={{ fontSize: 12.5 }}>{r.legal_reference}</td>
                      <td><StatusBadge status={r.status} small /></td>
                      <td className="mono">{r.confidence ?? "—"}{r.confidence !== null && r.confidence !== undefined ? "%" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="section-title">Violation Details</div>
              {issues.map((r) => (
                <div key={r.rule_id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name} — {r.status.replace("_", " ")}</div>
                  <p className="text-soft" style={{ fontSize: 13, marginTop: 3 }}>{r.explanation}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="section-title">Evidence</div>
            <div style={{ display: "flex", gap: 10 }}>
              {(inspection.images || []).map((img) => (
                <img key={img.id} src={img.url} alt={img.image_type} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              ))}
              {(!inspection.images || inspection.images.length === 0) && <span className="text-faint">No images attached.</span>}
            </div>
          </div>

          <div className="card-pad">
            <p className="text-faint" style={{ fontSize: 12, lineHeight: 1.6 }}>
              This is an AI-assisted preliminary compliance inspection generated by Nirakshan AI. It is intended
              to support, not replace, review by an authorised Legal Metrology Officer. Final compliance
              determinations rest with the competent authority.
            </p>
            <p style={{ fontSize: 12.5, marginTop: 10 }}><strong>Reviewer/Inspector:</strong> {inspection.inspector_name || "—"}</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <a className="btn btn-primary btn-lg" href={inspection ? api.reportUrl(id) : "#"} target="_blank" rel="noreferrer">
          ⬇ Download PDF
        </a>
        <Link className="btn btn-secondary btn-lg" to="/history">View Inspection History</Link>
        <Link className="btn btn-ghost btn-lg" to="/dashboard">Back to Dashboard</Link>
      </div>
    </Layout>
  );
}
