// Feed keys según el código ESP32
export const FEED_KEYS = {
  SOUND_SENSOR: 'sound-sensor',
  GAS_SENSOR: 'gas-sensor',
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  MOTION_DETECTOR: 'motion-detector',
  ULTRASONIC_DISTANCE: 'ultrasonic-distance',
  ULTRASONIC_DISTANCE_2: 'ultrasonic-distance2',
  NFC_UID: 'nfc-uid',
  SERVO_ANGLE: 'servo-angle'
} as const;

// Configuración de feeds con metadatos
export const FEED_CONFIG = {
  [FEED_KEYS.SOUND_SENSOR]: {
    name: 'Sensor de Sonido',
    description: 'Nivel de ruido detectado por el micrófono',
    unit: 'dB'
  },
  [FEED_KEYS.GAS_SENSOR]: {
    name: 'Sensor de Gas MQ-2',
    description: 'Calidad del aire - detección de gases',
    unit: 'PPM'
  },
  [FEED_KEYS.TEMPERATURE]: {
    name: 'Temperatura',
    description: 'Temperatura ambiente medida por DHT11',
    unit: '°C'
  },
  [FEED_KEYS.HUMIDITY]: {
    name: 'Humedad',
    description: 'Humedad relativa medida por DHT11',
    unit: '%'
  },
  [FEED_KEYS.MOTION_DETECTOR]: {
    name: 'Detector de Movimiento',
    description: 'Detección de presencia mediante sensor PIR',
    unit: 'bool'
  },
  [FEED_KEYS.ULTRASONIC_DISTANCE]: {
    name: 'Distancia Ultrasónica - Espacio 1',
    description: 'Distancia medida por sensor HC-SR04 para espacio de estacionamiento 1',
    unit: 'cm'
  },
  [FEED_KEYS.ULTRASONIC_DISTANCE_2]: {
    name: 'Distancia Ultrasónica - Espacio 2',
    description: 'Distancia medida por sensor HC-SR04 para espacio de estacionamiento 2',
    unit: 'cm'
  },
  [FEED_KEYS.NFC_UID]: {
    name: 'Lector NFC',
    description: 'UID de tarjetas NFC leídas por RC522',
    unit: 'string'
  },
  [FEED_KEYS.SERVO_ANGLE]: {
    name: 'Ángulo del Servo',
    description: 'Posición angular del servomotor',
    unit: '°'
  }
} as const;

// Constantes para el procesamiento de datos
export const PARKING_CONFIG = {
  OCCUPIED_MAX_DISTANCE: 15, // cm - distancia máxima para considerar ocupado
  FREE_MIN_DISTANCE: 16      // cm - distancia mínima para considerar libre
} as const;

export type FeedKey = typeof FEED_KEYS[keyof typeof FEED_KEYS];
