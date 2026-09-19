import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api/client.js";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => { api.analytics().then(setData).catch((e) => setError(e.message)); }, []);

  const maxCount = Math.max(1, ...(data?.violations_by_requirement || []).map((v) => v.count));

  return (
    <Layout title="Admin Analytics" subtitle="Compliance performance across all inspections">
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="card stat-card"><div className="stat-label">Total Inspections</div><div className="stat-value">{data?.total_inspections ?? "—"}</div></div>
        <div className="card stat-card"><div className="stat-label">Compliance Rate</div><div className="stat-value pass">{data ? `${data.compliance_rate}%` : "—"}</div></div>
        <div className="card stat-card"><div className="stat-label">Non-Compliant</div><div className="stat-value fail">{data?.by_result?.NON_COMPLIANT ?? "—"}</div></div>
        <div className="card stat-card"><div className="stat-label">Needs Review</div><div className="stat-value review">{data?.by_result?.NEEDS_REVIEW ?? "—"}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="section-title">Violations by Requirement</div>
          {(data?.violations_by_requirement || []).length === 0 && <p className="text-soft" style={{ fontSize: 13.5 }}>No violations recorded yet.</p>}
          {(data?.violations_by_requirement || []).map((v) => (
            <div key={v.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span>{v.name}</span><span className="mono text-soft">{v.count}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--surface-sunken)", overflow: "hidden" }}>
                <div style={{ width: `${(v.count / maxCount) * 100}%`, height: "100%", background: "var(--fail)" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <div className="section-title">Admin Functions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link to="/admin/rules" className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start" }}>Manage Rules</Link>
            <Link to="/admin/users" className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start" }}>Manage Users</Link>
            <Link to="/history" className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start" }}>View Inspections</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 0 }}><div className="section-title">Recent Inspections</div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Inspection ID</th><th>Product</th><th>Inspector</th><th>Status</th></tr></thead>
            <tbody>
              {(data?.recent || []).map((i) => (
                <tr key={i.id} className="clickable" onClick={() => navigate(`/inspections/${i.id}/results`)}>
                  <td className="code-cell">{i.inspection_code}</td>
                  <td>{i.product_name}</td>
                  <td className="text-soft">{i.inspector_name || "—"}</td>
                  <td><StatusBadge status={i.overall_result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
