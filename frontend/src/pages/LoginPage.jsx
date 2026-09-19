import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO_CREDS = {
  inspector: { email: "inspector@nirakshan.gov.in", password: "Inspector@123" },
  admin: { email: "admin@nirakshan.gov.in", password: "Admin@123" },
};

export default function LoginPage() {
  const [role, setRole] = useState("inspector");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password, role);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDS[role].email);
    setPassword(DEMO_CREDS[role].password);
  }

  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <Link to="/" className="auth-brand"><span>✦</span> NIRAKSHAN <b>AI</b></Link>
        <div className="auth-copy"><div className="eyebrow">THE FUTURE OF INSPECTION</div><h1>Decisions you can<br /><em>stand behind.</em></h1><p>Turn printed labels into clear, evidence-backed compliance decisions in seconds.</p></div>
        <div className="auth-mini-visual"><div className="mini-scan" /><div className="mini-package">AURELIA<br /><b>ORGANICS</b><small>NET QTY 1 L</small></div><div className="mini-pill">✓ COMPLIANT</div></div>
        <div className="auth-foot">AI-assisted preliminary inspection <span>•</span> Built for inspectors</div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <Link to="/" className="mobile-auth-brand">← Back to home</Link>
          <div className="auth-form-heading"><span className="eyebrow">SECURE ACCESS</span><h2>Welcome back.</h2><p>Sign in to continue your inspection workspace.</p></div>

        <div className="role-switch">
          {["inspector", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`btn${role === r ? " active" : ""}`}
            >
              {r === "inspector" ? "Inspector Login" : "Admin Login"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field"><label>Email address</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nirakshan.gov.in" required />
          </div>
          <div className="field"><div className="field-label-row"><label>Password</label><Link to="/forgot-password">Forgot password?</Link></div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: "var(--fail)", fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <button className="btn btn-primary btn-block btn-lg auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Login"}
          </button>
        </form>

        <div className="auth-demo"><span>Demo access · {role}</span><button className="btn btn-ghost" onClick={fillDemo} type="button">Use demo account ↗</button></div>
        <p className="auth-legal">By continuing, you agree to the inspection workspace terms.</p>
        </div>
      </div>
    </div>
  );
}
