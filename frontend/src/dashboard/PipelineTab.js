import { GitBranch, CheckCircle2, Box, ShieldCheck, UploadCloud, Clock } from "lucide-react";
import { C, mono } from "./theme";
import { PIPELINE_STAGES, DRIFT_JOB } from "./data";
import { SectionCard, CodeLine } from "./ui";

const ICONS = { git: GitBranch, check: CheckCircle2, box: Box, shield: ShieldCheck, upload: UploadCloud };

export default function PipelineTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Jenkinsfile — Build &amp; Deploy" icon={<GitBranch size={15} color={C.accent} />}
        badge="7 stages" badgeColor={C.accent}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {PIPELINE_STAGES.map((s, i) => {
            const Icon = ICONS[s.icon] || Box;
            return (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={13} color={C.accent} />
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 18, background: `${C.accent}25` }} />}
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                  <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2, lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Nightly Drift Detection" icon={<Clock size={15} color={C.purple} />}
        badge={DRIFT_JOB.schedule} badgeColor={C.purple}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>
          A second pipeline (<span style={{ fontFamily: mono, color: C.text }}>Jenkinsfile.drift</span>) runs every night against the live Terraform state:
        </div>
        {DRIFT_JOB.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#B2C4D8" }}>
            <span style={{ color: C.purple, fontWeight: 700, fontFamily: mono, fontSize: 11 }}>{i + 1}.</span>
            <span>{step}</span>
          </div>
        ))}
        <CodeLine>terraform plan -detailed-exitcode -out=drift.tfplan</CodeLine>
      </SectionCard>
    </div>
  );
}
