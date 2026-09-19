import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const ICONS = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  add: "M12 5v14M5 12h14",
  history: "M3 12a9 9 0 1 0 3-6.7M3 12V6m0 6h6",
  report: "M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 8H8m8 4H8m4-8H8",
  chart: "M4 20V10m6 10V4m6 16v-7",
  rules: "M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 14v-2a4 4 0 0 0-3-3.87M15.5 3.5a4 4 0 0 1 0 7.75",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.44 15a1.7 1.7 0 0 0-1.56-1.04H6v-2.4h.2A1.7 1.7 0 0 0 7.76 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06A1.7 1.7 0 0 0 11 6.76 1.7 1.7 0 0 0 12.04 5.2V5h2.4v.2A1.7 1.7 0 0 0 15.48 6.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.72 10a1.7 1.7 0 0 0 1.56 1.04h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ d, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Layout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const inspectorLinks = [
    { to: "/dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { to: "/inspections/new", label: "New Inspection", icon: ICONS.add },
    { to: "/history", label: "History", icon: ICONS.history },
    { to: "/settings", label: "Settings", icon: ICONS.settings },
  ];
  const adminLinks = [
    { to: "/admin", label: "Analytics", icon: ICONS.chart },
    { to: "/admin/rules", label: "Rules", icon: ICONS.rules },
    { to: "/admin/users", label: "Users", icon: ICONS.users },
  ];

  return (
    <div className="shell premium-shell">
      {mobileOpen && <button className="drawer-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">✦</div>
          <div className="sidebar-brand-text">
            <strong>NIRAKSHAN <b>AI</b></strong>
            <span>Inspection intelligence</span>
          </div>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div><nav className="sidebar-nav">
          {inspectorLinks.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
              <Icon d={l.icon} /> {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="sidebar-section-label admin-label">ADMINISTRATION</div>
              {adminLinks.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                  <Icon d={l.icon} /> {l.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials(user?.name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.designation || user?.role}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <Icon d={ICONS.logout} size={15} /> Log out
          </button>
        </div>
      </aside>
      <div className="main">
        {title && (
          <div className="topbar premium-topbar">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon d={ICONS.menu} /></button>
            <div>
              <div className="topbar-kicker">NIRAKSHAN / WORKSPACE</div><div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-sub">{subtitle}</div>}
            </div>
            <div className="topbar-actions"><span className="live-status"><i /> System operational</span><button className="topbar-avatar">{initials(user?.name)}</button></div>
          </div>
        )}
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
