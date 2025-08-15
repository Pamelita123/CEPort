#include <Arduino.h>
#include <WiFi.h>
#include "AdafruitIO_WiFi.h"
#include "DHT.h"
#include <SPI.h>
#include <MFRC522.h>
#include <NewPing.h>

// ————— WiFi y Adafruit IO —————
#define WIFI_SSID    "777"
#define WIFI_PASS    "12345677"
#define IO_USERNAME  "su user"
#define IO_KEY       "sy key de adafruit"

AdafruitIO_WiFi io(IO_USERNAME, IO_KEY, WIFI_SSID, WIFI_PASS);

// ————— Pines —————
#define SOUND_PIN   34
#define MQ2_PIN     35
#define DHT_PIN     26
#define DHT_TYPE    DHT11
#define PIR_PIN     25

#define TRIG_PIN    27
#define ECHO_PIN    14

#define TRIG_PIN2    4
#define ECHO_PIN2    16

#define MAX_DIST    200
#define SS_PIN      5
#define RST_PIN     22
#define SERVO_PIN   32

// ————— Objetos y librerías —————
DHT dht(DHT_PIN, DHT_TYPE);
NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DIST);
NewPing sonar2(TRIG_PIN2, ECHO_PIN2, MAX_DIST);
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ————— Configuración PWM para servo —————
const int servoChannel = 0;  // Canal PWM
const int servoFreq = 50;    // 50Hz para servos
const int servoResolution = 16;  // Resolución de 16 bits

// ————— Feeds —————
AdafruitIO_Feed *soundFeed    = io.feed("sound-sensor");
AdafruitIO_Feed *gasFeed      = io.feed("gas-sensor");
AdafruitIO_Feed *tempFeed     = io.feed("temperature");
AdafruitIO_Feed *humFeed      = io.feed("humidity");
AdafruitIO_Feed *motionFeed   = io.feed("motion-detector");
AdafruitIO_Feed *distFeed     = io.feed("ultrasonic-distance");
AdafruitIO_Feed *distFeed2    = io.feed("ultrasonic-distance2");
AdafruitIO_Feed *nfcFeed      = io.feed("nfc-uid");
AdafruitIO_Feed *servoFeed    = io.feed("servo-angle");

// ————— Guarda el último UID leído —————
String lastUID = "";

// ————— Control de tiempo para envío a Adafruit —————
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 60000; // 60 segundos

// ————— Variables para almacenar últimas lecturas —————
int lastSoundValue = 0;
int lastGasValue = 0;
float lastTemperature = 0;
float lastHumidity = 0;
int lastMotionValue = 0;
unsigned int lastDistance = 0;
unsigned int lastDistance2 = 0;

// ————— Función para controlar servo con PWM —————
void moverServo(int grados) {
  // Convertir grados (0-180) a duty cycle
  // Para servos: 1ms = 0°, 1.5ms = 90°, 2ms = 180°
  // Con 50Hz: periodo = 20ms
  // Duty cycle = (1ms + (grados/180) * 1ms) / 20ms
  int minPulse = 1638;   // ~1ms en duty cycle (16 bits)
  int maxPulse = 3277;   // ~2ms en duty cycle (16 bits)
  int dutyCycle = minPulse + (grados * (maxPulse - minPulse)) / 180;
  
  ledcWrite(servoChannel, dutyCycle);
  Serial.printf("🎛 Servo movido a %d° (duty: %d)\n", grados, dutyCycle);
}
// ————— Funciones de lectura (solo consola) —————
void leerSonido() {
  int raw = analogRead(SOUND_PIN);
  int val = raw - 3900;
  if (val < 0) val += 100;
  lastSoundValue = val;  // guardamos el valor
  Serial.printf("🔊 Sonido: %d\n", val);
}
void leerMQ2() {
  int gas = analogRead(MQ2_PIN);
  lastGasValue = gas;  // guardamos el valor
  Serial.printf("💨 Gas: %d\n", gas);
}

