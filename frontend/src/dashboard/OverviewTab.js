import { GitBranch, ArrowRight, Container, ShieldCheck, GitMerge, Server, Box } from "lucide-react";
import { C, mono } from "./theme";
import { PODS } from "./data";
import { SectionCard } from "./ui";

const FLOW = [
  { label: "Git Push", icon: <GitBranch size={14} /> },
  { label: "Jenkins CI", icon: <Container size={14} /> },
  { label: "Trivy Scan", icon: <ShieldCheck size={14} /> },
  { label: "ECR Push", icon: <Box size={14} /> },
  { label: "GitOps Repo", icon: <GitMerge size={14} /> },
  { label: "FluxCD", icon: <GitBranch size={14} /> },
  { label: "EKS Cluster", icon: <Server size={14} /> },
];

export default function OverviewTab({ health, metrics, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Delivery Pipeline" icon={<GitMerge size={15} color={C.purple} />}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {FLOW.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, padding: "7px 12px", borderRadius: 8, fontSize: 12, color: C.text }}>
                <span style={{ color: C.accent }}>{s.icon}</span>
                {s.label}
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={13} color={C.dim} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
          Every push to <span style={{ color: C.accent, fontFamily: mono }}>main</span> rebuilds both images, gates on a
          Trivy CRITICAL-severity scan, pushes to ECR, bumps the tag in the GitOps repo, and Flux reconciles it onto
          EKS — then Jenkins polls the HelmRelease until it's confirmed <span style={{ color: C.green }}>Ready</span>.
        </div>
      </SectionCard>

      <SectionCard title="Live Backend Telemetry" icon={<Server size={15} color={C.green} />}
        badge={loading ? "checking…" : health?.status === "healthy" ? "healthy" : "unhealthy"}
        badgeColor={health?.status === "healthy" ? C.green : C.red}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { l: "DB Connection", v: health?.status === "healthy" ? "OK" : (health ? "FAIL" : "—") },
            { l: "Uptime", v: metrics?.uptime ?? "—" },
            { l: "Heap Used", v: metrics?.heap ?? "—" },
            { l: "HTTP Requests", v: metrics?.httpCount ?? "—" },
          ].map((m, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{m.l}</div>
              <div style={{ fontFamily: mono, fontSize: 14, color: C.accent }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, color: C.dim, fontSize: 10.5 }}>
          Pulled live from <span style={{ fontFamily: mono }}>/api/health</span> + <span style={{ fontFamily: mono }}>/api/metrics</span> (Prometheus client on the backend) — refreshes every 15s.
        </div>
      </SectionCard>

      <SectionCard title="Pod Status" icon={<Box size={15} color={C.muted} />}
        badge={`${PODS.filter(p => p.ok).length} running · ${PODS.filter(p => !p.ok).length} failed`}
        badgeColor={C.muted}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {PODS.map((pod, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${pod.ok ? C.border : C.red + "45"}`, padding: "5px 10px", borderRadius: 8, fontSize: 11 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: pod.ok ? C.green : C.red }} />
              <span style={{ fontFamily: mono, color: pod.ok ? C.text : C.red }}>{pod.name}</span>
              <span style={{ color: C.dim, fontSize: 10 }}>{pod.ns}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
