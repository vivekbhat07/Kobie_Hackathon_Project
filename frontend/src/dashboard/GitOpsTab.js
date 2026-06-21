import { GitMerge, Sparkles, Activity, Gauge, Container } from "lucide-react";
import { C, mono } from "./theme";
import { GITOPS_APPS } from "./data";
import { SectionCard } from "./ui";

const GROUPS = [
  { key: "core", label: "Core App", icon: Container, color: C.accent },
  { key: "observability", label: "Observability", icon: Activity, color: C.green },
  { key: "scaling", label: "Scaling", icon: Gauge, color: C.amber },
  { key: "ai", label: "AI / K8sGPT", icon: Sparkles, color: C.purple },
  { key: "cicd", label: "CI/CD", icon: GitMerge, color: C.muted },
];

export default function GitOpsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Flux Kustomizations" icon={<GitMerge size={15} color={C.accent} />}
        badge={`${GITOPS_APPS.length} apps · main@fca7c54e`} badgeColor={C.accent}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
          Everything below is declared once in <span style={{ fontFamily: mono, color: C.text }}>oneclick-gitops</span> and
          pulled into the cluster by Flux's source + kustomize controllers — no <span style={{ fontFamily: mono }}>kubectl apply</span> by hand.
        </div>
        {GROUPS.map((g) => {
          const apps = GITOPS_APPS.filter(a => a.group === g.key);
          const Icon = g.icon;
          return (
            <div key={g.key} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <Icon size={13} color={g.color} />
                <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.label}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {apps.map((a, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 12, color: C.text }}>{a.name}</div>
                      <div style={{ color: C.muted, fontSize: 10.5, marginTop: 2 }}>{a.desc}</div>
                    </div>
                    <span style={{ background: `${C.green}18`, color: C.green, fontSize: 9.5, padding: "2px 7px", borderRadius: 20, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>Ready</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}
