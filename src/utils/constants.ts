// 🚨 BrazaleteSOS - Constantes

/**
 * Claves para AsyncStorage
 */
export const STORAGE_KEYS = {
  CONTACTS: '@BrazaleteSOS:contacts',
  CONFIG: '@BrazaleteSOS:config',
  ALERTS_HISTORY: '@BrazaleteSOS:alerts_history',
  USER_CONFIG: '@BrazaleteSOS:user_config',
  TWILIO_CONFIG: '@BrazaleteSOS:twilio_config',
};

/**
 * Configuración por defecto del protocolo
 */
export const DEFAULT_PROTOCOL_CONFIG = {
  retryAttempts: 2,
  retryDelay: 30000, // 30 segundos
  escalationDelay: 5000, // 5 segundos entre contactos
  callTimeout: 30000, // 30 segundos
  smsEnabled: true,
  callEnabled: true,
};

/**
 * Configuración por defecto BLE
 */
export const DEFAULT_BLE_CONFIG = {
  autoReconnect: true,
  scanTimeout: 30000, // 30 segundos
};

/**
 * Características BLE del brazalete
 */
export const BLE_CONSTANTS = {
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  CHARACTERISTIC_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  DEVICE_NAME_PREFIX: 'BrazaleteSOS',
};

/**
 * Mensajes de voz para Twilio (español México)
 */
export const VOICE_MESSAGES = {
  EMERGENCY_ALERT: (userName: string, address: string, lat: number, lng: number) => `
    <Response>
      <Say voice="Polly.Mia" language="es-MX">
        EMERGENCIA. ALERTA S O S. ${userName} necesita ayuda urgente.
        Ubicación aproximada: ${address}.
        Coordenadas: Latitud ${lat.toFixed(4)}, Longitud ${lng.toFixed(4)}.
        Presione cualquier tecla para confirmar que recibió este mensaje.
      </Say>
      <Gather numDigits="1" timeout="15">
        <Say voice="Polly.Mia" language="es-MX">
          Presione cualquier número para confirmar.
        </Say>
      </Gather>
      <Say voice="Polly.Mia" language="es-MX">
        No se detectó confirmación. Fin del mensaje.
      </Say>
    </Response>
  `,
};

/**
 * Plantilla de SMS
 */
export const SMS_TEMPLATE = (
  userName: string,
  address: string,
  lat: number,
  lng: number,
  timestamp: string,
) => `🚨 EMERGENCIA SOS!

${userName} necesita ayuda urgente.

📍 Ubicación:
${address}
https://www.google.com/maps?q=${lat},${lng}

⏰ ${timestamp}

Este mensaje fue enviado automáticamente por BrazaleteSOS.`;

/**
 * Duración mínima de llamada para considerar que fue respondida (segundos)
 */
export const MIN_CALL_DURATION_ANSWERED = 10;

/**
 * Intervalo de chequeo de estado de llamada (milisegundos)
 */
export const CALL_STATUS_CHECK_INTERVAL = 2000;

/**
 * Colores del tema
 */
export const COLORS = {
  primary: '#E53935', // Rojo emergencia
  secondary: '#FF5722',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

/**
 * Tamaños de fuente
 */
export const FONT_SIZES = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
};

/**
 * Espaciado
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Formato de números de teléfono México
 */
export const PHONE_REGEX = /^\+52\d{10}$/;

/**
 * Máximo número de contactos permitidos
 */
export const MAX_CONTACTS = 5;

/**
 * Máximo número de alertas en historial
 */
export const MAX_ALERTS_HISTORY = 50;
