# Air-tag-device

DIY GPS tracker using an ESP32 microcontroller with a real-time web dashboard. Track your device location live on a map, trigger an alert buzzer remotely, and set geo-fence boundaries.

## What's in this repo

```
Air-tag-device/
├── findit/         Next.js 16 web dashboard (deploy on Vercel)
├── esp32/          ESP32 Arduino firmware
├── connection.md   Hardware wiring guide
└── README.md       This file
```

## How It Works

```
ESP32 + GPS module
       |
       | writes every 2s
       v
Firebase Realtime Database (/tracker)
       |
       | real-time listener
       v
FindIt Dashboard (Next.js on Vercel)
       |
       | sets /tracker/find = true
       v
ESP32 triggers buzzer + LED
```

1. The ESP32 reads GPS coordinates (UART) and writes `lat`, `lng`, `alt`, `sats` to Firebase every 2 seconds
2. The Next.js dashboard listens to Firebase in real time and renders the live location on a Leaflet map
3. Pressing "Find My Device" on the dashboard sets `/tracker/find = true` in Firebase
4. The ESP32 polls this flag and triggers the buzzer and LED when it's true

## Quick Start

### Hardware

See [connection.md](./connection.md) for full wiring.

Components needed:
- ESP32 DevKit
- NEO-6M GPS module
- Active buzzer
- LED + 220 ohm resistor

### Firmware

See [esp32/README.md](./esp32/README.md) for setup.

Edit `esp32/gps_tracker.ino` with your WiFi credentials and Firebase config, then flash via Arduino IDE.

### Dashboard

See [findit/README.md](./findit/README.md) for setup and Vercel deployment.

```bash
cd findit
cp .env.local.example .env.local
# fill in Firebase config
npm install
npm run dev
```

Deploy to Vercel: import the repo, set the 4 `NEXT_PUBLIC_FIREBASE_*` environment variables, and deploy.

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Realtime Database** in test mode
3. Enable **Anonymous Authentication** (for ESP32 sign-in)
4. Copy the web app config to `.env.local` and to the ESP32 sketch

Database structure written by the ESP32:

```json
{
  "tracker": {
    "lat": 12.971598,
    "lng": 77.594562,
    "alt": 921.4,
    "sats": 7,
    "timestamp": 84523,
    "find": false,
    "alert": false
  }
}
```

## Dashboard Features

- Live map (Leaflet + CartoDB dark tiles, no API key needed)
- Lat / Lng / Altitude / Satellite count readout
- Distance from home calculation
- Geo-fence with adjustable radius (shows red when device exits)
- "Find My Device" button with glow effect
- Location history table (1 entry per minute)
- Settings page for Firebase config
- TRACKING / OUT OF RANGE / NO SIGNAL status badge
