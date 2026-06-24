import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import Toast from '../components/Toast.jsx';

const SEVERITIES = ['critical', 'warning', 'info'];

export default function CreateAlert() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    alertName: '',
    deploymentName: '',
    templateId: '',
    threshold: '',
    severity: 'warning',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api
      .get('/alerts/templates')
      .then(({ data }) => {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          const first = data.templates[0];
          setForm((f) => ({
            ...f,
            templateId: first.id,
            severity: first.defaultSeverity,
            threshold: first.usesThreshold ? first.defaultThreshold : '',
          }));
        }
      })
      .catch((err) =>
        setToast({ type: 'error', message: apiError(err, 'Could not load templates.') })
      );
  }, []);

  const selected = useMemo(
    () => templates.find((t) => t.id === form.templateId),
    [templates, form.templateId]
  );

  const onTemplateChange = (id) => {
    const tpl = templates.find((t) => t.id === id);
    setForm((f) => ({
      ...f,
      templateId: id,
      severity: tpl?.defaultSeverity || f.severity,
      threshold: tpl?.usesThreshold ? tpl.defaultThreshold : '',
    }));
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.alertName.trim()) {
      setToast({ type: 'error', message: 'Alert name is required.' });
      return;
    }
    if (!form.deploymentName.trim()) {
      setToast({ type: 'error', message: 'Deployment name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/alerts', {
        alertName: form.alertName.trim(),
        deploymentName: form.deploymentName.trim(),
        templateId: form.templateId,
        threshold: selected?.usesThreshold ? form.threshold : '',
        severity: form.severity,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: apiError(err, 'Could not create the alert.') });
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-mut hover:text-fg transition"
        >
          ← Back to dashboard
        </button>

        <div className="mt-3">
          <p className="font-mono text-xs uppercase tracking-widest text-beacon mb-1">New alert</p>
          <h1 className="font-display text-2xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create alert
          </h1>
          <p className="mt-1 text-sm text-mut">
            Pick a template and fill in the details. We'll generate the PrometheusRule YAML and commit
            it to the GitOps repo.
          </p>
        </div>

        <div className="card mt-6 p-6 shadow-xl shadow-black/30">
          {/* Coral accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-beacon to-transparent rounded-full mb-6 -mx-6 px-6" />

          <div className="space-y-5">
            <div>
              <label htmlFor="template" className="field-label">
                Alert template
              </label>
              <select
                id="template"
                value={form.templateId}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="field-input"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alertName" className="field-label">
                Alert name
              </label>
              <input
                id="alertName"
                value={form.alertName}
                onChange={update('alertName')}
                placeholder="payments-api-high-cpu"
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="deploymentName" className="field-label">
                Deployment name
              </label>
              <input
                id="deploymentName"
                value={form.deploymentName}
                onChange={update('deploymentName')}
                placeholder="payments-api"
                className="field-input font-mono"
              />
              <p className="mt-1.5 text-xs text-mut">
                Lowercase letters, numbers and dashes — matches your Kubernetes deployment.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="threshold" className="field-label">
                  Threshold
                </label>
                <input
                  id="threshold"
                  value={form.threshold}
                  onChange={update('threshold')}
                  disabled={!selected?.usesThreshold}
                  placeholder={selected?.usesThreshold ? selected.defaultThreshold : 'n/a'}
                  className="field-input font-mono disabled:opacity-40"
                />
                <p className="mt-1.5 text-xs text-mut">
                  {selected?.usesThreshold
                    ? selected.thresholdHint
                    : 'This template has no configurable threshold.'}
                </p>
              </div>

              <div>
                <label htmlFor="severity" className="field-label">
                  Severity
                </label>
                <select
                  id="severity"
                  value={form.severity}
                  onChange={update('severity')}
                  className="field-input"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
              <button onClick={() => navigate('/')} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'Creating…' : 'Create alert →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  );
}
