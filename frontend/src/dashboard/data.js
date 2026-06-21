// All of this reflects the actual manifests in one-click-infra/ and oneclick-gitops/.
// Pod/issue lists are illustrative of real K8sGPT scan output shapes — kept current
// with the manifests so the story you tell on stage matches what's on screen.

export const PODS = [
  { name: "backend-7f9c", ns: "default", ok: true },
  { name: "backend-7f9c-2", ns: "default", ok: true },
  { name: "frontend-d8a1", ns: "default", ok: true },
  { name: "frontend-d8a1-2", ns: "default", ok: true },
  { name: "broken-pod", ns: "default", ok: false },
  { name: "k8sgpt-operator-controller", ns: "k8sgpt-operator-system", ok: true },
  { name: "k8sgpt-ollama-0", ns: "k8sgpt-operator-system", ok: true },
  { name: "ollama-0", ns: "jenkins", ok: true },
  { name: "jenkins-0", ns: "jenkins", ok: true },
  { name: "prometheus-server", ns: "monitoring", ok: true },
  { name: "grafana", ns: "monitoring", ok: true },
  { name: "alertmanager-0", ns: "monitoring", ok: true },
  { name: "flux-helm-controller", ns: "flux-system", ok: true },
  { name: "flux-source-controller", ns: "flux-system", ok: true },
  { name: "flux-kustomize-controller", ns: "flux-system", ok: true },
  { name: "ingress-nginx-controller", ns: "ingress-nginx", ok: true },
  { name: "external-secrets", ns: "external-secrets", ok: true },
  { name: "cluster-autoscaler", ns: "kube-system", ok: true },
  { name: "ebs-csi-controller", ns: "kube-system", ok: true },
  { name: "coredns", ns: "kube-system", ok: true },
];

export const ISSUES = [
  {
    id: 1, name: "broken-pod", ns: "default", kind: "Pod", sev: "critical",
    error: 'Back-off pulling image "nonexistent-image-xyz123": ErrImagePull — registry pull access denied',
    solution: [
      "Confirm the image reference actually exists in the registry (ECR or Docker Hub)",
      "Check the pod's imagePullSecrets against the ECR repository policy",
      "Fix the image tag in the pod spec, then re-apply",
      "kubectl set image pod/broken-pod <container>=<valid-image>",
    ],
    time: "live", status: "active",
  },
  {
    id: 2, name: "oneclick-ingress", ns: "default", kind: "Ingress", sev: "resolved",
    error: "Ingress referenced ingress class 'nginx' before the controller existed in-cluster",
    solution: [
      "K8sGPT flagged the missing ingress class on first scan",
      "Fix shipped via GitOps: apps/ingress-nginx HelmRelease reconciled by Flux",
      "Re-scan confirmed class 'nginx' now resolves — issue auto-closed",
    ],
    time: "auto-healed", status: "resolved",
  },
  {
    id: 3, name: "backend-hpa", ns: "default", kind: "HorizontalPodAutoscaler", sev: "warning",
    error: "unable to get metrics for resource cpu: did not receive metrics for any ready pods",
    solution: [
      "Common during cold start — metrics-server needs ~60s after first reconcile",
      "Flux Kustomization 'metrics-server' resolved it on the next interval",
      "Verify: kubectl get hpa backend-hpa -n default",
    ],
    time: "auto-healed", status: "resolved",
  },
  {
    id: 4, name: "ollama-0", ns: "jenkins", kind: "Pod", sev: "warning",
    error: "Memory usage at 92% of 3Gi limit while pulling llama3.2:1b — risk of OOMKill",
    solution: [
      "Model pull is the spike; steady-state usage settles under 1.5Gi",
      "Consider bumping the limit if you swap to a larger model later",
      "kubectl top pod ollama-0 -n jenkins to confirm it has settled",
    ],
    time: "07:41:12", status: "active",
  },
  {
    id: 5, name: "frontend-pdb", ns: "default", kind: "PodDisruptionBudget", sev: "info",
    error: "minAvailable=1 with only 2 replicas — a single node drain leaves zero slack",
    solution: [
      "Acceptable for a hackathon-scale deployment",
      "For production, raise frontend-hpa minReplicas to 3 for headroom",
      "PDB still guarantees zero-downtime during planned node drains",
    ],
    time: "advisory", status: "active",
  },
];

