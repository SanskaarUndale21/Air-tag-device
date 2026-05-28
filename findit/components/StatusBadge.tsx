import type { TrackerStatus } from '@/types/tracker';

const cfg = {
  tracking: {
    label: 'TRACKING',
    bg: 'rgba(0, 229, 160, 0.1)',
    border: 'rgba(0, 229, 160, 0.3)',
    text: '#00e5a0',
    dot: '#00e5a0',
    pulse: true,
  },
  out_of_range: {
    label: 'OUT OF RANGE',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#f87171',
    dot: '#ef4444',
    pulse: false,
  },
  no_signal: {
    label: 'NO SIGNAL',
    bg: 'rgba(100, 116, 139, 0.1)',
    border: 'rgba(100, 116, 139, 0.2)',
    text: '#64748b',
    dot: '#475569',
    pulse: false,
  },
};

export default function StatusBadge({ status }: { status: TrackerStatus }) {
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontFamily: 'var(--font-space-mono)' }}
    >
      <span
        className={c.pulse ? 'signal-dot' : ''}
        style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }}
      />
      {c.label}
    </span>
  );
}
