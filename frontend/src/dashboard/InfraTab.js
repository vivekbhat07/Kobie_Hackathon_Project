import { Network, Server, Database, Box, Shield, Key } from "lucide-react";
import { C, mono } from "./theme";
import { TF_RESOURCES } from "./data";
import { SectionCard } from "./ui";

const ICONS = { network: Network, server: Server, database: Database, box: Box, shield: Shield, key: Key };

export default function InfraTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Terraform — AWS Infrastructure" icon={<Server size={15} color={C.accent} />}
        badge="ap-south-1" badgeColor={C.accent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {TF_RESOURCES.map((r, i) => {
            const Icon = ICONS[r.icon] || Box;
            return (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                <Icon size={16} color={C.accent} style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{r.name}</div>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{r.detail}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 11.5, color: "#B2C4D8", lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>IRSA everywhere:</strong> the EBS CSI driver and Cluster Autoscaler assume roles
          via the EKS OIDC provider — <span style={{ fontFamily: mono }}>sts:AssumeRoleWithWebIdentity</span>, scoped to a single
          service account, no static AWS keys stored in any pod or secret.
        </div>
      </SectionCard>
    </div>
  );
}
