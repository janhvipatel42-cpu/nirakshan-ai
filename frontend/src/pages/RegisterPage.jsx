import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", designation: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, designation: form.designation || undefined });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) { setError(err.message || "Could not create your account."); } finally { setLoading(false); }
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-showcase"><Link to="/" className="auth-brand"><span>✦</span> NIRAKSHAN <b>AI</b></Link><div className="auth-copy"><div className="eyebrow">JOIN THE WORKSPACE</div><h1>Inspect with<br /><em>confidence.</em></h1><p>Create your inspector account and turn every package label into a clear, evidence-backed decision.</p></div><div className="auth-mini-visual"><div className="mini-scan" /><div className="mini-package">NIRAKSHAN<br /><b>AI</b><small>INSPECTION OS</small></div><div className="mini-pill">✓ READY TO START</div></div><div className="auth-foot">AI-assisted preliminary inspection <span>•</span> Built for inspectors</div></div>
      <div className="auth-form-panel"><div className="auth-form-inner"><Link to="/" className="mobile-auth-brand">← Back to home</Link><div className="auth-form-heading"><span className="eyebrow">CREATE ACCOUNT</span><h2>Start inspecting.</h2><p>Set up your inspector workspace in less than a minute.</p></div><form onSubmit={submit}><div className="field"><label>Full name</label><input type="text" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ananya Sharma" required /></div><div className="field"><label>Work email</label><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@nirakshan.gov.in" required /></div><div className="field"><label>Designation <span className="optional-label">Optional</span></label><input type="text" value={form.designation} onChange={(event) => update("designation", event.target.value)} placeholder="Legal Metrology Inspector" /></div><div className="form-row"><div className="field"><label>Password</label><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="8+ characters" minLength={8} required /></div><div className="field"><label>Confirm password</label><input type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Repeat password" minLength={8} required /></div></div>{error && <p className="auth-error">{error}</p>}<button className="btn btn-primary btn-block btn-lg auth-submit" disabled={loading}>{loading ? <span className="spinner" /> : "Create inspector account ↗"}</button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p><p className="auth-legal">New accounts are created with Inspector access. Admin access is managed separately.</p></div></div>
    </div>
  );
}
