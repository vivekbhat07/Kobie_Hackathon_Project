// Catalog of predefined alert templates.
//
// Each template knows how to build a Prometheus expression from a deployment
// name and a threshold, and carries the metadata needed to render a
// PrometheusRule manifest identical in shape to the files already in the repo.

const SEVERITIES = ['critical', 'warning', 'info'];

const TEMPLATES = {
  'high-cpu': {
    label: 'CPU High',
    group: 'high-cpu.rules',
    alert: 'HighCPUUsage',
    summary: 'High CPU Usage',
    forDuration: '2m',
    defaultSeverity: 'warning',
    usesThreshold: true,
    defaultThreshold: '80',
    thresholdHint: 'CPU usage percentage (e.g. 80)',
    buildExpr: (dep, t) =>
      `sum(rate(container_cpu_usage_seconds_total{pod=~"${dep}.*"}[5m])) * 100 > ${t}`,
    description: (dep, t) => `CPU usage is above ${t}% for ${dep}.`,
  },

  'high-memory': {
    label: 'Memory High',
    group: 'high-memory.rules',
    alert: 'HighMemoryUsage',
    summary: 'High Memory Usage',
    forDuration: '2m',
    defaultSeverity: 'warning',
    usesThreshold: true,
    defaultThreshold: '500000000',
    thresholdHint: 'Working-set bytes (e.g. 500000000 = ~500 MB)',
    buildExpr: (dep, t) =>
      `sum(container_memory_working_set_bytes{pod=~"${dep}.*"}) > ${t}`,
    description: (dep) => `Memory usage is high for ${dep}.`,
  },

  crashloop: {
    label: 'CrashLoop',
    group: 'crashloop.rules',
    alert: 'CrashLoopBackOff',
    summary: 'CrashLoopBackOff',
    forDuration: '1m',
    defaultSeverity: 'critical',
    usesThreshold: false,
    defaultThreshold: '0',
    thresholdHint: 'Number of crashing pods to alert above (default 0)',
    buildExpr: (dep, t) =>
      `kube_pod_container_status_waiting_reason{pod=~"${dep}.*",reason="CrashLoopBackOff"} > ${t}`,
    description: (dep) => `${dep} pod is crashing repeatedly.`,
  },

  'deployment-down': {
    label: 'Deployment Down (Backend / Frontend Down)',
    group: 'deployment-down.rules',
    alert: 'DeploymentDown',
    summary: 'Deployment Down',
    forDuration: '1m',
    defaultSeverity: 'critical',
    usesThreshold: true,
    defaultThreshold: '1',
    thresholdHint: 'Minimum available replicas (alerts when below this)',
    buildExpr: (dep, t) =>
      `kube_deployment_status_replicas_available{deployment="${dep}"} < ${t}`,
    description: (dep) => `Deployment ${dep} has no available replicas.`,
  },

  'frequent-restarts': {
    label: 'Frequent Restarts',
    group: 'restart.rules',
    alert: 'FrequentRestarts',
    summary: 'Frequent Restarts',
    forDuration: '1m',
    defaultSeverity: 'warning',
    usesThreshold: true,
    defaultThreshold: '3',
    thresholdHint: 'Restart count over 10m before alerting',
    buildExpr: (dep, t) =>
      `increase(kube_pod_container_status_restarts_total{pod=~"${dep}.*"}[10m]) > ${t}`,
    description: (dep) => `Pods of ${dep} restarted multiple times.`,
  },

  'image-pull-backoff': {
    label: 'Image Pull BackOff',
    group: 'imagepull.rules',
    alert: 'ImagePullBackOff',
    summary: 'Image Pull Failed',
    forDuration: '1m',
    defaultSeverity: 'critical',
    usesThreshold: false,
    defaultThreshold: '0',
    thresholdHint: 'Number of affected pods to alert above (default 0)',
    buildExpr: (dep, t) =>
      `kube_pod_container_status_waiting_reason{pod=~"${dep}.*",reason="ImagePullBackOff"} > ${t}`,
    description: (dep) => `${dep} cannot pull container image.`,
  },

  'pod-pending': {
    label: 'Pod Pending',
    group: 'pod-pending.rules',
    alert: 'PodPending',
    summary: 'Pod Pending',
    forDuration: '5m',
    defaultSeverity: 'warning',
    usesThreshold: false,
    defaultThreshold: '0',
    thresholdHint: 'Number of pending pods to alert above (default 0)',
    buildExpr: (dep, t) =>
      `kube_pod_status_phase{pod=~"${dep}.*",phase="Pending"} > ${t}`,
    description: (dep) => `Pod of ${dep} is stuck in Pending state.`,
  },

  'replica-mismatch': {
    label: 'Replica Mismatch',
    group: 'replica.rules',
    alert: 'ReplicaMismatch',
    summary: 'Replica Mismatch',
    forDuration: '2m',
    defaultSeverity: 'warning',
    usesThreshold: false,
    defaultThreshold: '',
    thresholdHint: 'Not used for this template',
    buildExpr: (dep) =>
      `kube_deployment_spec_replicas{deployment="${dep}"} != kube_deployment_status_replicas_available{deployment="${dep}"}`,
    description: (dep) => `${dep} replicas are not fully available.`,
  },
};

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    label: t.label,
    alert: t.alert,
    defaultSeverity: t.defaultSeverity,
    usesThreshold: t.usesThreshold,
    defaultThreshold: t.defaultThreshold,
    thresholdHint: t.thresholdHint,
  }));
}

export function getTemplate(id) {
  return TEMPLATES[id] || null;
}

export function isValidSeverity(severity) {
  return SEVERITIES.includes(String(severity).toLowerCase());
}

// Turn an alert name into a safe Kubernetes resource / file name.
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'alert';
}

// k8s deployment names: lowercase alphanumerics and dashes.
export function isValidDeploymentName(name) {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(String(name));
}

/**
 * Render a PrometheusRule manifest that matches the existing repo format.
 *
 * @param {Object} input
 * @param {string} input.templateId
 * @param {string} input.alertName       human-facing alert name
 * @param {string} input.metadataName    unique k8s metadata.name
 * @param {string} input.deploymentName
 * @param {string} input.severity
 * @param {string} [input.threshold]
 * @returns {string} YAML
 */
export function renderManifest({
  templateId,
  alertName,
  metadataName,
  deploymentName,
  severity,
  threshold,
}) {
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);

  const effectiveThreshold =
    tpl.usesThreshold && threshold !== undefined && threshold !== null && String(threshold).trim() !== ''
      ? String(threshold).trim()
      : tpl.defaultThreshold;

  const expr = tpl.buildExpr(deploymentName, effectiveThreshold);
  const description = tpl.description(deploymentName, effectiveThreshold);

  return `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ${metadataName}
  namespace: monitoring
  labels:
    release: prometheus

spec:
  groups:
  - name: ${tpl.group}
    rules:
    - alert: ${tpl.alert}
      expr: ${expr}
      for: ${tpl.forDuration}
      labels:
        severity: ${severity}
      annotations:
        summary: ${tpl.summary}
        description: ${description}
`;
}
