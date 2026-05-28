# Air-tag-device

DIY GPS tracker using an ESP32 + GPS module with a real-time Flask dashboard deployed on Render. No Firebase, no paid services — just a Flask server, a JSON file, and a single HTML dashboard.

## Architecture

```
ESP32 + NEO-6M GPS
    │
    │  POST /api/data  (every 3 seconds over WiFi)
    ▼
Flask server on Render  ──  stores data in tracker_data.json
    │                    ──  appends to tracker_history.json
    │  GET /api/status  (every 2 seconds)
    ▼
Browser dashboard (index.html served by Flask)
    │
    │  POST /api/find  (when you press the button)
    ▼
Flask sets find=true  →  ESP32 reads it in next response  →  buzzer + LED
```

## Repository Structure

```
Air-tag-device/
├── server/                Flask app (deploy to Render)
│   ├── app.py             API endpoints + serves HTML
│   ├── requirements.txt
│   ├── Procfile
│   └── templates/
│       └── index.html     Full dashboard (single file)
├── esp32/
│   ├── gps_tracker.ino    Arduino firmware
│   └── README.md
├── connection.md          Hardware wiring guide
├── render.yaml            Render deployment config
└── README.md
```

---

## Deploy to Render

### 1. Push to GitHub

Make sure your code is pushed to GitHub (this repo).

### 2. Create Render Web Service

1. Go to [render.com](https://render.com) and sign up (free)
2. Dashboard > **New** > **Web Service**
3. Connect your GitHub repo (`Air-tag-device`)
4. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
5. Click **Create Web Service**
6. Copy the URL shown (e.g. `https://findit-tracker.onrender.com`)

### 3. Flash the ESP32

Open `esp32/gps_tracker.ino` in Arduino IDE and fill in:

```cpp
#define WIFI_SSID      "YourWiFiName"
#define WIFI_PASSWORD  "YourWiFiPass"
#define SERVER_URL     "https://findit-tracker.onrender.com/api/data"
```

Then flash to your ESP32 (see `esp32/README.md` for full setup).

### 4. Open the Dashboard

Visit your Render URL in a browser. The dashboard will show live data as soon as the ESP32 gets a GPS fix and starts sending.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/data` | ESP32 sends GPS data here. Response includes `find` flag. |
| `GET` | `/api/status` | Dashboard polls this for live state. |
| `POST` | `/api/find` | Dashboard sets `{"active": true/false}` to trigger buzzer. |
| `GET` | `/api/history` | Returns last 100 location entries. |
| `GET` | `/` | Serves the HTML dashboard. |

## ESP32 POST body (to `/api/data`)

```json
{ "lat": 12.971598, "lng": 77.594562, "alt": 921.4, "sats": 7, "timestamp": 84523 }
```

Response from server:

```json
{ "ok": true, "find": false, "alert": false }
```

If `find` is `true`, the ESP32 triggers the buzzer and LED pattern.

---

## Dashboard Features

- Live map (Leaflet + CartoDB dark tiles — no API key needed)
- Lat / Lng / Altitude / Satellite count readout
- Distance from home
- Geo-fence radius slider (50 m – 1 km) with out-of-range alert (turns red)
- **Find My Device** button with glowing animation
- TRACKING / OUT OF RANGE / NO SIGNAL status badge
- Copy coordinates, Open in Google Maps
- Location history table (last 100 entries)

## Hardware

See [connection.md](./connection.md) for the full wiring diagram.

- ESP32 DevKit
- NEO-6M GPS module
- Active buzzer
- LED + 220 ohm resistor

## Note on Free Tier

Render's free tier **spins down after 15 minutes of inactivity** (cold start ~30 s). Since your ESP32 sends data every 3 seconds, the server will stay awake as long as the device is running.

Data stored in JSON files is **ephemeral on Render** — it's wiped on each deploy/restart. For permanent history, upgrade to a paid tier or swap the JSON file for a small SQLite/PostgreSQL database.
