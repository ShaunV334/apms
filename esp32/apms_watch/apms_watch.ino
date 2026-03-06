#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <MPU6050.h>
#include <DFRobot_MAX30102.h>
#include <math.h>

// ================= OLED =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ================= MAX30102 =================
DFRobot_MAX30102 particleSensor;
int32_t SPO2 = 0;
int8_t SPO2Valid = 0;
int32_t heartRate = 0;
int8_t heartRateValid = 0;

// ================= HEART FILTERING =================
#define RATE_SIZE 6
int rateArray[RATE_SIZE];
byte rateSpot = 0;
int validSamples = 0;

float smoothedBPM = 0;
int finalBPM = 0;
int lastStableBPM = 0;

#define EMA_ALPHA 0.3      // lower = smoother
#define IR_THRESHOLD 50000 // finger detection threshold
#define MOTION_THRESHOLD 20000

// ================= MPU6050 =================
MPU6050 mpu;
int16_t ax, ay, az;
float accMagnitude = 0;

// ================= FALL DETECTION =================
#define FREE_FALL_THRESHOLD 5000
#define IMPACT_THRESHOLD    30000
#define STILL_MIN           14000
#define STILL_MAX           18000
#define STILL_TIME          3000

bool possibleFall = false;
unsigned long impactTime = 0;
bool fallDetected = false;

// =================================================

void setup()
{
  Serial.begin(115200);
  Wire.begin(21, 22);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (1);
  }

  display.setTextSize(1);
  display.setTextColor(WHITE);

  while (!particleSensor.begin()) {
    Serial.println("MAX30102 not found");
    delay(1000);
  }

  particleSensor.sensorConfiguration(
      80,
      SAMPLEAVG_4,
      MODE_MULTILED,
      SAMPLERATE_100,
      PULSEWIDTH_411,
      ADCRANGE_16384
  );

  mpu.initialize();
  if (!mpu.testConnection()) {
    while (1);
  }
}

// =================================================
// READ MPU
// =================================================

void readMPU()
{
  mpu.getAcceleration(&ax, &ay, &az);
  accMagnitude = sqrt((long)ax * ax + (long)ay * ay + (long)az * az);

  // Fall detection
  if (accMagnitude < FREE_FALL_THRESHOLD)
    possibleFall = true;

  if (possibleFall && accMagnitude > IMPACT_THRESHOLD) {
    impactTime = millis();
    possibleFall = false;
  }

  if (impactTime != 0 && millis() - impactTime < STILL_TIME) {
    if (accMagnitude > STILL_MIN && accMagnitude < STILL_MAX) {
      fallDetected = true;
      impactTime = 0;
    }
  }

  if (impactTime != 0 && millis() - impactTime > STILL_TIME)
    impactTime = 0;
}

// =================================================
// SMART HEART RATE FILTER
// =================================================

void readMAX30102()
{
  long irValue = particleSensor.getIR();

  particleSensor.heartrateAndOxygenSaturation(
      &SPO2,
      &SPO2Valid,
      &heartRate,
      &heartRateValid
  );

  // Reject if no finger
  if (irValue < IR_THRESHOLD)
    return;

  // Reject if too much motion
  if (accMagnitude > MOTION_THRESHOLD)
    return;

  // Accept only realistic BPM
  if (heartRateValid && heartRate > 45 && heartRate < 170)
  {
    // Moving average
    rateArray[rateSpot++] = heartRate;
    rateSpot %= RATE_SIZE;

    if (validSamples < RATE_SIZE)
      validSamples++;

    int sum = 0;
    for (byte i = 0; i < validSamples; i++)
      sum += rateArray[i];

    float avg = sum / validSamples;

    // Exponential smoothing
    if (smoothedBPM == 0)
      smoothedBPM = avg;
    else
      smoothedBPM = EMA_ALPHA * avg + (1 - EMA_ALPHA) * smoothedBPM;

    finalBPM = (int)smoothedBPM;
    lastStableBPM = finalBPM;
  }
  else
  {
    finalBPM = lastStableBPM;
  }
}

// =================================================
// DISPLAY
// =================================================

void updateDisplay()
{
  display.clearDisplay();

  display.setCursor(0, 0);
  display.println("SMART HEALTH WATCH");

  display.setCursor(0, 12);
  display.print("HR: ");
  display.print(finalBPM);
  display.print(" bpm");

  display.setCursor(0, 24);
  display.print("SpO2: ");
  if (SPO2Valid)
    display.print(SPO2);
  else
    display.print("--");
  display.print(" %");

  display.setCursor(0, 36);
  display.print("Motion: ");
  display.print((int)accMagnitude);

  display.setCursor(0, 52);
  if (fallDetected)
    display.print("!!! FALL DETECTED !!!");
  else
    display.print("Status: Normal");

  display.display();
}

// =================================================

void loop()
{
  readMPU();
  readMAX30102();
  updateDisplay();

  if (fallDetected) {
    Serial.println("FALL DETECTED!");
    delay(5000);
    fallDetected = false;
  }

  delay(200);
}