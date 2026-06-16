import { useState, useEffect } from "react";
import "./App.css";

const API = "";

function StatusBadge({ status }) {
  const ok = status === "healthy";
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 600,
      background: ok ? "#d1fae5" : "#fee2e2",
      color: ok ? "#065f46" : "#991b1b",
    }}>
      {ok ? "● Healthy" : "● Unhealthy"}
    </span>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "20px 24px",
      minWidth: "180px",
      flex: 1,
    }}>
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API}/api/health`);
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      setHealth({ status: "unhealthy", error: e.message });
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "0",
    }}>
      <div style={{
        background: "#0f172a",
        color: "white",
        padding: "18px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "18px" }}>OneClick GitOps</div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Kobie × PES Hackathon · v2</div>
          </div>
        </div>
        <span style={{
          background: "#1e3a5f",
          padding: "6px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#7dd3fc",
        }}>
          AWS EKS · ap-south-1
        </span>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            One-Click Environment Provisioner
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>
            Fully automated cloud infrastructure with GitOps, HPA, Cluster Autoscaler, and IRSA.
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "28px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>Backend / Database</div>
            {loading ? (
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>Checking...</span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <StatusBadge status={health?.status} />
                {health?.error && (
                  <span style={{ fontSize: "12px", color: "#dc2626" }}>{health.error}</span>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Auto-refreshes every 15s{lastChecked ? ` · Last: ${lastChecked}` : ""}
            </div>
            <button
              onClick={checkHealth}
              style={{
                marginTop: "6px",
                background: "#0f172a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "6px 16px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Refresh now
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <MetricCard label="Autoscaling" value="HPA + CA" sub="CPU-triggered, node-aware" />
          <MetricCard label="Auth Model" value="IRSA" sub="Zero stored credentials" />
          <MetricCard label="Delivery" value="FluxCD" sub="GitOps pull-based" />
          <MetricCard label="Observability" value="Prometheus" sub="Grafana dashboards live" />
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "28px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginTop: 0 }}>
            Pipeline → Cluster Flow
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {["Git Push","→","Jenkins CI","→","ECR Push","→","GitOps Repo","→","FluxCD","→","EKS"].map((step, i) => (
              <span key={i} style={{
                background: step === "→" ? "transparent" : "#f1f5f9",
                color: step === "→" ? "#94a3b8" : "#334155",
                padding: step === "→" ? "0 2px" : "6px 14px",
                borderRadius: "8px",
                fontSize: step === "→" ? "18px" : "13px",
                fontWeight: step === "→" ? 400 : 600,
              }}>
                {step}
              </span>
            ))}
          </div>
          <div style={{
            marginTop: "20px",
            padding: "14px 18px",
            background: "#f8fafc",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#475569",
            lineHeight: "1.6",
          }}>
            <strong>IRSA:</strong> Cluster Autoscaler and all AWS-facing pods use short-lived STS tokens via OIDC — no IAM keys stored anywhere.
            &nbsp;|&nbsp;
            <strong>HPA:</strong> Backend scales 2→6 pods at 70% CPU, Frontend 2→4 at 60%.
            &nbsp;|&nbsp;
            <strong>PDB:</strong> minAvailable: 1 on both deployments — zero downtime during node drain.
          </div>
        </div>
      </div>
    </div>
  );
}
