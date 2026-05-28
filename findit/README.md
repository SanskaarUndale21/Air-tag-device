# FindIt - Smart GPS Tracker Dashboard

Real-time GPS tracking dashboard built with Next.js 16, Firebase Realtime Database, and Leaflet.js. Designed for use with an ESP32 + GPS module.

## Features

- Live map with device location (CartoDB dark tiles via Leaflet)
- Real-time data from Firebase: latitude, longitude, altitude, satellite count
- "Find My Device" button - sets `/tracker/find = true` to trigger buzzer/LED on ESP32
- Geo-fence with adjustable radius (50m - 1km) and out-of-range alert
- Location history log (1 entry per minute in Firebase)
- Status badge: TRACKING / OUT OF RANGE / NO SIGNAL
- Copy coordinates + Open in Google Maps
- Settings page for Firebase config and device name
- Dark navy theme, monospace coordinates, mobile responsive

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Firebase Realtime Database
- Leaflet + react-leaflet (free, no API key)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/Air-tag-device
cd Air-tag-device/findit
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database** (start in test mode for development)
4. Go to Project Settings > Your apps > Web app > SDK config
5. Copy the config values

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://your-project-default-rtdb.firebaseio.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |

5. Click **Deploy**

### 3. Firebase Database Rules

For production, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "tracker": {
      ".read": true,
      ".write": true
    },
    "history": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## Firebase Data Structure

The ESP32 writes to `/tracker`:

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

The dashboard writes to `/tracker/find` (true/false) and appends to `/history`.

---

## Alternative Config

Visit `/settings` in the app to enter Firebase config directly via the UI. It saves to localStorage and takes effect on next page load, overriding env vars.
