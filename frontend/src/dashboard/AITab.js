import { useState } from "react";
import { Shield, Zap, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { C, mono, sevColor } from "./theme";
import { ISSUES, PIE_DATA } from "./data";
import { SectionCard, Pill } from "./ui";

export default function AITab() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, alignItems: "start" }}>
      <SectionCard title="K8sGPT AI Diagnostics" icon={<Shield size={15} color={C.accent} />}
        badge={`${ISSUES.filter(i => i.status === "active").length} active`} badgeColor={C.red}>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 10, fontFamily: mono }}>
          backend: localai · model: llama3.2:1b · ns: k8sgpt-operator-system
        </div>
        {ISSUES.map((issue) => (
          <div key={issue.id} style={{ borderTop: `1px solid ${C.border}40` }}>
            <div
              onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
              style={{ padding: "12px 4px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: sevColor(issue.sev), flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: mono }}>{issue.name}</span>
                  <Pill color={C.muted}>{issue.ns}</Pill>
                  <Pill color={sevColor(issue.sev)}>{issue.sev}</Pill>
                  <Pill color={C.muted}>{issue.kind}</Pill>
                </div>
                <div style={{ color: C.muted, fontSize: 12 }}>{issue.error}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ color: C.dim, fontSize: 10, fontFamily: mono }}>{issue.time}</span>
                {expanded === issue.id ? <ChevronUp size={13} color={C.muted} /> : <ChevronDown size={13} color={C.muted} />}
              </div>
            </div>
            {expanded === issue.id && (
              <div style={{ padding: "0 4px 14px 24px", background: C.surface, borderRadius: 8 }}>
                <div style={{ borderLeft: `2px solid ${C.accent}35`, paddingLeft: 14, paddingTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Zap size={12} color={C.accent} />
                    <span style={{ color: C.accent, fontSize: 11, fontWeight: 600 }}>AI SOLUTION · ollama/llama3.2</span>
                  </div>
                  {issue.solution.map((step, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 12, lineHeight: 1.5, color: "#B2C4D8" }}>
                      <span style={{ color: C.accent, fontWeight: 700, fontFamily: mono, fontSize: 11 }}>{j + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="AI Engine" icon={<Cpu size={15} color={C.purple} />}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14, textAlign: "center" }}>
          <Cpu size={26} color={C.accent} style={{ marginBottom: 8 }} />
          <div style={{ color: C.accent, fontWeight: 600, fontSize: 13 }}>Ollama · llama3.2:1b</div>
          <div style={{ color: C.muted, fontSize: 10.5, marginTop: 2 }}>Self-hosted, in-cluster · jenkins ns</div>
        </div>
        <div style={{ height: 110, marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((e, i) => <Cell key={i} fill={e.fill} opacity={0.85} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
          {PIE_DATA.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.fill }} />
              <span style={{ color: C.muted }}>{d.name}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
