const LABELS = {
  PASS: "Pass",
  FAIL: "Fail",
  NEEDS_REVIEW: "Review",
  NOT_APPLICABLE: "N/A",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  GOOD: "Good",
  REVIEW: "Review",
};

export default function StatusBadge({ status, small }) {
  if (!status) return <span className="badge badge-neutral">Pending</span>;
  const cls = status.toLowerCase();
  return (
    <span className={`badge badge-${cls}`} style={small ? { padding: "2px 8px", fontSize: 11 } : undefined}>
      <span className="badge-dot" />
      {LABELS[status] || status}
    </span>
  );
}
