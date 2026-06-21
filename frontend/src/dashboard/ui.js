import { C, mono } from "./theme";

export function MetricCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.7 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
          <div style={{ color: C.muted, fontSize: 11 }}>{sub}</div>
        </div>
        <div style={{ color, opacity: 0.5 }}>{icon}</div>
      </div>
    </div>
  );
}

export function SectionCard({ title, icon, badge, badgeColor, children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", ...style }}>
      {(title || icon) && (
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          {badge && (
            <span style={{ background: `${badgeColor || C.accent}20`, color: badgeColor || C.accent, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

export function Pill({ children, color }) {
  return (
    <span style={{ background: `${color || C.muted}18`, color: color || C.muted, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, fontFamily: mono }}>
      {children}
    </span>
  );
}

export function CodeLine({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 11.5, color: "#9FD8E8", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", marginTop: 4, overflowX: "auto", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}
