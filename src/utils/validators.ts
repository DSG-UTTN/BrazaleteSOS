// 🚨 BrazaleteSOS - Funciones de Validación

import type { EmergencyContact, TwilioConfig, UserConfig } from '../types';
import { PHONE_REGEX } from './constants';

/**
 * Valida un contacto de emergencia
 */
export const validateContact = (contact: Partial<EmergencyContact>): string[] => {
  const errors: string[] = [];
  
  if (!contact.name || contact.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (!contact.phone || contact.phone.trim().length === 0) {
    errors.push('El teléfono es requerido');
  } else if (!PHONE_REGEX.test(contact.phone.replace(/\s/g, ''))) {
    errors.push('Formato de teléfono inválido. Use: +52XXXXXXXXXX');
  }
  
  if (contact.priority === undefined || contact.priority < 1) {
    errors.push('La prioridad debe ser mayor a 0');
  }
  
  if (!contact.relationship) {
    errors.push('La relación es requerida');
  }
  
  return errors;
};

/**
 * Valida configuración de Twilio
 */
export const validateTwilioConfig = (config: Partial<TwilioConfig>): string[] => {
  const errors: string[] = [];
  
  if (!config.accountSid || config.accountSid.trim().length === 0) {
    errors.push('Account SID de Twilio es requerido');
  } else if (!config.accountSid.startsWith('AC')) {
    errors.push('Account SID debe comenzar con "AC"');
  }
  
  if (!config.authToken || config.authToken.trim().length === 0) {
    errors.push('Auth Token de Twilio es requerido');
  }
  
  if (!config.phoneNumber || config.phoneNumber.trim().length === 0) {
    errors.push('Número de teléfono de Twilio es requerido');
  } else if (!/^\+\d{10,15}$/.test(config.phoneNumber)) {
    errors.push('Formato de número de Twilio inválido');
  }
  
  return errors;
};

/**
 * Valida configuración de usuario
 */
export const validateUserConfig = (config: Partial<UserConfig>): string[] => {
  const errors: string[] = [];
  
  if (!config.userName || config.userName.trim().length === 0) {
    errors.push('El nombre de usuario es requerido');
  }
  
  if (!config.userPhone || config.userPhone.trim().length === 0) {
    errors.push('El teléfono del usuario es requerido');
  } else if (!PHONE_REGEX.test(config.userPhone.replace(/\s/g, ''))) {
    errors.push('Formato de teléfono inválido. Use: +52XXXXXXXXXX');
  }
  
  return errors;
};

/**
 * Valida coordenadas GPS
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Normaliza un número de teléfono para Twilio (formato E.164)
 * Remueve espacios, guiones y otros caracteres
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Remover todos los espacios, guiones, paréntesis, etc.
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si no empieza con +, agregarlo
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
};

/**
 * Verifica si la app está lista para funcionar
 */
export const isAppConfigured = (
  twilioConfig?: TwilioConfig,
  userConfig?: UserConfig,
  contacts?: EmergencyContact[],
): { configured: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!twilioConfig || validateTwilioConfig(twilioConfig).length > 0) {
    missing.push('Configuración de Twilio');
  }
  
  if (!userConfig || validateUserConfig(userConfig).length > 0) {
    missing.push('Configuración de usuario');
  }
  
  if (!contacts || contacts.length === 0) {
    missing.push('Contactos de emergencia');
  }
  
  return {
    configured: missing.length === 0,
    missing,
  };
};
