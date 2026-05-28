#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

// ── Pins ─────────────────────────────────────
#define GPS_RX    16
#define GPS_TX    17
#define BUZZER    25
#define LED_GREEN  2
#define LED_RED   15

// ── WiFi + Firebase ──────────────────────────
#define WIFI_SSID     ""
#define WIFI_PASS     ""
#define FIREBASE_HOST ""
#define FIREBASE_AUTH ""

// ── Objects ──────────────────────────────────
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;
FirebaseData fbData;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastSend = 0;
const long SEND_INTERVAL = 5000; // send every 5 seconds

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  pinMode(BUZZER, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Startup blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH); delay(100);
    digitalWrite(LED_GREEN, LOW);  delay(100);
  }

  // Connect WiFi
  Serial.print("Connecting WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
    digitalWrite(LED_RED, !digitalRead(LED_RED)); // blink red while connecting
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
  digitalWrite(LED_RED, LOW);

  // Firebase setup
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("System ready. Waiting for GPS fix...");
}

void loop() {
  // Feed GPS parser
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  // GPS fix indicator
  if (gps.location.isValid()) {
    digitalWrite(LED_GREEN, HIGH); // solid = fix
  } else {
    // Blink slowly while searching
    digitalWrite(LED_GREEN, (millis() / 800) % 2);
  }

  // Send GPS to Firebase every interval
  if (gps.location.isValid() && millis() - lastSend > SEND_INTERVAL) {
    lastSend = millis();

    double lat = gps.location.lat();
    double lng = gps.location.lng();
    float  alt = gps.altitude.meters();
    int    sat = gps.satellites.value();

    Serial.printf("GPS: %.6f, %.6f | Sats: %d\n", lat, lng, sat);

    // Push to Firebase
    Firebase.setDouble(fbData, "/tracker/lat", lat);
    Firebase.setDouble(fbData, "/tracker/lng", lng);
    Firebase.setFloat(fbData,  "/tracker/alt", alt);
    Firebase.setInt(fbData,    "/tracker/sats", sat);
    Firebase.setInt(fbData,    "/tracker/timestamp", millis());
  }

  // Listen for "Find My Device" command from Firebase
  if (Firebase.getBool(fbData, "/tracker/find") && fbData.boolData()) {
    triggerFind();
    Firebase.setBool(fbData, "/tracker/find", false); // reset flag
  }

  // Check geo-fence breach from Firebase command
  if (Firebase.getBool(fbData, "/tracker/alert") && fbData.boolData()) {
    triggerAlert();
  }
}

// Called when web app presses "Find My Device"
void triggerFind() {
  Serial.println("FIND triggered!");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER, 1000, 150);  // 1kHz beep
    delay(200);
    digitalWrite(LED_RED, LOW);
    delay(200);
  }
}

// Called on geo-fence breach
void triggerAlert() {
  Serial.println("ALERT! Device out of range!");
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER, 2000, 100);
    delay(150);
    digitalWrite(LED_RED, LOW);
    delay(150);
  }
}