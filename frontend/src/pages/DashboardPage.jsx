import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function DashboardPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => { api.get("/dna").then((r) => setRecords(r.data)); }, []);

  return (
    <div>
      <h1 className="fw-bold text-white mb-4">Past Simulations</h1>
      {records.length === 0 && <p className="text-secondary">No simulations yet — run one!</p>}
      <div className="list-group">
        {records.map((r) => (
          <Link key={r.id} to={`/result/${r.id}`}
                className="list-group-item list-group-item-action glass text-white d-flex justify-content-between align-items-center mb-2 rounded-3">
            <div>
              <div className="fw-semibold">{r.fileName}</div>
              <small className="text-secondary">{r.originalSize} bytes &rarr; {r.dnaLength} bases &middot; {new Date(r.createdAt).toLocaleString()}</small>
            </div>
            {r.recoveredPerfectly
              ? <span className="badge text-bg-success">Perfectly recovered</span>
              : <span className="badge text-bg-danger">Repair failed</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
