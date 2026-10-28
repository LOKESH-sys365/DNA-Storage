import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";

const BASE_COLOR = {
  A: "text-emerald-400", C: "text-sky-400",
  G: "text-amber-400", T: "text-rose-400", N: "text-slate-500",
};

function DnaView({ seq }) {
  if (!seq) return null;
  return (
    <p className="font-mono text-break lh-lg mb-0" style={{ fontSize: "0.8rem" }}>
      {seq.split("").map((b, i) => (
        <span key={i} className={BASE_COLOR[b] || "text-secondary"}>{b}</span>
      ))}
      <span className="text-secondary"> …</span>
    </p>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="glass rounded-3 p-3 text-center">
      <div className={`fs-4 fw-bold ${accent || "text-white"}`}>{value}</div>
      <div className="text-secondary small">{label}</div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);

  useEffect(() => { api.get(`/dna/${id}`).then((r) => setRec(r.data)); }, [id]);

  if (!rec) return <div className="text-secondary">Loading…</div>;
  const s = rec.stats || {};
  const dmg = s.damage || {};
  const gcPct = Math.round((s.gcContent || 0) * 100);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold text-white mb-0">{rec.fileName}</h1>
          <small className="text-secondary">{new Date(rec.createdAt).toLocaleString()}</small>
        </div>
        {rec.recoveredPerfectly
          ? <span className="badge text-bg-success fs-6 px-3 py-2">✔ File recovered perfectly</span>
          : <span className="badge text-bg-danger fs-6 px-3 py-2">✖ Repair failed — raise redundancy or lower damage</span>}
      </div>

      {/* pipeline stepper */}
      <div className="row g-3 mb-4">
        {[
          ["1 · Encode", "RS + XOR → A/C/G/T", true],
          ["2 · Damage", `${s.totalDamageEvents ?? 0} damage events (${Math.round((s.damageRate || 0) * 100)}% of bases)`, true],
          ["3 · Repair", `${s.errorsFixed ?? 0} errors fixed by Reed-Solomon`, rec.recoveredPerfectly],
        ].map(([title, sub, ok]) => (
          <div className="col-md-4" key={title}>
            <div className={`glass rounded-3 p-3 h-100 border ${ok ? "border-success border-opacity-25" : "border-danger border-opacity-25"}`}>
              <div className="fw-semibold text-white">{title}</div>
              <small className="text-secondary">{sub}</small>
            </div>
          </div>
        ))}
      </div>

      {/* stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-2"><Stat label="Original size" value={`${rec.originalSize} B`} /></div>
        <div className="col-6 col-md-2"><Stat label="DNA strand" value={`${rec.dnaLength} nt`} /></div>
        <div className="col-6 col-md-2"><Stat label="Errors fixed" value={s.errorsFixed ?? 0} accent="text-info" /></div>
        <div className="col-6 col-md-2"><Stat label="Mutations" value={dmg.mutations ?? 0} accent="text-warning" /></div>
        <div className="col-6 col-md-2"><Stat label="Ins + Del" value={(dmg.insertions ?? 0) + (dmg.deletions ?? 0)} accent="text-warning" /></div>
        <div className="col-6 col-md-2"><Stat label="Bases lost" value={dmg.lostBases ?? 0} accent="text-danger" /></div>
      </div>

      {/* GC balance */}
      <div className="glass rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between mb-2">
          <span className="fw-semibold text-white">GC content (target ≈ 50%)</span>
          <span className={s.gcBalanced ? "text-success" : "text-danger"}>{gcPct}% {s.gcBalanced ? "· balanced ✔" : "· unbalanced ✖"}</span>
        </div>
        <div className="progress" style={{ height: 10 }}>
          <div className="progress-bar bg-info" style={{ width: `${gcPct}%` }} />
        </div>
        <small className="text-secondary">
          Longest homopolymer run after XOR scrambling: <b className="text-white">{s.longestHomopolymer ?? "-"}</b> bases
          (unscrambled data frequently contains runs like AAAAAA that DNA synthesis hates).
        </small>
      </div>

      {/* sequence previews */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="glass rounded-4 p-4 h-100">
            <h6 className="text-white fw-semibold">Encoded DNA (first 240 bases)</h6>
            <DnaView seq={rec.dnaPreview} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="glass rounded-4 p-4 h-100">
            <h6 className="text-white fw-semibold">Damaged DNA (grey N = lost chunk)</h6>
            <DnaView seq={rec.damagedPreview} />
          </div>
        </div>
      </div>
    </div>
  );
}
