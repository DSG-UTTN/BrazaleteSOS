// 🚨 BrazaleteSOS - Configuración de Twilio

import * as base64 from 'base-64';

/**
 * CONFIGURACIÓN DE TWILIO
 * 
 * IMPORTANTE: Para obtener estas credenciales:
 * 1. Ve a https://console.twilio.com/
 * 2. Inicia sesión con tu cuenta
 * 3. Copia el "Account SID" y "Auth Token" del dashboard
 * 4. Ve a Phone Numbers y copia tu número de Twilio
 * 
 * PARA MÉXICO:
 * - Los números deben estar en formato E.164: +52XXXXXXXXXX
 * - Twilio tiene disponibilidad en México
 * - Costo aproximado: $0.013/min llamada, $0.0075/SMS
 * 
 * ⚠️ SEGURIDAD:
 * - Para PRODUCCIÓN: NO guardes credenciales aquí
 * - Usa un backend API para manejar Twilio
 * - Para PROTOTIPO: Está bien usarlas directamente
 */

export const TWILIO_CONFIG = {
  // Reemplaza con tus credenciales reales
  ACCOUNT_SID: '',
  AUTH_TOKEN: '',
  PHONE_NUMBER: '', // Tu número de Twilio
  
  // URLs de la API de Twilio
  API_BASE_URL: 'https://api.twilio.com/2010-04-01',
  
  // Configuración para México
  COUNTRY_CODE: '+52',
  COUNTRY: 'MX',
  LANGUAGE: 'es-MX',
  
  // Voz para mensajes (Twilio Polly)
  VOICE: 'Polly.Mia', // Voz femenina en español
  VOICE_MALE: 'Polly.Miguel', // Voz masculina en español
};

/**
 * Obtener credenciales de Twilio
 * En el futuro, esto puede venir de StorageService o de una API
 */
export const getTwilioCredentials = async () => {
  // Por ahora retornamos la configuración hardcodeada
  // TODO: Implementar carga desde StorageService
  return TWILIO_CONFIG;
};

/**
 * Construir URL base para API de Twilio
 */
export const getTwilioApiUrl = (accountSid: string) => {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
};

/**
 * Crear Authorization header para Twilio
 */
export const getTwilioAuthHeader = (accountSid: string, authToken: string): string => {
  const credentials = `${accountSid}:${authToken}`;
  const base64Credentials = base64.encode(credentials);
  return `Basic ${base64Credentials}`;
};
