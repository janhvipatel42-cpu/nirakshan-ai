export default function ConfidenceBar({ value }) {
  if (value === null || value === undefined) return <span className="text-faint mono" style={{ fontSize: 12 }}>—</span>;
  const color = value >= 85 ? "var(--pass)" : value >= 70 ? "var(--accent-blue)" : "var(--review)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-soft)", width: 32 }}>{value}%</span>
    </div>
  );
}
