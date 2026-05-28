export interface TrackerData {
  lat: number;
  lng: number;
  alt: number;
  sats: number;
  timestamp: number;
  find: boolean;
  alert: boolean;
}

export interface HistoryEntry {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  sats: number;
  timestamp: number;
  recordedAt: number;
}

export interface HomeLocation {
  lat: number;
  lng: number;
}

export type TrackerStatus = 'tracking' | 'out_of_range' | 'no_signal';
