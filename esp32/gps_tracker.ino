/*
 * FindIt — ESP32 GPS Tracker
 *
 * Reads GPS from UART2, POSTs to your Render server every few seconds.
 * Response from server tells whether to trigger buzzer + LED (find mode).
 *
 * Required libraries (Arduino Library Manager):
 *   - TinyGPSPlus   by Mikal Hart
 *   - ArduinoJson   by Benoit Blanchon
 *
 * Pins (change below if needed):
 *   GPS TX  ->  ESP32 GPIO 16 (RX2)
 *   GPS VCC ->  3.3V or 5V
 *   GPS GND ->  GND
 *   Buzzer+ ->  GPIO 25
 *   LED+    ->  GPIO 26  (220 ohm to GND)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ─── USER CONFIG ────────────────────────────────────────────────
#define WIFI_SSID      "CE5"
#define WIFI_PASSWORD  "00000000"

// Copy your Render URL here (no trailing slash)
#define SERVER_URL     "https://air-tag-device.onrender.com/api/data"

#define SEND_INTERVAL_MS   3000   // how often to send GPS data (ms)
// ────────────────────────────────────────────────────────────────

#define GPS_RX_PIN    16
#define GPS_TX_PIN    17
#define GPS_BAUD      9600

#define BUZZER_PIN    25
#define LED_PIN       26

TinyGPSPlus      gps;
HardwareSerial   gpsSerial(2);
WiFiClientSecure secureClient;

unsigned long lastSend = 0;
bool findActive = false;

// ─── Setup ───────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Skip SSL cert verification (fine for personal projects)
  secureClient.setInsecure();

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected: " + WiFi.localIP().toString());
}

// ─── Non-blocking continuous beep (called every loop tick) ──────
void handleBuzzer() {
  static unsigned long lastToggle = 0;
  static bool state = false;

  if (findActive) {
    if (millis() - lastToggle >= 300) {
      lastToggle = millis();
      state = !state;
      digitalWrite(BUZZER_PIN, state ? HIGH : LOW);
      digitalWrite(LED_PIN,    state ? HIGH : LOW);
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    state = false;
  }
}

// ─── Send to server (always runs — GPS fix optional) ────────────
bool sendData(double lat, double lng, double alt, int sats, bool hasFix) {
  if (WiFi.status() != WL_CONNECTED) return false;

  StaticJsonDocument<256> doc;
  if (hasFix) {
    doc["lat"] = lat;
    doc["lng"] = lng;
    doc["alt"] = alt;
  } else {
    doc["nofix"] = true;   // server keeps existing location, still returns find flag
  }
  doc["sats"]      = sats;
  doc["timestamp"] = millis() / 1000;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(secureClient, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  int code = http.POST(body);

  if (code == 200) {
    String resp = http.getString();
    StaticJsonDocument<128> res;
    if (!deserializeJson(res, resp)) {
      findActive = res["find"].as<bool>();
    }
    if (hasFix) {
      Serial.printf("[OK] %.6f, %.6f  sats=%d  find=%d\n", lat, lng, sats, (int)findActive);
    } else {
      Serial.printf("[PING] no fix  sats=%d  find=%d\n", sats, (int)findActive);
    }
    http.end();
    return true;
  }

  Serial.printf("[ERR] HTTP %d\n", code);
  http.end();
  return false;
}

// ─── Main loop ───────────────────────────────────────────────────
void loop() {
  // Feed GPS parser
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  // Buzzer runs every tick — independent of send interval
  handleBuzzer();

  // Throttle sends
  if (millis() - lastSend < SEND_INTERVAL_MS) return;
  lastSend = millis();

  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  bool   hasFix = gps.location.isValid();
  int    sats   = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;

  if (!hasFix) {
    uint32_t chars = gps.charsProcessed();
    if (chars < 10) {
      Serial.println("[GPS] NO DATA — check TX->GPIO16 wiring");
    } else {
      Serial.printf("[GPS] No fix yet — chars=%lu sats=%d\n", (unsigned long)chars, sats);
    }
  }

  double lat = hasFix ? gps.location.lat() : 0.0;
  double lng = hasFix ? gps.location.lng() : 0.0;
  double alt = hasFix && gps.altitude.isValid() ? gps.altitude.meters() : 0.0;

  // Always ping server — even without fix — so find flag stays in sync
  sendData(lat, lng, alt, sats, hasFix);
}
