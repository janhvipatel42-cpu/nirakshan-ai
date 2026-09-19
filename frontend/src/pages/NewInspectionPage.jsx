import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StepProgress from "../components/StepProgress.jsx";
import { api } from "../api/client.js";
import { useInspection } from "../context/InspectionContext.jsx";

const SLOTS = [
  { key: "front", label: "Front Image", required: true },
  { key: "back", label: "Back Image", required: false },
  { key: "side", label: "Side Image", required: false },
  { key: "additional", label: "Additional Image", required: false },
];

const DEMO_SAMPLES = [
  { key: "compliant", label: "Compliant Sample", desc: "All required declarations present", dot: "var(--pass)" },
  { key: "non_compliant", label: "Non-Compliant Sample", desc: "Missing manufacturer details", dot: "var(--fail)" },
  { key: "needs_review", label: "Needs Review Sample", desc: "Low-confidence net quantity", dot: "var(--review)" },
];

export default function NewInspectionPage() {
  const [form, setForm] = useState({ product_category: "", product_name: "", brand: "", other_details: "", is_imported: false });
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState("");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const { setInspection } = useInspection();
  const fileInputs = useRef({});

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(slotKey, file) {
    if (!file) return;
    setFiles((f) => ({ ...f, [slotKey]: file }));
    setPreviews((p) => ({ ...p, [slotKey]: URL.createObjectURL(file) }));
  }

  function removeFile(slotKey) {
    setFiles((f) => { const copy = { ...f }; delete copy[slotKey]; return copy; });
    setPreviews((p) => { const copy = { ...p }; delete copy[slotKey]; return copy; });
  }

  async function openCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch (_) { setError("Camera access is unavailable. Check browser permissions or upload an image instead."); }
  }

  function closeCamera() { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraOpen(false); }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) handleFile("front", new File([blob], "camera-capture.jpg", { type: "image/jpeg" })); closeCamera(); }, "image/jpeg", .92);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");
    if (!form.product_category || !form.product_name || !form.brand) {
      setError("Please fill in product category, name and brand.");
      return;
    }
    if (!files.front) {
      setError("At least the front image is required.");
      return;
    }
    setLoading(true);
    try {
      const created = await api.createInspection(form);
      const formData = new FormData();
      Object.entries(files).forEach(([type, file]) => formData.append(type, file));
      await api.uploadImages(created.id, formData);
      await api.analyzeInspection(created.id);
      const full = await api.getInspection(created.id);
      setInspection(full);
      navigate(`/inspections/${created.id}/processing`);
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing the product.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDemo(key) {
    setDemoLoading(key);
    setError("");
    try {
      const insp = await api.getDemoInspection(key);
      setInspection(insp);
      navigate(`/inspections/${insp.id}/processing`);
    } catch (err) {
      setError(err.message || "Could not load demo sample.");
    } finally {
      setDemoLoading("");
    }
  }

  return (
    <Layout title="New Inspection" subtitle="Enter product details and upload package images">
      <StepProgress current="details" />

      <div className="card card-pad" style={{ marginBottom: 18, background: "var(--brand-tint)", border: "1px solid var(--brand)" }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: "var(--brand-deep)" }}>
          Presentation shortcut — load a ready-made sample
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {DEMO_SAMPLES.map((d) => (
            <button
              key={d.key}
              type="button"
              className="btn btn-secondary"
              disabled={demoLoading !== ""}
              onClick={() => handleLoadDemo(d.key)}
              style={{ background: "var(--surface)" }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 4, background: d.dot }} />
              {demoLoading === d.key ? "Loading…" : d.label}
            </button>
          ))}
        </div>
        <p className="text-soft" style={{ fontSize: 12, marginTop: 10 }}>
          Loads Prototype Sample Data end-to-end — useful for a fast walkthrough without a real package photo.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="inspection-form">
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="form-heading"><div><div className="eyebrow">01 / PRODUCT PROFILE</div><h2>Tell us what we're inspecting.</h2></div><span className="form-step-note">Required fields marked *</span></div>
          <div className="form-row">
            <div className="field">
              <label>Product Category *</label>
              <input type="text" placeholder="e.g. Edible Oil, Biscuits & Snacks" value={form.product_category}
                onChange={(e) => updateField("product_category", e.target.value)} />
            </div>
            <div className="field">
              <label>Product Name *</label>
              <input type="text" placeholder="e.g. Sunflower Cooking Oil" value={form.product_name}
                onChange={(e) => updateField("product_name", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Brand *</label>
              <input type="text" placeholder="e.g. GreenValley Kitchen" value={form.brand}
                onChange={(e) => updateField("brand", e.target.value)} />
            </div>
            <div className="field">
              <label>Is this an imported product?</label>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <label className="checkbox-row">
                  <input type="radio" checked={!form.is_imported} onChange={() => updateField("is_imported", false)} /> Domestic
                </label>
                <label className="checkbox-row">
                  <input type="radio" checked={form.is_imported} onChange={() => updateField("is_imported", true)} /> Imported
                </label>
              </div>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Optional Product Details</label>
            <textarea placeholder="Batch reference, sampling location, additional notes…" value={form.other_details}
              onChange={(e) => updateField("other_details", e.target.value)} />
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="form-heading"><div><div className="eyebrow">02 / VISUAL EVIDENCE</div><h2>Upload the package label.</h2><p className="text-soft">A clear front image is required. Add more angles for a stronger result.</p></div><span className="upload-count">{Object.keys(previews).length}/4 added</span></div>
          <div className="upload-grid">
            {SLOTS.map((slot) => (
              <div key={slot.key} className={`upload-slot${previews[slot.key] ? " filled" : ""}`}>
                {previews[slot.key] ? (
                  <>
                    <img src={previews[slot.key]} alt={slot.label} />
                    <button type="button" className="upload-slot-remove" onClick={() => removeFile(slot.key)}>×</button>
                  </>
                ) : (
                  <>
                    <span className="upload-slot-label">{slot.label}{slot.required ? " *" : ""}</span>
                    <span className="text-faint" style={{ fontSize: 11, zIndex: 1 }}>Tap to upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFile(slot.key, e.target.files[0])} />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="camera-cta"><div><strong>Have the product with you?</strong><span>Use your device camera to capture the front label.</span></div><button type="button" className="btn btn-secondary" onClick={openCamera}>◎ Open camera</button></div>
        </div>

        {error && <p style={{ color: "var(--fail)", marginBottom: 14 }}>{error}</p>}

        <button className="btn btn-primary btn-lg analyze-btn" disabled={loading}>
          {loading ? <><span className="spinner" /> Analyzing…</> : "Analyze Product"}
        </button>
      </form>
      {cameraOpen && <div className="camera-modal"><div className="camera-panel"><div className="camera-panel-head"><div><div className="eyebrow">LIVE CAPTURE</div><h2>Frame the front label.</h2></div><button className="camera-close" type="button" onClick={closeCamera}>×</button></div><div className="camera-view"><video ref={videoRef} autoPlay playsInline /><div className="camera-frame" /></div><div className="camera-controls"><button className="btn btn-secondary" type="button" onClick={closeCamera}>Cancel</button><button className="capture-button" type="button" onClick={capturePhoto}><span /></button><span className="camera-hint">Center the label inside the frame</span></div></div></div>}
    </Layout>
  );
}
