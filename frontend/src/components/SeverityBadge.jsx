export default function SeverityBadge({ severity }) {
  const map = {
    critical: 'bg-crit/15 text-crit border border-crit/30',
    warning: 'bg-beacon/15 text-beacon border border-beacon/30',
    info: 'bg-info/15 text-info border border-info/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
        map[severity] || 'bg-line text-mut border border-line'
      }`}
    >
      {severity}
    </span>
  );
}
