# ESP32 GPS Tracker Firmware

Arduino sketch for the FindIt GPS tracker device. Reads GPS coordinates and pushes them to Firebase Realtime Database in real time. Also listens for the `find` flag from the dashboard to trigger a buzzer and LED.

## Hardware Required

| Component | Description |
|---|---|
| ESP32 | Any variant (DevKit, WROOM, WROVER) |
| GPS Module | NEO-6M or NEO-8M (UART interface) |
| Buzzer | Passive or active, 3.3V compatible |
| LED | Any colour + 220 ohm resistor |

## Pin Connections

See `../connection.md` for full wiring diagram.

| ESP32 Pin | Connected To |
|---|---|
| GPIO 16 (RX2) | GPS module TX |
| GPIO 17 (TX2) | GPS module RX (optional) |
| GPIO 25 | Buzzer (+) |
| GPIO 26 | LED (+) via 220 ohm resistor |
| GND | GPS GND, Buzzer (-), LED (-) |
| 3.3V or 5V | GPS VCC |

## Arduino IDE Setup

### 1. Install ESP32 board support

In Arduino IDE > Preferences > Additional Board Manager URLs, add:

```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Then go to Tools > Board Manager, search for **esp32**, and install.

### 2. Install required libraries

Go to Sketch > Include Library > Manage Libraries and install:

- **Firebase Arduino Client Library for ESP8266 and ESP32** by Mobizt
- **TinyGPSPlus** by Mikal Hart

### 3. Configure the sketch

Open `gps_tracker.ino` and edit the config section at the top:

```cpp
#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

#define FIREBASE_API_KEY      "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DATABASE_URL "https://your-project-default-rtdb.firebaseio.com"
```

Get the Firebase API key and Database URL from:
Firebase Console > Project Settings > General > Your apps > Web app config

### 4. Firebase Database Rules

Set Realtime Database rules to allow read/write (for development):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 5. Flash

- Select Board: **ESP32 Dev Module** (or your specific variant)
- Select the correct COM port
- Click Upload

## How It Works

1. ESP32 connects to WiFi on boot
2. Anonymous sign-in to Firebase
3. Every 2 seconds, reads GPS NMEA data via UART2 (TinyGPSPlus)
4. Sends `lat`, `lng`, `alt`, `sats`, `timestamp` to `/tracker` in Firebase using `updateNode` (does not overwrite the `find` flag)
5. Reads `/tracker/find` on each cycle - if `true`, plays a buzzer + LED alert pattern
6. The dashboard sets `/tracker/find = false` when you stop finding

## Troubleshooting

- **No GPS fix**: Move outdoors or near a window. Cold start can take 1-3 minutes.
- **Firebase auth error**: Double-check your API key and Database URL. Make sure Anonymous auth is enabled in Firebase Console > Authentication > Sign-in providers.
- **Garbled GPS data**: Check baud rate (usually 9600 for NEO-6M) and TX/RX pin connections.
- **WiFi not connecting**: Confirm SSID and password. ESP32 only supports 2.4 GHz networks.
