import { Activity, Bell, Gauge, ShieldHalf } from "lucide-react";
import { C, mono } from "./theme";
import { ALERT_RULES, HPA_CONFIGS, PDB_CONFIGS } from "./data";
import { SectionCard, Pill } from "./ui";

export default function OpsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Monitoring Stack" icon={<Activity size={15} color={C.green} />}
        badge="kube-prometheus-stack" badgeColor={C.green}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          Prometheus + Grafana + Alertmanager, installed as a single Flux HelmRelease in the <span style={{ fontFamily: mono, color: C.text }}>monitoring</span> namespace.
          The backend exposes a <span style={{ fontFamily: mono, color: C.text }}>/metrics</span> endpoint, scraped via a dedicated ServiceMonitor.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <Bell size={13} color={C.amber} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>Alert Rules</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ALERT_RULES.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
              <div>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.text }}>{a.name}</span>
                <span style={{ color: C.muted, fontSize: 11, marginLeft: 10 }}>{a.expr}</span>
              </div>
              <Pill color={a.sev === "critical" ? C.red : C.amber}>{a.sev}</Pill>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Autoscaling &amp; Resilience" icon={<Gauge size={15} color={C.purple} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8 }}>Horizontal Pod Autoscalers</div>
            {HPA_CONFIGS.map((h, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                <div style={{ fontFamily: mono, fontSize: 12, color: C.text }}>{h.name}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{h.min} → {h.max} replicas · {h.metric}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 8 }}>
              <ShieldHalf size={13} /> Pod Disruption Budgets
            </div>
            {PDB_CONFIGS.map((p, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                <div style={{ fontFamily: mono, fontSize: 12, color: C.text }}>{p.name}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>minAvailable: {p.minAvailable} · selector {p.target}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
