import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

let _db: Database | null = null;

function buildConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('findit_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey) return parsed;
      } catch { /* ignore */ }
    }
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  };
}

export function getDb(): Database | null {
  if (typeof window === 'undefined') return null;
  if (_db) return _db;
  try {
    const config = buildConfig();
    if (!config.apiKey && !config.databaseURL) return null;
    const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
    _db = getDatabase(app);
    return _db;
  } catch {
    return null;
  }
}
