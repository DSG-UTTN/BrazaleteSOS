// 🚨 BrazaleteSOS - Definiciones de Tipos TypeScript

/**
 * Contacto de emergencia
 */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string; // Formato: +52XXXXXXXXXX
  priority: number; // 1 = más importante
  relationship: 'family' | 'friend' | 'medical' | 'emergency';
  photo?: string;
  notes?: string;
}

/**
 * Ubicación GPS
 */
export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  timestamp: number;
  address?: string; // Dirección aproximada
}

/**
 * Configuración de Twilio
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Número de Twilio
}

/**
 * Configuración de usuario
 */
export interface UserConfig {
  userId: string;
  userName: string;
  userPhone: string;
  homeAddress?: string;
}

/**
 * Configuración del protocolo de emergencia
 */
export interface ProtocolConfig {
  retryAttempts: number; // Intentos por contacto
  retryDelay: number; // Milisegundos entre reintentos
  escalationDelay: number; // Milisegundos antes del siguiente contacto
  callTimeout: number; // Timeout para llamadas
  smsEnabled: boolean; // Enviar SMS
  callEnabled: boolean; // Hacer llamadas
}

/**
 * Configuración BLE
 */
export interface BLEConfig {
  brazaleteDeviceId?: string;
  autoReconnect: boolean;
  scanTimeout: number;
}

/**
 * Configuración completa de la app
 */
export interface AppConfig {
  twilio: TwilioConfig;
  user: UserConfig;
  protocol: ProtocolConfig;
  ble: BLEConfig;
}

/**
 * Estado de una llamada
 */
export type CallStatus = 
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

/**
 * Resultado de una llamada
 */
export interface CallResult {
  callSid: string;
  contact: EmergencyContact;
  status: CallStatus;
  answered: boolean;
  duration: number; // segundos
  timestamp: number;
  busy?: boolean;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Resultado de un SMS
 */
export interface SMSResult {
  messageSid: string;
  contact: EmergencyContact;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: number;
  errorMessage?: string;
  errorCode?: number;
}

/**
 * Alerta SOS completa
 */
export interface SOSAlert {
  id: string;
  timestamp: number;
  location: Location;
  contacts: EmergencyContact[];
  callResults: CallResult[];
  smsResults: SMSResult[];
  status: 'in-progress' | 'completed' | 'failed';
  deviceId?: string; // ID del brazalete
  batteryLevel?: number;
}

/**
 * Mensaje BLE del brazalete
 */
export interface BraceletMessage {
  user_id: string;
  device_id: string;
  timestamp: string;
  battery_level: number;
  alert_type: 'SOS' | 'LOW_BATTERY' | 'HEARTBEAT';
}

/**
 * Estado de conexión BLE
 */
export type BLEConnectionStatus = 
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error';
