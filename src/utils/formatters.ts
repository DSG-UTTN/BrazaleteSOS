// 🚨 BrazaleteSOS - Funciones de Formato

/**
 * Formatea un número de teléfono mexicano
 * Ejemplo: +525512345678 -> +52 55 1234 5678
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remover espacios y caracteres especiales excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si ya tiene formato correcto
  if (cleaned.startsWith('+52') && cleaned.length === 13) {
    return `+52 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }
  
  return phone;
};

/**
 * Valida formato de número mexicano
 */
export const isValidMexicanPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return /^\+52\d{10}$/.test(cleaned);
};

/**
 * Formatea coordenadas GPS
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Formatea duración en segundos a formato legible
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Formatea nivel de batería
 */
export const formatBatteryLevel = (level: number): string => {
  return `${level}%`;
};

/**
 * Trunca texto largo
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Obtiene iniciales de un nombre
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Formatea dirección para Google Maps URL
 */
export const formatGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Convierte timestamp a formato relativo (hace 5 minutos)
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7) return `Hace ${days} días`;
  
  return formatDateTime(timestamp);
};
