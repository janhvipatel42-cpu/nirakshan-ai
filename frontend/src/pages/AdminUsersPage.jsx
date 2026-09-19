import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "inspector", designation: "Legal Metrology Inspector" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    api.listUsers().then(setUsers).catch((e) => setError(e.message));
  }
  useEffect(refresh, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.createUser(form);
      setForm({ name: "", email: "", password: "", role: "inspector", designation: "Legal Metrology Inspector" });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteUser(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="User & Role Management" subtitle="Manage Inspector and Administrator accounts">
      {error && <p style={{ color: "var(--fail)" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
        <form onSubmit={handleCreate} className="card card-pad" style={{ alignSelf: "start" }}>
          <div className="section-title">Add User</div>
          <div className="field">
            <label>Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Temporary Password</label>
            <input type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="inspector">Inspector</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Designation</label>
            <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={creating}>
            {creating ? "Adding…" : "Add User"}
          </button>
        </form>

        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Designation</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{u.email}</td>
                    <td><span className={`badge ${u.role === "admin" ? "badge-neutral" : "badge-pass"}`}><span className="badge-dot" />{u.role}</span></td>
                    <td className="text-soft">{u.designation}</td>
                    <td><button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--fail)" }} onClick={() => handleDelete(u.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
