import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api/client.js";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchData() {
    setLoading(true);
    try {
      const data = await api.listInspections({ search, result, date_from: dateFrom, date_to: dateTo });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilter(e) {
    e.preventDefault();
    fetchData();
  }

  return (
    <Layout title="Inspection History" subtitle="Search and review past inspections">
      <form onSubmit={handleFilter} className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="form-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input type="search" placeholder="Product, brand or inspection ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="">All</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON_COMPLIANT">Non-Compliant</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" style={{ height: 42 }}>Filter</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Inspection ID</th><th>Product</th><th>Date</th><th>Inspector</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => navigate(`/inspections/${i.id}/results`)}>
                  <td className="code-cell">{i.inspection_code}{i.is_demo && <span className="demo-tag" style={{ marginLeft: 8 }}>DEMO</span>}</td>
                  <td>{i.product_name}{i.brand ? ` — ${i.brand}` : ""}</td>
                  <td className="text-soft">{new Date(i.created_at).toLocaleDateString()}</td>
                  <td className="text-soft">{i.inspector_name || "—"}</td>
                  <td><StatusBadge status={i.overall_result} /></td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No inspections match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
