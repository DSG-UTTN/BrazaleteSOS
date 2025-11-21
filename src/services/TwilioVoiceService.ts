// 🚨 BrazaleteSOS - Servicio de Llamadas con Twilio

import axios from 'axios';
import type { EmergencyContact, Location, CallResult, CallStatus, TwilioConfig } from '../types';
import { VOICE_MESSAGES } from '../utils/constants';
import { getTwilioApiUrl, getTwilioAuthHeader } from '../config/twilio.config';
import { normalizePhoneNumber } from '../utils/validators';

class TwilioVoiceService {
  /**
   * Hacer llamada de emergencia a un contacto
   */
  async makeEmergencyCall(
    contact: EmergencyContact,
    location: Location,
    userName: string,
    twilioConfig: TwilioConfig,
  ): Promise<CallResult> {
    try {
      console.log(`📞 Llamando a ${contact.name} (${contact.phone})...`);

      // Construir TwiML (mensaje de voz)
      const address = location.address || `coordenadas ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
      const twiml = VOICE_MESSAGES.EMERGENCY_ALERT(
        userName,
        address,
        location.latitude,
        location.longitude,
      );

      // Normalizar números de teléfono (remover espacios, guiones, etc.)
      const toNumber = normalizePhoneNumber(contact.phone);
      const fromNumber = normalizePhoneNumber(twilioConfig.phoneNumber);
      
      console.log(`📞 Llamando de ${fromNumber} a ${toNumber}`);
      
      // Preparar datos para Twilio
      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', fromNumber);
      params.append('Twiml', twiml);
      params.append('Timeout', '30'); // Timeout en segundos
      params.append('Record', 'true'); // Grabar la llamada

      // URL de la API de Twilio
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Calls.json`;

      // Headers con autenticación
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      console.log('📤 Enviando a Twilio:', {
        url,
        to: toNumber,
        from: fromNumber,
        body: params.toString()
      });

      // Hacer la llamada - IMPORTANTE: convertir params a string
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
        timeout: 15000, // 15 segundos
      });

      console.log(`✅ Llamada iniciada a ${contact.name}:`, response.data.sid);

      return {
        callSid: response.data.sid,
        contact,
        status: response.data.status as CallStatus,
        answered: false, // Se actualizará al monitorear
        duration: 0,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`❌ Error llamando a ${contact.name}:`, error.message);
      
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
      const errorMessage = error.response?.data?.message || error.message;
      
      if (errorCode === 21219) {
        console.warn('⚠️ CUENTA TRIAL: El número no está verificado.');
        console.warn('💡 Solución: Verifica el número en https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      }
      
      return {
        callSid: '',
        contact,
        status: 'failed',
        answered: false,
        duration: 0,
        timestamp: Date.now(),
        errorCode,
        errorMessage,
      };
    }
  }

  /**
   * Obtener estado actual de una llamada
   */
  async getCallStatus(
    callSid: string,
    twilioConfig: TwilioConfig,
  ): Promise<{ status: CallStatus; duration: number }> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Calls/${callSid}.json`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader,
        },
      });

      return {
        status: response.data.status as CallStatus,
        duration: parseInt(response.data.duration || '0', 10),
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de llamada:', error);
      return {
        status: 'failed',
        duration: 0,
      };
    }
  }

  /**
   * Cancelar una llamada en curso
   */
  async cancelCall(
    callSid: string,
    twilioConfig: TwilioConfig,
  ): Promise<boolean> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Calls/${callSid}.json`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const params = new URLSearchParams();
      params.append('Status', 'canceled');

      await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
      });

      console.log(`✅ Llamada cancelada: ${callSid}`);
      return true;
    } catch (error) {
      console.error('❌ Error cancelando llamada:', error);
      return false;
    }
  }

  /**
   * Obtener historial de llamadas
   */
  async getCallHistory(
    twilioConfig: TwilioConfig,
    limit: number = 20,
  ): Promise<any[]> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Calls.json?PageSize=${limit}`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader,
        },
      });

      return response.data.calls || [];
    } catch (error) {
      console.error('❌ Error obteniendo historial de llamadas:', error);
      return [];
    }
  }

  /**
   * Verificar si una llamada fue respondida (basado en duración)
   */
  isCallAnswered(duration: number, status: CallStatus): boolean {
    // Si duró más de 10 segundos y completó, asumimos que fue respondida
    if (status === 'completed' && duration > 10) {
      return true;
    }
    
    // Si está en progreso, aún no sabemos
    if (status === 'in-progress') {
      return false;
    }
    
    // Cualquier otro caso (busy, no-answer, failed, canceled)
    return false;
  }

  /**
   * Obtener grabación de una llamada
   */
  async getCallRecording(
    callSid: string,
    twilioConfig: TwilioConfig,
  ): Promise<string | null> {
    try {
      const url = `${getTwilioApiUrl(twilioConfig.accountSid)}/Calls/${callSid}/Recordings.json`;
      
      const authHeader = getTwilioAuthHeader(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (response.data.recordings && response.data.recordings.length > 0) {
        const recordingSid = response.data.recordings[0].sid;
        return `https://api.twilio.com${response.data.recordings[0].uri.replace('.json', '.mp3')}`;
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo grabación:', error);
      return null;
    }
  }
}

// Exportar instancia única (Singleton)
export default new TwilioVoiceService();
