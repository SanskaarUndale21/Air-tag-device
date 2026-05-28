'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HomeLocation } from '@/types/tracker';

function createDeviceIcon() {
  return L.divIcon({
    html: `
      <div style="
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        position:relative;
      ">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:rgba(0,229,160,0.15);
          border:2px solid #00e5a0;
          position:absolute;
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          width:16px;height:16px;border-radius:50%;
          background:#00e5a0;
          box-shadow:0 0 12px rgba(0,229,160,0.8);
          position:relative;z-index:1;
        "></div>
        <style>
          @keyframes ping{0%{transform:scale(1);opacity:0.9}100%{transform:scale(2.2);opacity:0}}
        </style>
      </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createHomeIcon() {
  return L.divIcon({
    html: `
      <div style="
        width:32px;height:32px;
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          width:28px;height:28px;border-radius:6px;
          background:rgba(251,191,36,0.2);
          border:2px solid #fbbf24;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
        ">🏠</div>
      </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const initialRef = useRef(false);
  useEffect(() => {
    if (!initialRef.current) {
      map.setView([lat, lng], 16);
      initialRef.current = true;
    } else {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

interface MapProps {
  lat: number;
  lng: number;
  home: HomeLocation | null;
  geofenceRadius: number;
  outOfRange: boolean;
}

export default function MapComponent({ lat, lng, home, geofenceRadius, outOfRange }: MapProps) {
  const deviceIcon = createDeviceIcon();
  const homeIcon = createHomeIcon();

  const circleCenter: [number, number] = home ? [home.lat, home.lng] : [lat, lng];

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ width: '100%', height: '100%', background: '#0a1525' }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <MapUpdater lat={lat} lng={lng} />

      <Marker position={[lat, lng]} icon={deviceIcon} />

      {home && <Marker position={[home.lat, home.lng]} icon={homeIcon} />}

      {home && (
        <Circle
          center={circleCenter}
          radius={geofenceRadius}
          pathOptions={{
            color: outOfRange ? '#ef4444' : '#00e5a0',
            fillColor: outOfRange ? '#ef4444' : '#00e5a0',
            fillOpacity: 0.04,
            weight: 1.5,
            dashArray: '6 4',
          }}
        />
      )}
    </MapContainer>
  );
}
