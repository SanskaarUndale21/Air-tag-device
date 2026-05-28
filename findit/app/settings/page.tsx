'use client';
import { useState, useEffect } from 'react';

const CARD = { background: '#0a1525', border: '1px solid #162748', borderRadius: 12 };

interface Config {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
}

interface AppSettings {
  deviceName: string;
  geofenceRadius: number;
  phoneNumber: string;
}

const INPUT_STYLE = {
  ...CARD,
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  fontSize: 13,
  color: '#e2e8f0',
  outline: 'none',
  marginTop: 6,
  fontFamily: 'var(--font-space-mono)',
  transition: 'border-color 0.15s',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, color: '#8899aa', fontWeight: 500, display: 'block', marginBottom: 2 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#4a6080', marginBottom: 4 }}>{hint}</p>}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
  });
  const [settings, setSettings] = useState<AppSettings>({
    deviceName: 'My Tracker',
    geofenceRadius: 300,
    phoneNumber: '',
  });
  const [saved, setSaved] = useState(false);
  const [homeCleared, setHomeCleared] = useState(false);

  useEffect(() => {
    const storedConfig = localStorage.getItem('findit_config');
    const storedName = localStorage.getItem('findit_device_name');
    const storedRadius = localStorage.getItem('findit_geofence_radius');
    const storedPhone = localStorage.getItem('findit_phone');
    if (storedConfig) {
      try { setConfig(JSON.parse(storedConfig)); } catch { /* ignore */ }
    } else {
      setConfig({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      });
    }
    if (storedName) setSettings((s) => ({ ...s, deviceName: storedName }));
    if (storedRadius) setSettings((s) => ({ ...s, geofenceRadius: Number(storedRadius) }));
    if (storedPhone) setSettings((s) => ({ ...s, phoneNumber: storedPhone }));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.apiKey) localStorage.setItem('findit_config', JSON.stringify(config));
    localStorage.setItem('findit_device_name', settings.deviceName);
    localStorage.setItem('findit_geofence_radius', String(settings.geofenceRadius));
    if (settings.phoneNumber) localStorage.setItem('findit_phone', settings.phoneNumber);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearHome = () => {
    localStorage.removeItem('findit_home');
    setHomeCleared(true);
    setTimeout(() => setHomeCleared(false), 2000);
  };

  return (
    <div style={{ flex: 1, background: '#060d1a', padding: '28px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#4a6080' }}>Configure your tracker and Firebase connection</p>
        </div>

        <form onSubmit={handleSave}>
          {/* Firebase Config */}
          <div style={{ ...CARD, padding: '24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Firebase Configuration</h2>
            </div>
            <div style={{ fontSize: 12, color: '#4a6080', background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              Config saved here overrides Vercel environment variables. Leave empty to use env vars.
            </div>

            <Field label="API Key" hint="Found in Firebase Console > Project Settings > Your apps">
              <input
                type="text"
                placeholder="AIza..."
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>

            <Field label="Auth Domain">
              <input
                type="text"
                placeholder="your-project.firebaseapp.com"
                value={config.authDomain}
                onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>

            <Field label="Database URL" hint="Realtime Database URL (ends with .firebaseio.com)">
              <input
                type="text"
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                value={config.databaseURL}
                onChange={(e) => setConfig({ ...config, databaseURL: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>

            <Field label="Project ID">
              <input
                type="text"
                placeholder="your-project-id"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>
          </div>

          {/* Device Settings */}
          <div style={{ ...CARD, padding: '24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>📡</span>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Device Settings</h2>
            </div>

            <Field label="Device Name">
              <input
                type="text"
                placeholder="My Tracker"
                value={settings.deviceName}
                onChange={(e) => setSettings({ ...settings, deviceName: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>

            <Field label="Default Geo-fence Radius" hint={`${settings.geofenceRadius >= 1000 ? `${(settings.geofenceRadius / 1000).toFixed(1)} km` : `${settings.geofenceRadius} m`}`}>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={settings.geofenceRadius}
                onChange={(e) => setSettings({ ...settings, geofenceRadius: Number(e.target.value) })}
                style={{ width: '100%', marginTop: 10, accentColor: '#00e5a0' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#4a6080' }}>50 m</span>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 12, color: '#00e5a0', fontWeight: 700 }}>
                  {settings.geofenceRadius >= 1000 ? `${(settings.geofenceRadius / 1000).toFixed(1)} km` : `${settings.geofenceRadius} m`}
                </span>
                <span style={{ fontSize: 11, color: '#4a6080' }}>1 km</span>
              </div>
            </Field>

            <Field label="Phone Number" hint="For future SMS alert integration">
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={settings.phoneNumber}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                style={INPUT_STYLE}
                onFocus={(e) => (e.target.style.borderColor = '#1e3558')}
                onBlur={(e) => (e.target.style.borderColor = '#162748')}
              />
            </Field>
          </div>

          {/* Danger Zone */}
          <div style={{ ...CARD, padding: '24px', marginBottom: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f87171' }}>Danger Zone</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Clear saved home location</p>
                <p style={{ fontSize: 11, color: '#4a6080' }}>Removes the home pin and disables geo-fencing</p>
              </div>
              <button
                type="button"
                onClick={handleClearHome}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(239,68,68,0.1)',
                  color: homeCleared ? '#4ade80' : '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {homeCleared ? '✓ Cleared' : 'Clear Home'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              background: saved ? 'rgba(0,229,160,0.15)' : '#00e5a0',
              color: saved ? '#00e5a0' : '#060d1a',
              border: saved ? '1px solid #00e5a0' : '1px solid transparent',
              transition: 'all 0.2s',
              letterSpacing: '0.05em',
            }}
          >
            {saved ? '✓ Settings Saved — Reload page to apply Firebase changes' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
