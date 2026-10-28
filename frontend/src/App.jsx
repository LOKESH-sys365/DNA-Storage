import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import LoginSuccess from "./pages/LoginSuccess.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";

function RequireAuth({ children }) {
  const location = useLocation();
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function Shell({ children }) {
  return (
    <div className="min-vh-100 dna-bg">
      <nav className="glass sticky-top d-flex justify-content-between align-items-center px-4 py-3">
        <a href="/upload" className="text-decoration-none d-flex align-items-center gap-2">
          <span className="fs-5 fw-bold text-white">
            DNA<span className="text-info">rchive</span>
          </span>
        </a>
        <div className="d-flex gap-3 align-items-center">
          <a href="/upload" className="text-secondary text-decoration-none hover-white">New Simulation</a>
          <a href="/dashboard" className="text-secondary text-decoration-none hover-white">Dashboard</a>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="container py-5">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/success" element={<LoginSuccess />} />
      <Route path="/upload" element={<RequireAuth><Shell><UploadPage /></Shell></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><Shell><DashboardPage /></Shell></RequireAuth>} />
      <Route path="/result/:id" element={<RequireAuth><Shell><ResultPage /></Shell></RequireAuth>} />
      <Route path="*" element={<Navigate to="/upload" replace />} />
    </Routes>
  );
}
