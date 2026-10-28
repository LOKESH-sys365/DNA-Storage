import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api.js";

export default function LoginSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { navigate("/login"); return; }
    localStorage.setItem("token", token);
    api.get("/auth/me").then(() => navigate("/upload")).catch(() => navigate("/login"));
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
      <div className="text-center">
        <div className="spinner-border text-info mb-3" role="status" />
        <p>Signing you in&hellip;</p>
      </div>
    </div>
  );
}
