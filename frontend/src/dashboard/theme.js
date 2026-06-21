export const C = {
  bg: "#050B18",
  surface: "#0A1628",
  card: "#0E1E36",
  border: "#182A45",
  accent: "#00B8D9",
  purple: "#8B5CF6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  text: "#E2E8F0",
  muted: "#7B93B5",
  dim: "#2A3F5F",
};

export const sevColor = (s) => ({ critical: C.red, warning: C.amber, info: C.accent, resolved: C.green }[s] || C.muted);
export const sevBg = (s) => ({ critical: "#EF444412", warning: "#F59E0B12", info: "#00B8D912", resolved: "#10B98112" }[s] || "#7B93B512");

export const mono = "'JetBrains Mono', Menlo, Consolas, monospace";
export const sans = "'Inter', system-ui, sans-serif";
