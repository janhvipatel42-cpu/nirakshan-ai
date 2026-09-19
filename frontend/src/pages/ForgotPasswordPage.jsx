import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(event) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => { setLoading(false); setSent(true); }, 700);
  }

  return (
    <div className="auth-page forgot-page">
      <div className="auth-showcase"><Link to="/" className="auth-brand"><span>✦</span> NIRAKSHAN <b>AI</b></Link><div className="auth-copy"><div className="eyebrow">SECURITY FIRST</div><h1>Your workspace,<br /><em>always within reach.</em></h1><p>Reset access securely and get back to making evidence-backed decisions.</p></div><div className="auth-foot">Protected inspection workspace <span>•</span> Secure by design</div></div>
      <div className="auth-form-panel"><div className="auth-form-inner"><Link to="/login" className="mobile-auth-brand">← Back to login</Link><div className="auth-form-heading"><span className="eyebrow">ACCOUNT RECOVERY</span><h2>{sent ? "Check your inbox." : "Forgot password?"}</h2><p>{sent ? `If an account exists for ${email}, we've sent a reset link.` : "Enter your work email and we'll send a secure reset link."}</p></div>{sent ? <div className="recovery-success"><span>✓</span><strong>Reset link sent</strong><p>Didn't receive it? Check your spam folder or try again.</p><button className="btn btn-secondary btn-block" onClick={() => setSent(false)}>Try another email</button></div> : <form onSubmit={submit}><div className="field"><label>Email address</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@nirakshan.gov.in" required /></div><button className="btn btn-primary btn-block btn-lg auth-submit" disabled={loading}>{loading ? <span className="spinner" /> : "Send reset link ↗"}</button></form>}<Link to="/login" className="back-login">← Return to sign in</Link></div></div>
    </div>
  );
}
