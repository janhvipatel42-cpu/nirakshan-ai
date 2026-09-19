import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboardStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <Layout title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(" ")[0] || "Inspector"}`}>
      <div className="dashboard-intro">
        <div><div className="eyebrow">INSPECTION CONTROL CENTER</div><h1>Good morning, {user?.name?.split(" ")[0] || "Inspector"}.</h1><p>Ready to inspect your next product?</p></div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/history" className="btn btn-secondary">View History</Link>
          <Link to="/inspections/new" className="btn btn-primary">+ New inspection <span>↗</span></Link>
        </div>
      </div>

      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      <div className="stat-grid dashboard-stats">
        <div className="card stat-card stat-total">
          <div className="stat-label">Total Inspections</div>
          <div className="stat-value">{stats?.total_inspections ?? "—"}</div>
          <div className="stat-note">All time activity <span>↗</span></div>
        </div>
        <div className="card stat-card stat-good">
          <div className="stat-label">Compliant</div>
          <div className="stat-value pass">{stats?.compliant ?? "—"}</div>
          <div className="stat-note">Clear for market <span>✓</span></div>
        </div>
        <div className="card stat-card stat-bad">
          <div className="stat-label">Non-Compliant</div>
          <div className="stat-value fail">{stats?.non_compliant ?? "—"}</div>
          <div className="stat-note">Action required <span>!</span></div>
        </div>
        <div className="card stat-card stat-review">
          <div className="stat-label">Needs Review</div>
          <div className="stat-value review">{stats?.needs_review ?? "—"}</div>
          <div className="stat-note">Awaiting verification <span>◌</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <div className="section-title">Recent Inspections</div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th><th>Product</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent || []).map((i) => (
                <tr key={i.id} className="clickable" onClick={() => navigate(`/inspections/${i.id}/results`)}>
                  <td className="code-cell">{i.inspection_code}{i.is_demo && <span className="demo-tag" style={{ marginLeft: 8 }}>DEMO</span>}</td>
                  <td>{i.product_name}{i.brand ? ` — ${i.brand}` : ""}</td>
                  <td className="text-soft">{new Date(i.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={i.overall_result} /></td>
                </tr>
              ))}
              {stats && stats.recent.length === 0 && (
                <tr><td colSpan={4} className="empty-state">No inspections yet. Start your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
