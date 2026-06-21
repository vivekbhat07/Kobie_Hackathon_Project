import { useState, useEffect, useCallback } from "react";
import {
  Zap, RefreshCw, LayoutDashboard, GitBranch, GitMerge,
  Sparkles, Server, Activity, AlertTriangle, Box, Cpu,
} from "lucide-react";
import "./App.css";
import { C, mono } from "./dashboard/theme";
import { MetricCard } from "./dashboard/ui";
import { PODS, ISSUES } from "./dashboard/data";
import OverviewTab from "./dashboard/OverviewTab";
import PipelineTab from "./dashboard/PipelineTab";
import GitOpsTab from "./dashboard/GitOpsTab";
import AITab from "./dashboard/AITab";
import InfraTab from "./dashboard/InfraTab";
import OpsTab from "./dashboard/OpsTab";

const API = "";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, Comp: OverviewTab },
  { key: "pipeline", label: "CI/CD Pipeline", icon: GitBranch, Comp: PipelineTab },
  { key: "gitops", label: "GitOps", icon: GitMerge, Comp: GitOpsTab },
  { key: "ai", label: "K8sGPT AI", icon: Sparkles, Comp: AITab },
  { key: "infra", label: "Infrastructure", icon: Server, Comp: InfraTab },
  { key: "ops", label: "Monitoring & Scaling", icon: Activity, Comp: OpsTab },
];

function parseMetrics(text) {
  const grab = (re) => {
    const m = text.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  const startTime = grab(/process_start_time_seconds\s+([0-9.e+]+)/);
  const heapUsed = grab(/nodejs_heap_size_used_bytes\s+([0-9.e+]+)/);
  let httpCount = 0;
  const re = /http_request_duration_seconds_count\{[^}]*\}\s+([0-9.e+]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) httpCount += parseFloat(m[1]);

  const uptimeSec = startTime ? Math.max(0, Date.now() / 1000 - startTime) : null;
  const fmtUptime = (s) => {
    if (s == null) return "—";
    const m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${Math.floor(s % 60)}s`;
  };

  return {
    uptime: fmtUptime(uptimeSec),
    heap: heapUsed ? `${(heapUsed / 1024 / 1024).toFixed(1)} MB` : "—",
    httpCount: httpCount || httpCount === 0 ? String(Math.round(httpCount)) : "—",
  };
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [tab, setTab] = useState("overview");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/health`);
      setHealth(await res.json());
    } catch (e) {
      setHealth({ status: "unhealthy", error: e.message });
    }
    try {
      const res = await fetch(`${API}/api/metrics`);
      const text = await res.text();
      setMetrics(parseMetrics(text));
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const triggerScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    refresh();
    const id = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) { clearInterval(id); setScanning(false); return 0; }
        return p + 2;
      });
    }, 40);
  };

  const activeTab = TABS.find((t) => t.key === tab);
  const ActiveComp = activeTab.Comp;

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:.8; } 100% { transform:scale(2.4); opacity:0; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .spinning { animation: spin 1.5s linear infinite; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #182A45; border-radius: 2px; }
        .tabbtn { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px; border:1px solid transparent;
          background:transparent; color:${C.muted}; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; white-space:nowrap; }
        .tabbtn.active { background:${C.card}; border-color:${C.border}; color:${C.text}; font-weight:600; }
      `}</style>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: C.surface, zIndex: 100, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#00B8D9,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>ONE-CLICK INFRA</div>
            <div style={{ color: C.muted, fontSize: 11 }}>AI-Powered GitOps Platform · AWS EKS ap-south-1</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: 20, fontSize: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: health?.status === "healthy" ? C.green : C.red }} />
            <span style={{ color: C.muted }}>backend</span>
            <span style={{ color: C.text, fontFamily: mono }}>{loading ? "checking…" : health?.status || "unknown"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#00B8D912", border: `1px solid #00B8D930`, padding: "5px 12px", borderRadius: 20, fontSize: 12 }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.accent }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${C.accent}`, animation: "pulseRing 2s ease-out infinite" }} />
            </div>
            <span style={{ color: C.accent, fontWeight: 600 }}>K8sGPT ACTIVE</span>
          </div>
          <button onClick={triggerScan} style={{ display: "flex", alignItems: "center", gap: 6, background: "#8B5CF614", border: `1px solid #8B5CF640`, color: C.purple, padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
            <RefreshCw size={12} className={scanning ? "spinning" : ""} />
            {scanning ? `Scanning ${Math.round(Math.min(scanProgress, 100))}%` : "Trigger Scan"}
          </button>
        </div>
      </header>

      <div style={{ padding: "20px 24px" }}>
        {scanning && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: C.accent, fontSize: 12, fontFamily: mono, flex: 1 }}>k8sgpt analyze --explain --backend localai</span>
            <div style={{ width: 180, background: C.border, borderRadius: 4, height: 4 }}>
              <div style={{ width: `${Math.min(scanProgress, 100)}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.purple})`, transition: "width 0.1s" }} />
            </div>
            <span style={{ color: C.muted, fontSize: 11, minWidth: 30 }}>{Math.round(Math.min(scanProgress, 100))}%</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          <MetricCard icon={<Server size={18} />} label="Cluster" value="EKS · 1+" sub="ap-south-1" color={C.green} />
          <MetricCard icon={<Box size={18} />} label="Pods" value={`${PODS.filter(p=>p.ok).length} / ${PODS.length}`} sub={`${PODS.filter(p=>!p.ok).length} in BackOff`} color={C.amber} />
          <MetricCard icon={<AlertTriangle size={18} />} label="K8sGPT Issues" value={String(ISSUES.filter(i=>i.status==="active").length)} sub={`${ISSUES.filter(i=>i.status==="resolved").length} auto-resolved`} color={C.red} />
          <MetricCard icon={<Cpu size={18} />} label="AI Model" value="llama3.2:1b" sub="Ollama · self-hosted" color={C.purple} />
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`tabbtn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <ActiveComp health={health} metrics={metrics} loading={loading} />

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", color: C.dim, fontSize: 11, flexWrap: "wrap", gap: 6 }}>
          <span>K8sGPT · Ollama · FluxCD · Prometheus/Grafana · Jenkins · Terraform/EKS</span>
          <span>{lastChecked ? `Last refreshed ${lastChecked}` : ""}</span>
        </div>
      </div>
    </div>
  );
}
