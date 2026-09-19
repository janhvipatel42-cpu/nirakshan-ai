import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function AdminRulesPage() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  function refresh() {
    api.listRules().then(setRules).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function toggleActive(rule) {
    setBusy(rule.rule_id);
    try {
      const updated = await api.updateRule(rule.rule_id, { active: !rule.active });
      setRules((rs) => rs.map((r) => (r.rule_id === rule.rule_id ? updated : r)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <Layout title="Rule Management" subtitle="Versioned Legal Metrology compliance requirements — kept separate from AI extraction logic">
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      <div className="card card-pad" style={{ marginBottom: 18, background: "var(--accent-blue-tint)" }}>
        <p style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 600 }}>
          Rules are data, not code. Disabling a rule here removes it from every future compliance check
          without touching the extraction or OCR pipeline — the AI never invents a legal requirement.
        </p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Rule ID</th><th>Name</th><th>Legal Reference</th><th>Applicability</th><th>Version</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.rule_id}>
                  <td className="code-cell">{r.rule_id}</td>
                  <td style={{ maxWidth: 220 }}>{r.name}</td>
                  <td className="text-soft" style={{ fontSize: 12.5, maxWidth: 260 }}>{r.legal_reference}</td>
                  <td className="text-soft" style={{ fontSize: 12.5 }}>{r.applicability}</td>
                  <td className="mono">v{r.version}</td>
                  <td>
                    <span className={`badge ${r.active ? "badge-pass" : "badge-not_applicable"}`}>
                      <span className="badge-dot" /> {r.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12.5 }} disabled={busy === r.rule_id} onClick={() => toggleActive(r)}>
                      {r.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
