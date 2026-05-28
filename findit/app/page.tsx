'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useTracker } from '@/hooks/useTracker';
import StatusBadge from '@/components/StatusBadge';
import { haversine, formatDistance, formatCoord } from '@/lib/utils';
import type { HomeLocation, TrackerStatus } from '@/types/tracker';

const Map = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const CARD = {
  background: '#0a1525',
  border: '1px solid #162748',
  borderRadius: 12,
};

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ ...CARD, padding: '12px 16px' }}>
      <p style={{ fontSize: 10, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-space-mono)', color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: '#4a6080', marginLeft: 4, fontWeight: 400 }}>{unit}</span>}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, lastUpdated, noSignal, triggerFind, cancelFind } = useTracker();
  const [home, setHome] = useState<HomeLocation | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState(300);
  const [finding, setFinding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceName, setDeviceName] = useState('My Tracker');

  useEffect(() => {
    const storedHome = localStorage.getItem('findit_home');
    const storedRadius = localStorage.getItem('findit_geofence_radius');
    const storedName = localStorage.getItem('findit_device_name');
    if (storedHome) setHome(JSON.parse(storedHome));
    if (storedRadius) setGeofenceRadius(Number(storedRadius));
    if (storedName) setDeviceName(storedName);
  }, []);

  useEffect(() => {
    if (data?.find !== undefined) setFinding(data.find);
  }, [data?.find]);

  const distance = data && home ? haversine(data.lat, data.lng, home.lat, home.lng) : null;
  const outOfRange = distance !== null && distance > geofenceRadius;

  const status: TrackerStatus = noSignal || !data
    ? 'no_signal'
    : outOfRange && home
    ? 'out_of_range'
    : 'tracking';

  const handleFind = useCallback(async () => {
    if (finding) {
      await cancelFind();
      setFinding(false);
    } else {
      await triggerFind();
      setFinding(true);
    }
  }, [finding, triggerFind, cancelFind]);

  const handleSetHome = () => {
    if (!data) return;
    const loc = { lat: data.lat, lng: data.lng };
    setHome(loc);
    localStorage.setItem('findit_home', JSON.stringify(loc));
  };

  const handleCopyCoords = () => {
    if (!data) return;
    navigator.clipboard.writeText(`${data.lat}, ${data.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMaps = () => {
    if (!data) return;
    window.open(`https://maps.google.com/?q=${data.lat},${data.lng}`, '_blank');
  };

  const handleRadiusChange = (val: number) => {
    setGeofenceRadius(val);
    localStorage.setItem('findit_geofence_radius', String(val));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#060d1a' }}>
        <div className="text-center">
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #162748', borderTopColor: '#00e5a0', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#4a6080', fontFamily: 'var(--font-space-mono)', fontSize: 13 }}>Connecting to tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#060d1a', minHeight: 0 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '10px 16px', color: '#f87171', fontSize: 13, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: 320, flexShrink: 0, background: '#060d1a', borderRight: '1px solid #162748', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #162748' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ color: '#4a6080', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{deviceName}</p>
              <StatusBadge status={status} />
            </div>
            {lastUpdated && (
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, color: '#4a6080' }}>
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard label="Latitude" value={data ? formatCoord(data.lat) : '--'} />
            <StatCard label="Longitude" value={data ? formatCoord(data.lng) : '--'} />
            <StatCard label="Altitude" value={data ? data.alt.toFixed(1) : '--'} unit="m" />
            <StatCard label="Satellites" value={data ? String(data.sats) : '--'} unit="sats" />
            <div style={{ gridColumn: '1 / -1' }}>
              <StatCard
                label="Distance from Home"
                value={distance !== null ? formatDistance(distance) : home ? 'Calculating...' : 'No home set'}
              />
            </div>
          </div>

          {/* Find My Device */}
          <div style={{ padding: '0 16px 16px' }}>
            <button
              onClick={handleFind}
              disabled={!data}
              className={finding ? 'glow-pulse' : ''}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: data ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-space-mono)',
                background: finding
                  ? 'rgba(0, 229, 160, 0.1)'
                  : data
                  ? '#00e5a0'
                  : '#162748',
                color: finding ? '#00e5a0' : data ? '#060d1a' : '#4a6080',
                border: finding ? '1px solid #00e5a0' : '1px solid transparent',
                boxShadow: finding
                  ? 'none'
                  : data
                  ? '0 0 24px rgba(0,229,160,0.35)'
                  : 'none',
              }}
            >
              {finding ? '⟳  STOP FINDING' : '◉  FIND MY DEVICE'}
            </button>
          </div>

          {/* Geofence slider */}
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #162748', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Geo-fence Radius</p>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 13, color: outOfRange ? '#f87171' : '#00e5a0', fontWeight: 700 }}>
                {geofenceRadius >= 1000 ? `${(geofenceRadius / 1000).toFixed(1)} km` : `${geofenceRadius} m`}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={geofenceRadius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              disabled={!home}
              style={{ width: '100%', accentColor: outOfRange ? '#ef4444' : '#00e5a0', cursor: home ? 'pointer' : 'not-allowed' }}
            />
            {!home && (
              <p style={{ fontSize: 10, color: '#4a6080', marginTop: 4 }}>Set home location to enable geo-fence</p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleSetHome}
              disabled={!data}
              style={{ ...CARD, padding: '10px 14px', cursor: data ? 'pointer' : 'not-allowed', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s', width: '100%', textAlign: 'left' }}
              onMouseEnter={(e) => data && (e.currentTarget.style.borderColor = '#1e3558')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#162748')}
            >
              <span>🏠</span> Set Current as Home
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyCoords}
                disabled={!data}
                style={{ ...CARD, flex: 1, padding: '10px 14px', cursor: data ? 'pointer' : 'not-allowed', color: copied ? '#00e5a0' : '#94a3b8', fontSize: 13, transition: 'all 0.15s' }}
              >
                {copied ? '✓ Copied' : '⧉ Copy Coords'}
              </button>
              <button
                onClick={handleOpenMaps}
                disabled={!data}
                style={{ ...CARD, flex: 1, padding: '10px 14px', cursor: data ? 'pointer' : 'not-allowed', color: '#94a3b8', fontSize: 13, transition: 'all 0.15s' }}
              >
                ↗ Maps
              </button>
            </div>
          </div>
        </aside>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {data ? (
            <Map
              lat={data.lat}
              lng={data.lng}
              home={home}
              geofenceRadius={geofenceRadius}
              outOfRange={outOfRange}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1525' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📡</p>
                <p style={{ color: '#4a6080', fontFamily: 'var(--font-space-mono)', fontSize: 13 }}>Waiting for GPS signal...</p>
              </div>
            </div>
          )}

          {/* Coordinate overlay */}
          {data && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 500,
                background: 'rgba(6,13,26,0.85)',
                border: '1px solid #162748',
                borderRadius: 8,
                padding: '8px 12px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, color: '#00e5a0', lineHeight: 1.6 }}>
                {formatCoord(data.lat)}, {formatCoord(data.lng)}
              </p>
              <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#4a6080' }}>
                Alt {data.alt.toFixed(0)}m · {data.sats} sats
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile map below sidebar on small screens */}
      <style>{`
        @media (max-width: 768px) {
          aside { width: 100% !important; border-right: none !important; border-bottom: 1px solid #162748 !important; }
          div[style*="flex: 1"] { flex-direction: column !important; }
          div[style*="min-height: 0"] > div:last-child { height: 350px !important; }
        }
      `}</style>
    </div>
  );
}
