import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [seed, setSeed] = useState(42);
  const [mutRate, setMutRate] = useState(0.02);
  const [indelRate, setIndelRate] = useState(0.005);
  const [chunkLosses, setChunkLosses] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!file) { setError("Choose a file first (e.g. hi.txt)"); return; }
    setBusy(true); setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("seed", seed);
    form.append("mutRate", mutRate);
    form.append("indelRate", indelRate);
    form.append("chunkLosses", chunkLosses);
    try {
      const res = await api.post("/dna/upload", form);
      navigate(`/result/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <h1 className="fw-bold text-white mb-1">New DNA Storage Simulation</h1>
        <p className="text-secondary">
          Upload a file &rarr; Reed-Solomon adds backup data &rarr; XOR scramble fixes GC/runs &rarr; mapped to A/C/G/T &rarr; simulated damage &rarr; repaired on decode.
        </p>

        <form onSubmit={submit} className="glass rounded-4 p-4 mt-4">
          <label
            className="d-block rounded-4 border border-dashed border-secondary text-center py-5 cursor-pointer"
            style={{ borderStyle: "dashed", cursor: "pointer" }}
          >
            <input type="file" className="d-none" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <span className="text-info fw-semibold">{file.name} ({file.size} bytes)</span>
            ) : (
              <span className="text-secondary">Drop your file here or click to browse</span>
            )}
          </label>

          <div className="row g-4 mt-2">
            <div className="col-md-6">
              <label className="form-label text-secondary small">Damage seed: <b className="text-white">{seed}</b></label>
              <input type="range" className="form-range" min="1" max="999" value={seed}
                     onChange={(e) => setSeed(+e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label text-secondary small">Mutation rate: <b className="text-white">{(mutRate * 100).toFixed(1)}%</b></label>
              <input type="range" className="form-range" min="0" max="0.1" step="0.005" value={mutRate}
                     onChange={(e) => setMutRate(+e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label text-secondary small">Insertion/deletion rate: <b className="text-white">{(indelRate * 100).toFixed(1)}%</b></label>
              <input type="range" className="form-range" min="0" max="0.05" step="0.001" value={indelRate}
                     onChange={(e) => setIndelRate(+e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label text-secondary small">Lost strand chunks: <b className="text-white">{chunkLosses}</b></label>
              <input type="range" className="form-range" min="0" max="5" value={chunkLosses}
                     onChange={(e) => setChunkLosses(+e.target.value)} />
            </div>
          </div>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

          <button className="btn btn-info btn-lg w-100 mt-4 fw-semibold" disabled={busy}>
            {busy ? "Encoding, damaging & repairing…" : "🧬 Run Simulation"}
          </button>
        </form>
      </div>
    </div>
  );
}
