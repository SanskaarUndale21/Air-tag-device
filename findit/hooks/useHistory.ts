'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { getDb } from '@/lib/firebase';
import type { HistoryEntry } from '@/types/tracker';

export function useHistory(limit = 200) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(ref(db, 'history'), orderByChild('recordedAt'), limitToLast(limit));
    const unsub = onValue(q, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const entries: HistoryEntry[] = Object.entries(val)
          .map(([id, d]) => ({ id, ...(d as Omit<HistoryEntry, 'id'>) }))
          .sort((a, b) => b.recordedAt - a.recordedAt);
        setHistory(entries);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [limit]);

  return { history, loading };
}
