import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../api/client.js';
import Layout from '../components/Layout.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import Toast from '../components/Toast.jsx';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:border-beacon/30 transition">
      {/* Subtle coral glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-beacon/5 to-transparent opacity-0 group-hover:opacity-100 transition rounded-2xl" />
      <p className="font-mono text-xs uppercase tracking-wider text-mut relative">{label}</p>
      <p className={`mt-2 font-display text-4xl font-semibold relative ${accent || ''}`}
         style={{ fontFamily: 'Inter, sans-serif' }}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, tplRes] = await Promise.all([
        api.get('/alerts'),
        api.get('/alerts/templates'),
      ]);
      setAlerts(alertRes.data.alerts);
      const map = {};
      tplRes.data.templates.forEach((t) => {
        map[t.id] = t.label;
      });
      setLabels(map);
    } catch (err) {
      setToast({ type: 'error', message: apiError(err, 'Could not load alerts.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (alert) => {
    const ok = window.confirm(
      `Delete "${alert.alert_name}"? This removes the YAML from Git and the record from the database.`
    );
    if (!ok) return;

    setDeletingId(alert.id);
    try {
      await api.delete(`/alerts/${alert.id}`);
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      setToast({ type: 'success', message: 'Alert deleted.' });
    } catch (err) {
      setToast({ type: 'error', message: apiError(err, 'Could not delete the alert.') });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-beacon mb-1">Overview</p>
          <h1 className="font-display text-2xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-mut">Alerts you've created and pushed to GitOps.</p>
        </div>
        <Link to="/alerts/new" className="btn-primary">
          + Create alert
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total alerts created" value={alerts.length} />
        <StatCard
          label="Critical"
          value={alerts.filter((a) => a.severity === 'critical').length}
          accent="text-crit"
        />
        <StatCard
          label="Warning"
          value={alerts.filter((a) => a.severity === 'warning').length}
          accent="text-beacon"
        />
      </div>

      {/* Alerts table */}
      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-display font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            Your alerts
          </h2>
          {!loading && alerts.length > 0 && (
            <span className="font-mono text-xs text-mut">{alerts.length} total</span>
          )}
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-mut">
              <span className="h-4 w-4 rounded-full border-2 border-beacon border-t-transparent animate-spin" />
              Loading alerts…
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-panel2 border border-line">
              <svg className="h-5 w-5 text-mut" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm text-mut">No alerts yet.</p>
            <Link to="/alerts/new" className="btn-ghost mt-4 inline-flex">
              Create your first alert
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-panel2/50 font-mono text-xs uppercase tracking-wider text-mut">
                  <th className="px-5 py-3 font-medium">Alert name</th>
                  <th className="px-5 py-3 font-medium">Deployment</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-line/60 last:border-0 hover:bg-panel2/40 transition"
                  >
                    <td className="px-5 py-3.5 font-medium">{a.alert_name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-mut">{a.deployment_name}</td>
                    <td className="px-5 py-3.5 text-mut">{labels[a.alert_type] || a.alert_type}</td>
                    <td className="px-5 py-3.5">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="px-5 py-3.5 text-mut">{formatDate(a.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={deletingId === a.id}
                        className="btn-danger px-3 py-1.5 text-sm"
                      >
                        {deletingId === a.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  );
}
