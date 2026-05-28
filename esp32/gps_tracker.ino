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

// ─── Buzz/LED alert ──────────────────────────────────────────────
void buzz(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_PIN, HIGH);
    delay(350);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    delay(150);
  }
}

// ─── Send GPS to server ──────────────────────────────────────────
bool sendData(double lat, double lng, double alt, int sats) {
  if (WiFi.status() != WL_CONNECTED) return false;

  // Build JSON body
  StaticJsonDocument<200> doc;
  doc["lat"]       = lat;
  doc["lng"]       = lng;
  doc["alt"]       = alt;
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
    DeserializationError err = deserializeJson(res, resp);
    if (!err) {
      findActive = res["find"].as<bool>();
    }
    Serial.printf("[OK] %.6f, %.6f  sats=%d  find=%d\n", lat, lng, sats, (int)findActive);
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

  if (!gps.location.isValid()) {
    uint32_t chars = gps.charsProcessed();
    uint32_t sats  = gps.satellites.isValid() ? gps.satellites.value() : 0;
    if (chars < 10) {
      // GPS serial not wired or wrong baud — no NMEA data arriving at all
      Serial.println("[GPS] NO DATA from module — check TX->GPIO16 wiring and 9600 baud");
    } else {
      // Data arriving, just waiting for satellite lock
      Serial.printf("[GPS] Waiting for fix — chars=%lu  sats=%lu  (go outdoors / near window)\n",
                    (unsigned long)chars, (unsigned long)sats);
    }
    return;
  }

  double lat  = gps.location.lat();
  double lng  = gps.location.lng();
  double alt  = gps.altitude.isValid() ? gps.altitude.meters() : 0.0;
  int    sats = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;

  bool ok = sendData(lat, lng, alt, sats);

  // React to find flag
  if (ok && findActive) {
    buzz(3);
  } else if (!findActive) {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
  }
}
