'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, onValue, set, push, type Unsubscribe } from 'firebase/database';
import { getDb } from '@/lib/firebase';
import type { TrackerData } from '@/types/tracker';

const SIGNAL_TIMEOUT_MS = 30_000;
const HISTORY_INTERVAL_MS = 60_000;

export function useTracker() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [noSignal, setNoSignal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHistoryRef = useRef<number>(0);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setLoading(false);
      setError('Firebase not configured. Go to Settings to set up your connection.');
      return;
    }

    const trackerRef = ref(db, 'tracker');

    const unsub: Unsubscribe = onValue(
      trackerRef,
      (snapshot) => {
        const val = snapshot.val() as TrackerData | null;
        if (val) {
          setData(val);
          setLastUpdated(new Date());
          setNoSignal(false);
          setLoading(false);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setNoSignal(true), SIGNAL_TIMEOUT_MS);

          const now = Date.now();
          if (now - lastHistoryRef.current > HISTORY_INTERVAL_MS) {
            lastHistoryRef.current = now;
            push(ref(db, 'history'), {
              lat: val.lat,
              lng: val.lng,
              alt: val.alt,
              sats: val.sats,
              timestamp: val.timestamp,
              recordedAt: now,
            }).catch(() => {});
          }
        } else {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerFind = useCallback(async () => {
    const db = getDb();
    if (!db) return;
    await set(ref(db, 'tracker/find'), true);
  }, []);

  const cancelFind = useCallback(async () => {
    const db = getDb();
    if (!db) return;
    await set(ref(db, 'tracker/find'), false);
  }, []);

  return { data, loading, error, lastUpdated, noSignal, triggerFind, cancelFind };
}
