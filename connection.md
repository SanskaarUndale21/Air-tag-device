# Hardware Connection Guide

Complete wiring guide for the FindIt GPS Tracker hardware.

## Components

- ESP32 DevKit v1 (38-pin or 30-pin)
- NEO-6M GPS Module (comes with antenna)
- Active buzzer (or passive buzzer - active recommended)
- 5mm LED + 220 ohm resistor
- Breadboard and jumper wires
- Micro USB cable (for programming and power)

---

## Wiring Diagram (ASCII)

```
                    ESP32 DevKit
                  +--------------+
     GPS TX ------| GPIO 16 (RX2)|
     GPS RX ------| GPIO 17 (TX2)|
    Buzzer + ------| GPIO 25      |
       LED + ------| GPIO 26      |----[220 ohm]---- LED(+)
                  |              |
     GPS VCC ------| 3.3V or 5V  |
    GPS GND  ------| GND         |-------- GND (common)
                  +--------------+

GPS Module (NEO-6M)          ESP32
+-----+                +----------+
| TX  |--------------->| GPIO 16  |  (RX2 - receives NMEA)
| RX  |<---------------| GPIO 17  |  (TX2 - optional)
| VCC |<---------------| 3.3V/5V  |
| GND |<---------------| GND      |
+-----+

Buzzer (Active)              ESP32
+----------+            +----------+
| + (long) |----------->| GPIO 25  |
| - (short)|----------->| GND      |
+----------+

LED                          ESP32
+------+                +----------+
|  (+) |---[220 ohm]--->| GPIO 26  |
|  (-) |--------------->| GND      |
+------+
```

---

## Step-by-Step Connections

### GPS Module (NEO-6M)

| NEO-6M Pin | ESP32 Pin | Wire Color (suggested) |
|---|---|---|
| TX | GPIO 16 (RX2) | Green |
| RX | GPIO 17 (TX2) | Yellow (optional) |
| VCC | 3.3V or 5V | Red |
| GND | GND | Black |

> Note: The NEO-6M runs on 3.3V logic. Most ESP32 DevKit boards have a 5V pin from USB that's fine for NEO-6M VCC since it has an onboard regulator. TX/RX go directly to GPIO at 3.3V.

### Buzzer

| Buzzer Pin | ESP32 Pin |
|---|---|
| + (positive, longer leg) | GPIO 25 |
| - (negative, shorter leg) | GND |

> Use an **active buzzer** - it makes sound when you apply 3.3V. A passive buzzer needs a PWM signal.

### LED

| Connection | Detail |
|---|---|
| LED (+) anode | GPIO 26 via 220 ohm resistor |
| LED (-) cathode | GND |

> The 220 ohm resistor limits current to ~15mA which is safe for the GPIO and the LED.

---

## Power

The entire circuit runs off the ESP32's USB power (5V input). During operation:
- ESP32 draws ~150-250 mA (WiFi active)
- GPS module draws ~50 mA
- Total: ~300 mA - fine for any USB port or power bank

For portable use, connect a 3.7V LiPo battery via a TP4056 charging module to the ESP32's 5V/VIN pin.

---

## Antenna Placement

The NEO-6M ceramic patch antenna must face the sky for a GPS fix.
- Place the module near a window or outdoors
- Keep away from metal enclosures
- The active ceramic antenna (if using external) should be mounted on the outside of any enclosure

---

## Testing the GPS

Before programming, confirm the GPS module outputs data by connecting GPS TX to ESP32 RX2, opening Serial Monitor at 115200 baud, and checking the GPS passthrough:

```cpp
// Quick test sketch - paste in Arduino IDE
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
}
void loop() {
  while (Serial2.available()) Serial.write(Serial2.read());
}
```

You should see NMEA sentences like:
```
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
```

If you see `$GPGGA,...,0,` the satellite count is 0 - wait for a fix outside.
