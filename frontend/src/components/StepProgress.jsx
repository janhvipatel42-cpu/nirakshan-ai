const STEPS = [
  { key: "details", label: "Product Details" },
  { key: "processing", label: "Processing" },
  { key: "results", label: "Results" },
  { key: "report", label: "Report" },
];

export default function StepProgress({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="step-progress">
      {STEPS.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
          <div className={`step-item ${i < currentIndex ? "done" : i === currentIndex ? "active" : ""}`}>
            <span className="step-num">{i < currentIndex ? "✓" : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <span className="step-line" />}
        </div>
      ))}
    </div>
  );
}