void leerDHT() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) lastTemperature = t;  // guardamos el valor
  if (!isnan(h)) lastHumidity = h;     // guardamos el valor
  Serial.printf("🌡️ Temp: %.1f°C / 💧 Hum: %.1f%%\n", t, h);
}

void leerMovimiento() {
  int m = digitalRead(PIR_PIN);
  lastMotionValue = m;  // guardamos el valor
  Serial.printf("🚶 Movimiento: %d\n", m);
}

void leerUltrasonido() {
  delay(50);
  unsigned int d = sonar.ping_cm();
  lastDistance = d;  // guardamos el valor
  Serial.printf("📏 Dist: %d cm\n", d);
}
void leerUltrasonido2() {
  delay(50);
  unsigned int p = sonar2.ping_cm();
  lastDistance2 = p;  // guardamos el valor
  Serial.printf("📏 Dist2: %d cm\n", p);
}

void leerNFC() {
  // Si hay nueva tarjeta, actualizamos lastUID y movemos el servo
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    lastUID = uid;  // guardamos el último UID
    Serial.println("💳 NFC UID nuevo detectado: " + lastUID);

    // Movemos el servo a 180°
    moverServo(180);
    servoFeed->save(180);
    Serial.println("🎛 Servo moved to 180°");

    // Esperamos 5 segundos
    delay(5000);

    // Regresamos el servo a 0°
    moverServo(0);
    servoFeed->save(0);
    Serial.println("🎛 Servo returned to 0°");

    delay(500);  // para evitar lecturas duplicadas
  }
  
  // Solo información de estado en consola (no enviamos a Adafruit en cada lectura)
  if (lastUID.length() > 0) {
    Serial.println("🪪 Estado NFC: Última tarjeta leída -> " + lastUID);
  } else {
    Serial.println("🪪 Estado NFC: Aún no se leyó ninguna tarjeta");
  }
}

void enviarDatosAdafruit() {
  // Solo enviamos a Adafruit cada minuto
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= sendInterval) {
    Serial.println("📤 Enviando todos los datos a Adafruit...");
    
    // Enviar todos los sensores
    soundFeed->save(lastSoundValue);
    gasFeed->save(lastGasValue);
    tempFeed->save(lastTemperature);
    humFeed->save(lastHumidity);
    motionFeed->save(lastMotionValue);
    distFeed->save(lastDistance);
    distFeed2->save(lastDistance2);
    
    // Enviar NFC solo si hay datos
    if (lastUID.length() > 0) {
      nfcFeed->save(lastUID);
      Serial.println("📤 ✅ Datos enviados - NFC UID: " + lastUID);
    } else {
      Serial.println("📤 ✅ Datos enviados - Sin tarjeta NFC");
    }
    
    Serial.printf("📤 ✅ Enviados: Sonido=%d, Gas=%d, Temp=%.1f°C, Hum=%.1f%%, Mov=%d, Dist=%dcm, Dist2=%dcm\n", 
                  lastSoundValue, lastGasValue, lastTemperature, lastHumidity, 
                  lastMotionValue, lastDistance, lastDistance2);
    
    lastSendTime = currentTime;
  }
}

// ————— Setup y loop —————
void setup() {
  Serial.begin(9600);
  delay(1000);

  dht.begin();
  pinMode(PIR_PIN, INPUT);
  SPI.begin();
  mfrc522.PCD_Init();

  // Configuración del PWM para servo
  ledcSetup(servoChannel, servoFreq, servoResolution);
  ledcAttachPin(SERVO_PIN, servoChannel);
  moverServo(0);  // Posición inicial en 0°
  Serial.println("🎛 Servo PWM inicializado en 0°");

  // Conexión a Adafruit IO
  io.connect();
  while (io.status() < AIO_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Conectado a Adafruit IO");
}

void loop() {
  io.run();

  // Lecturas en orden
  leerSonido();
  leerMQ2();
  leerDHT();
  leerMovimiento();
  leerUltrasonido();
  leerUltrasonido2();
  leerNFC();

  // Envío a Adafruit solo cada minuto
  enviarDatosAdafruit();

  // Esperamos 5s para lecturas más frecuentes en consola (locales no a adafruit)
  delay(5000);
}
