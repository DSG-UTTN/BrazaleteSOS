// 🚨 BrazaleteSOS - Servicio de SMS con Twilio

import axios from 'axios';
import type { EmergencyContact, Location, SMSResult, TwilioConfig } from '../types';
import { SMS_TEMPLATE } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import { getTwilioApiUrl, getTwilioAuthHeader } from '../config/twilio.config';
import { normalizePhoneNumber } from '../utils/validators';

class TwilioSMSService {
  /**
   * Enviar SMS de emergencia a un contacto
   */
  async sendEmergencySMS(
    contact: EmergencyContact,
    location: Location,
    userName: string,
    twilioConfig: TwilioConfig,
  ): Promise<SMSResult> {
    try {
      console.log(`📱 Enviando SMS a ${contact.name} (${contact.phone})...`);

      // Construir mensaje
      const address = location.address || `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`;
      const timestamp = formatDateTime(location.timestamp);
      const messageBody = SMS_TEMPLATE(
        userName,
        address,
        location.latitude,
        location.longitude,
        timestamp,
      );

      // Normalizar números de teléfono (remover espacios, guiones, etc.)
      const toNumber = normalizePhoneNumber(contact.phone);
      const fromNumber = normalizePhoneNumber(twilioConfig.phoneNumber);
      
      console.log(`📱 Enviando SMS de ${fromNumber} a ${toNumber}`);
      
      // Preparar datos para Twilio
      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', fromNumber);
      params.append('Body', messageBody);

      // URL de la API de Twilio
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Messages.json`;

      // Headers con autenticación
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      console.log('📤 Enviando SMS a Twilio:', {
        url,
        to: toNumber,
        from: fromNumber,
        bodyLength: messageBody.length
      });

      // Enviar SMS - IMPORTANTE: convertir params a string
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
        timeout: 10000, // 10 segundos
      });

      console.log(`✅ SMS enviado a ${contact.name}:`, response.data.sid);

      return {
        messageSid: response.data.sid,
        contact,
        status: 'sent',
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error enviando SMS a ${contact.name}:`, error.message);
      
      // Log detallado del error de Twilio
      if (error.response) {
        console.error('❌ Respuesta de Twilio:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
        console.error('❌ Detalles del request:', {
          to: contact.phone,
          from: twilioConfig.phoneNumber,
          accountSid: twilioConfig.accountSid,
        });
      }

      // Detectar error de Trial Account
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      
      if (errorCode === 21608) {
        console.warn('⚠️ CUENTA TRIAL: El número no está verificado.');
        console.warn('💡 Solución: Verifica el número en https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      }
      
      return {
        messageSid: '',
        contact,
        status: 'failed',
        timestamp: Date.now(),
        errorMessage,
        errorCode,
      };
    }
  }

  /**
   * Enviar SMS a múltiples contactos simultáneamente
   */
  async sendBulkEmergencySMS(
    contacts: EmergencyContact[],
    location: Location,
    userName: string,
    twilioConfig: TwilioConfig,
  ): Promise<SMSResult[]> {
    console.log(`📱 Enviando SMS masivo a ${contacts.length} contactos...`);

    // Enviar todos los SMS en paralelo
    const promises = contacts.map(contact =>
      this.sendEmergencySMS(contact, location, userName, twilioConfig),
    );

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.status === 'sent').length;
    console.log(`✅ SMS enviados: ${successCount}/${contacts.length}`);

    return results;
  }

  /**
   * Verificar estado de un SMS
   */
  async checkSMSStatus(
    messageSid: string,
    twilioConfig: TwilioConfig,
  ): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Messages/${messageSid}.json`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader,
        },
      });

      const status = response.data.status;
      
      switch (status) {
        case 'delivered':
          return 'delivered';
        case 'sent':
        case 'queued':
        case 'sending':
          return 'sent';
        default:
          return 'failed';
      }
    } catch (error) {
      console.error('❌ Error verificando estado de SMS:', error);
      return 'failed';
    }
  }

  /**
   * Obtener historial de mensajes enviados
   */
  async getMessageHistory(
    twilioConfig: TwilioConfig,
    limit: number = 20,
  ): Promise<any[]> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Messages.json?PageSize=${limit}`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader,
        },
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('❌ Error obteniendo historial de mensajes:', error);
      return [];
    }
  }
}

// Exportar instancia única (Singleton)
export default new TwilioSMSService();