export const PIPELINE_STAGES = [
  { label: "Checkout", detail: "git rev-parse --short HEAD → IMAGE_TAG = <sha>-<build#>", icon: "git" },
  { label: "Test (parallel)", detail: "backend: npm test · frontend: static check", icon: "check" },
  { label: "Build Images (parallel)", detail: "docker build backend & frontend → ECR repo URIs", icon: "box" },
  { label: "Scan Images — Trivy", detail: "--exit-code 1 --severity CRITICAL — pipeline fails closed", icon: "shield" },
  { label: "Push to ECR", detail: "aws ecr get-login-password → docker push (both images)", icon: "upload" },
  { label: "Update GitOps Repo", detail: "sed tag bump in helmrelease.yaml + values.yaml → git push", icon: "git" },
  { label: "Verify Reconciliation", detail: "poll HelmRelease 'oneclick' Ready, 300s timeout / 15s interval", icon: "check" },
];

export const DRIFT_JOB = {
  schedule: "0 2 * * *  (nightly, 2 AM)",
  steps: [
    "terraform init -reconfigure against the live EKS/RDS/VPC state",
    "Detects + auto force-unlocks stale state locks before planning",
    "terraform plan -detailed-exitcode — exit 2 means a diff exists",
    "Filters out expected noise (RDS password, apply_immediately) before flagging real drift",
    "Archives drift-report.txt as a build artifact either way",
  ],
};

export const GITOPS_APPS = [
  { name: "oneclick", desc: "backend + frontend HelmRelease — the app itself", group: "core" },
  { name: "ingress-nginx", desc: "Ingress controller — routes /api → backend, / → frontend", group: "core" },
  { name: "external-secrets", desc: "ExternalSecrets operator", group: "core" },
  { name: "external-secrets-config", desc: "ClusterSecretStore + DB external secret", group: "core" },
  { name: "monitoring", desc: "kube-prometheus-stack (Prometheus, Grafana, Alertmanager)", group: "observability" },
  { name: "monitoring-config", desc: "Backend ServiceMonitor scrape config", group: "observability" },
  { name: "alerting", desc: "PrometheusRules — CPU, memory, crashloop, frontend/backend down", group: "observability" },
  { name: "metrics-server", desc: "Cluster metrics API — backs HPA decisions", group: "scaling" },
  { name: "autoscaling", desc: "HPA + PodDisruptionBudgets for backend/frontend", group: "scaling" },
  { name: "cluster-autoscaler", desc: "Node-level autoscaling via IRSA", group: "scaling" },
  { name: "k8sgpt-operator", desc: "K8sGPT operator install", group: "ai" },
  { name: "k8sgpt-config", desc: "K8sGPT CR — localai backend, llama3.2:1b", group: "ai" },
  { name: "ollama", desc: "Self-hosted LLM serving K8sGPT diagnoses", group: "ai" },
  { name: "jenkins", desc: "Jenkins controller + ingress", group: "cicd" },
  { name: "jenkins-rbac", desc: "ClusterRole for the Jenkins build agent", group: "cicd" },
  { name: "jenkins-secret", desc: "GitHub + admin + DB secrets for Jenkins", group: "cicd" },
];

export const TF_RESOURCES = [
  { name: "VPC", detail: "2 public + 2 private subnets, IGW, route tables", icon: "network" },
  { name: "EKS Cluster", detail: "API_AND_CONFIG_MAP auth · EBS CSI addon via IRSA/OIDC", icon: "server" },
  { name: "RDS PostgreSQL", detail: "gp3 · 20GB · private subnets only · publicly_accessible=false", icon: "database" },
  { name: "ECR", detail: "frontend + backend repos · IMMUTABLE tags · scan_on_push", icon: "box" },
  { name: "IAM / IRSA", detail: "OIDC-federated roles — zero long-lived AWS keys in any pod", icon: "shield" },
  { name: "Secrets", detail: "DB + Jenkins + GitHub creds via Terraform-managed secrets", icon: "key" },
];

export const ALERT_RULES = [
  { name: "HighCPUUsage", expr: "node CPU > 80% for 5m", sev: "warning" },
  { name: "HighMemoryUsage", expr: "node memory > 80%", sev: "warning" },
  { name: "CrashLoopBackOff", expr: "any pod container waiting on CrashLoopBackOff", sev: "warning" },
  { name: "FrontendPodDown", expr: "frontend available replicas < 1", sev: "critical" },
  { name: "BackendPodDown", expr: "backend available replicas < 1", sev: "critical" },
];

export const HPA_CONFIGS = [
  { name: "backend-hpa", target: "backend deployment", min: 2, max: 6, metric: "CPU @ 70%" },
  { name: "frontend-hpa", target: "frontend deployment", min: 2, max: 4, metric: "CPU @ 60%" },
];

export const PDB_CONFIGS = [
  { name: "backend-pdb", target: "app=backend", minAvailable: 1 },
  { name: "frontend-pdb", target: "app=frontend", minAvailable: 1 },
];

export const PIE_DATA = [
  { name: "Active", value: ISSUES.filter(i => i.status === "active").length, fill: "#EF4444" },
  { name: "Resolved", value: ISSUES.filter(i => i.status === "resolved").length, fill: "#10B981" },
];
