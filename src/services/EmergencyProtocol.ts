// 🚨 BrazaleteSOS - Protocolo de Emergencia

import type {
  EmergencyContact,
  Location,
  SOSAlert,
  CallResult,
  SMSResult,
  TwilioConfig,
  ProtocolConfig,
} from '../types';
import TwilioVoiceService from './TwilioVoiceService';
import TwilioSMSService from './TwilioSMSService';
import CallMonitoringService from './CallMonitoringService';
import GeolocationService from './GeolocationService';
import StorageService from './StorageService';
import uuid from 'react-native-uuid';

class EmergencyProtocol {
  private isExecuting: boolean = false;
  private currentAlert: SOSAlert | null = null;

  /**
   * Ejecutar protocolo completo de emergencia
   */
  async execute(
    contacts: EmergencyContact[],
    userName: string,
    twilioConfig: TwilioConfig,
    protocolConfig: ProtocolConfig,
    onProgress?: (message: string, data?: any) => void,
  ): Promise<SOSAlert> {
    if (this.isExecuting) {
      throw new Error('Ya hay un protocolo de emergencia en ejecución');
    }

    this.isExecuting = true;
    console.log('🚨 INICIANDO PROTOCOLO DE EMERGENCIA 🚨');

    try {
      // 1. Obtener ubicación GPS
      onProgress?.('📍 Obteniendo ubicación GPS...');
      const location = await GeolocationService.getLocationWithAddress();
      console.log('✅ Ubicación obtenida:', location);

      // 2. Crear alerta
      const alert: SOSAlert = {
        id: uuid.v4() as string,
        timestamp: Date.now(),
        location,
        contacts: contacts.sort((a, b) => a.priority - b.priority),
        callResults: [],
        smsResults: [],
        status: 'in-progress',
      };
      this.currentAlert = alert;

      // 3. ENVIAR SMS Y LLAMADAS EN PARALELO
      onProgress?.('🚨 Iniciando llamadas y SMS simultáneamente...');
      
      const promises: Promise<any>[] = [];

      // Promise de SMS (si está habilitado)
      if (protocolConfig.smsEnabled) {
        const smsPromise = TwilioSMSService.sendBulkEmergencySMS(
          contacts,
          location,
          userName,
          twilioConfig,
        ).then(smsResults => {
          alert.smsResults = smsResults;
          const smsSent = smsResults.filter(r => r.status === 'sent').length;
          console.log(`✅ SMS enviados: ${smsSent}/${contacts.length}`);
          onProgress?.(`📱 SMS enviados: ${smsSent}/${contacts.length}`, { smsResults });
          return smsResults;
        });
        promises.push(smsPromise);
      }

      // Promise de llamadas (si está habilitado)
      if (protocolConfig.callEnabled) {
        const callsPromise = this.executeCallEscalation(
          contacts,
          location,
          userName,
          twilioConfig,
          protocolConfig,
          onProgress,
        ).then(callResults => {
          alert.callResults = callResults;
          return callResults;
        });
        promises.push(callsPromise);
      }

      // Esperar a que ambos terminen
      await Promise.all(promises);

      // 5. Marcar alerta como completada
      alert.status = 'completed';
      this.currentAlert = alert;

      // 6. Guardar en historial
      await StorageService.saveAlert(alert);
      console.log('✅ PROTOCOLO DE EMERGENCIA COMPLETADO');
      onProgress?.('✅ Protocolo completado', { alert });

      return alert;
    } catch (error: any) {
      console.error('❌ ERROR EN PROTOCOLO DE EMERGENCIA:', error);
      
      if (this.currentAlert) {
        this.currentAlert.status = 'failed';
        await StorageService.saveAlert(this.currentAlert);
      }
      
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Ejecutar llamadas escalonadas con reintentos
   */
  private async executeCallEscalation(
    contacts: EmergencyContact[],
    location: Location,
    userName: string,
    twilioConfig: TwilioConfig,
    protocolConfig: ProtocolConfig,
    onProgress?: (message: string, data?: any) => void,
  ): Promise<CallResult[]> {
    console.log('📞 Iniciando llamadas escalonadas...');
    const allCallResults: CallResult[] = [];
    let anyoneAnswered = false;

    // Llamar a cada contacto por prioridad
    for (const contact of contacts) {
      if (anyoneAnswered) {
        console.log('✅ Alguien ya respondió, deteniendo escalamiento');
        break;
      }

      let attempts = 0;
      let contactAnswered = false;

      // Intentar hasta N veces por contacto
      while (attempts < protocolConfig.retryAttempts && !contactAnswered && !anyoneAnswered) {
        attempts++;
        
        onProgress?.(
          `📞 Llamando a ${contact.name} (intento ${attempts}/${protocolConfig.retryAttempts})...`,
          { contact, attempts },
        );
        
        console.log(`📞 Intento ${attempts}: Llamando a ${contact.name}...`);

        try {
          // Hacer la llamada
          const callResult = await TwilioVoiceService.makeEmergencyCall(
            contact,
            location,
            userName,
            twilioConfig,
          );

          if (callResult.callSid) {
            // Monitorear la llamada hasta que termine
            const finalResult = await CallMonitoringService.monitorCall(
              callResult,
              twilioConfig,
              (updatedResult) => {
                onProgress?.(
                  `📊 ${contact.name}: ${updatedResult.status} (${updatedResult.duration}s)`,
                  { result: updatedResult },
                );
              },
            );

            allCallResults.push(finalResult);

            // Verificar si respondió
            if (finalResult.answered) {
              contactAnswered = true;
              anyoneAnswered = true;
              console.log(`✅✅ ${contact.name} RESPONDIÓ la llamada!`);
              onProgress?.(
                `✅ ${contact.name} RESPONDIÓ la llamada (${finalResult.duration}s)`,
                { result: finalResult },
              );
              break;
            }

            // Si está ocupado, esperar más tiempo antes de reintentar
            if (finalResult.busy) {
              console.log(`📵 ${contact.name} ocupado, esperando ${protocolConfig.retryDelay}ms...`);
              if (attempts < protocolConfig.retryAttempts) {
                await this.delay(protocolConfig.retryDelay);
              }
            } else if (finalResult.status === 'no-answer') {
              console.log(`🔇 ${contact.name} no contestó`);
              if (attempts < protocolConfig.retryAttempts) {
                await this.delay(protocolConfig.retryDelay / 2); // Espera más corta
              }
            } else {
              console.log(`❌ ${contact.name} llamada falló: ${finalResult.status}`);
            }
          } else {
            console.log(`❌ No se pudo iniciar llamada a ${contact.name}`);
            allCallResults.push(callResult);
          }
        } catch (error) {
          console.error(`❌ Error en llamada a ${contact.name}:`, error);
        }
      }

      // Si este contacto no respondió, pasar al siguiente después de una pausa
      if (!contactAnswered && !anyoneAnswered) {
        console.log(`⚠️ ${contact.name} no respondió después de ${attempts} intentos`);
        onProgress?.(
          `⚠️ ${contact.name} no respondió, escalando...`,
          { contact, attempts },
        );
        
        // Pausa antes del siguiente contacto
        if (contacts.indexOf(contact) < contacts.length - 1) {
          await this.delay(protocolConfig.escalationDelay);
        }
      }
    }

    // Resumen final
    const answeredCalls = allCallResults.filter(r => r.answered).length;
    console.log(`📊 Resumen: ${answeredCalls}/${allCallResults.length} llamadas respondidas`);
    
    if (answeredCalls === 0) {
      console.log('⚠️ NADIE RESPONDIÓ LAS LLAMADAS');
      onProgress?.('⚠️ NADIE RESPONDIÓ las llamadas', { callResults: allCallResults });
    }

    return allCallResults;
  }

  /**
   * Ejecutar protocolo simplificado (solo SMS o solo llamadas)
   */
  async executeSimplified(
    contacts: EmergencyContact[],
    userName: string,
    twilioConfig: TwilioConfig,
    mode: 'sms' | 'calls',
    onProgress?: (message: string, data?: any) => void,
  ): Promise<Partial<SOSAlert>> {
    console.log(`🚨 Ejecutando protocolo simplificado: ${mode.toUpperCase()}`);

    try {
      // Obtener ubicación
      onProgress?.('📍 Obteniendo ubicación...');
      const location = await GeolocationService.getLocationWithAddress();

      if (mode === 'sms') {
        // Solo enviar SMS
        onProgress?.('📱 Enviando SMS...');
        const smsResults = await TwilioSMSService.sendBulkEmergencySMS(
          contacts,
          location,
          userName,
          twilioConfig,
        );
        return { location, smsResults };
      } else {
        // Solo hacer llamadas (sin reintentos)
        onProgress?.('📞 Haciendo llamadas...');
        const callPromises = contacts.map(contact =>
          TwilioVoiceService.makeEmergencyCall(contact, location, userName, twilioConfig),
        );
        const callResults = await Promise.all(callPromises);
        return { location, callResults };
      }
    } catch (error) {
      console.error('❌ Error en protocolo simplificado:', error);
      throw error;
    }
  }

  /**
   * Cancelar protocolo en ejecución
   */
  async cancel(): Promise<void> {
    console.log('⏹️ Cancelando protocolo de emergencia...');
    CallMonitoringService.stopAllMonitoring();
    this.isExecuting = false;
    
    if (this.currentAlert) {
      this.currentAlert.status = 'failed';
      await StorageService.saveAlert(this.currentAlert);
    }
  }

  /**
   * Verificar si hay un protocolo en ejecución
   */
  isRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * Obtener alerta actual
   */
  getCurrentAlert(): SOSAlert | null {
    return this.currentAlert;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instancia única (Singleton)
export default new EmergencyProtocol();
