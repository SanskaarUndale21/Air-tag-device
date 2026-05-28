'use client';
import { useState } from 'react';
import { useHistory } from '@/hooks/useHistory';
import { formatCoord, haversine, formatDistance } from '@/lib/utils';
import type { HomeLocation } from '@/types/tracker';

const CARD = { background: '#0a1525', border: '1px solid #162748', borderRadius: 12 };

export default function HistoryPage() {
  const { history, loading } = useHistory(200);
  const [search, setSearch] = useState('');

  const home: HomeLocation | null = (() => {
    if (typeof window === 'undefined') return null;
    const s = localStorage.getItem('findit_home');
    return s ? JSON.parse(s) : null;
  })();

  const filtered = history.filter((e) => {
    if (!search) return true;
    return `${e.lat} ${e.lng} ${e.alt}`.includes(search);
  });

  return (
    <div style={{ flex: 1, background: '#060d1a', padding: '28px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Location History</h1>
            <p style={{ fontSize: 13, color: '#4a6080' }}>
              {history.length} entries recorded (1 per minute while active)
            </p>
          </div>

          <input
            type="text"
            placeholder="Search coordinates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...CARD,
              padding: '9px 14px',
              fontSize: 13,
              color: '#e2e8f0',
              outline: 'none',
              width: 240,
              fontFamily: 'var(--font-space-mono)',
            }}
          />
        </div>

        <div style={{ ...CARD, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#4a6080', fontFamily: 'var(--font-space-mono)', fontSize: 13 }}>
              Loading history...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
              <p style={{ color: '#4a6080', fontFamily: 'var(--font-space-mono)', fontSize: 13 }}>No history entries yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #162748' }}>
                    {['#', 'Timestamp', 'Latitude', 'Longitude', 'Altitude', 'Sats', home ? 'Dist. from Home' : ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: 10,
                          color: '#4a6080',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, idx) => {
                    const dist = home ? haversine(entry.lat, entry.lng, home.lat, home.lng) : null;
                    const date = new Date(entry.recordedAt);
                    return (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid rgba(22,39,72,0.5)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22,39,72,0.4)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', color: '#4a6080', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'var(--font-space-mono)' }}>
                            {date.toLocaleDateString()} {date.toLocaleTimeString('en-US', { hour12: false })}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#00e5a0', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                          {formatCoord(entry.lat)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#00e5a0', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                          {formatCoord(entry.lng)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                          {entry.alt.toFixed(1)} m
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                          {entry.sats}
                        </td>
                        {home && (
                          <td style={{ padding: '12px 16px', color: dist && dist > 0 ? '#94a3b8' : '#4a6080', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>
                            {dist !== null ? formatDistance(dist) : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
