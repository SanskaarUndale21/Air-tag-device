/*
 * FindIt - ESP32 GPS Tracker Firmware
 *
 * Hardware:
 *   - ESP32 (any variant)
 *   - GPS module (NEO-6M / NEO-8M) on UART2
 *   - Buzzer on pin BUZZER_PIN
 *   - LED on pin LED_PIN
 *
 * Libraries (install via Arduino Library Manager):
 *   - Firebase ESP Client: "Firebase Arduino Client Library for ESP8266 and ESP32"
 *   - TinyGPSPlus: "TinyGPSPlus by Mikal Hart"
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ---- CONFIG ---- //
#define WIFI_SSID      "YOUR_WIFI_SSID"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"

#define FIREBASE_API_KEY      "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DATABASE_URL "https://your-project-default-rtdb.firebaseio.com"

#define GPS_RX_PIN    16   // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN    17   // ESP32 TX2 -> GPS RX (usually not needed)
#define GPS_BAUD      9600

#define BUZZER_PIN    25
#define LED_PIN       26

#define UPDATE_INTERVAL_MS  2000   // send GPS data every 2 seconds
// ---------------- //

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

unsigned long lastUpdate = 0;
bool signupOK = false;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());

  // Firebase config
  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // Anonymous sign-in
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signup OK");
    signupOK = true;
  } else {
    Serial.printf("Firebase signup error: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // Feed GPS data
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  // Send to Firebase every UPDATE_INTERVAL_MS
  if (signupOK && Firebase.ready() && millis() - lastUpdate > UPDATE_INTERVAL_MS) {
    lastUpdate = millis();

    if (gps.location.isValid()) {
      FirebaseJson json;
      json.set("lat", gps.location.lat());
      json.set("lng", gps.location.lng());
      json.set("alt", gps.altitude.isValid() ? gps.altitude.meters() : 0.0);
      json.set("sats", (int)gps.satellites.value());
      json.set("timestamp", (unsigned long)millis() / 1000);
      // Don't overwrite 'find' flag - only set it if not already in DB
      // We only write tracker data fields, not find/alert

      // Use updateNode to patch without overwriting find/alert
      if (Firebase.RTDB.updateNode(&fbdo, "/tracker", &json)) {
        Serial.printf("GPS sent: %.6f, %.6f\n", gps.location.lat(), gps.location.lng());
      } else {
        Serial.println("Firebase write error: " + fbdo.errorReason());
      }
    } else {
      Serial.println("Waiting for GPS fix...");
    }

    // Read 'find' flag - triggers buzzer + LED
    if (Firebase.RTDB.getBool(&fbdo, "/tracker/find")) {
      bool findActive = fbdo.boolData();
      if (findActive) {
        Serial.println("FIND triggered!");
        // Buzzer + LED pattern
        for (int i = 0; i < 3; i++) {
          digitalWrite(BUZZER_PIN, HIGH);
          digitalWrite(LED_PIN, HIGH);
          delay(300);
          digitalWrite(BUZZER_PIN, LOW);
          digitalWrite(LED_PIN, LOW);
          delay(200);
        }
      } else {
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(LED_PIN, LOW);
      }
    }
  }
}
