// 🚨 BrazaleteSOS - Servicio de Monitoreo de Llamadas

import type { CallResult, CallStatus, TwilioConfig } from '../types';
import { CALL_STATUS_CHECK_INTERVAL, MIN_CALL_DURATION_ANSWERED } from '../utils/constants';
import TwilioVoiceService from './TwilioVoiceService';

class CallMonitoringService {
  private monitoringIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  /**
   * Monitorear el estado de una llamada hasta que se complete
   */
  async monitorCall(
    callResult: CallResult,
    twilioConfig: TwilioConfig,
    onStatusChange?: (result: CallResult) => void,
  ): Promise<CallResult> {
    return new Promise((resolve) => {
      console.log(`👁️ Monitoreando llamada: ${callResult.callSid}`);

      const intervalId = setInterval(async () => {
        try {
          // Obtener estado actual de la llamada
          const { status, duration } = await TwilioVoiceService.getCallStatus(
            callResult.callSid,
            twilioConfig,
          );

          console.log(`📊 Estado de llamada a ${callResult.contact.name}: ${status} (${duration}s)`);

          // Actualizar resultado
          const updatedResult: CallResult = {
            ...callResult,
            status,
            duration,
          };

          // Notificar cambio de estado
          if (onStatusChange) {
            onStatusChange(updatedResult);
          }

          // Verificar si la llamada terminó
          if (this.isCallFinished(status)) {
            clearInterval(intervalId);
            this.monitoringIntervals.delete(callResult.callSid);

            // Determinar si fue respondida
            const answered = this.wasCallAnswered(status, duration);
            updatedResult.answered = answered;

            if (answered) {
              console.log(`✅ ${callResult.contact.name} RESPONDIÓ la llamada (${duration}s)`);
            } else if (status === 'busy') {
              console.log(`📵 ${callResult.contact.name} está OCUPADO`);
              updatedResult.busy = true;
            } else if (status === 'no-answer') {
              console.log(`🔇 ${callResult.contact.name} NO CONTESTÓ`);
            } else {
              console.log(`❌ Llamada a ${callResult.contact.name} falló: ${status}`);
            }

            resolve(updatedResult);
          }
        } catch (error) {
          console.error('❌ Error monitoreando llamada:', error);
          clearInterval(intervalId);
          this.monitoringIntervals.delete(callResult.callSid);
          
          resolve({
            ...callResult,
            status: 'failed',
            answered: false,
          });
        }
      }, CALL_STATUS_CHECK_INTERVAL);

      // Guardar referencia al intervalo
      this.monitoringIntervals.set(callResult.callSid, intervalId);

      // Timeout de seguridad (5 minutos máximo)
      setTimeout(() => {
        if (this.monitoringIntervals.has(callResult.callSid)) {
          console.log('⏱️ Timeout de monitoreo alcanzado');
          clearInterval(intervalId);
          this.monitoringIntervals.delete(callResult.callSid);
          
          resolve({
            ...callResult,
            status: 'completed',
            answered: false,
          });
        }
      }, 300000); // 5 minutos
    });
  }

  /**
   * Monitorear múltiples llamadas simultáneamente
   */
  async monitorMultipleCalls(
    callResults: CallResult[],
    twilioConfig: TwilioConfig,
    onStatusChange?: (result: CallResult) => void,
  ): Promise<CallResult[]> {
    console.log(`👁️ Monitoreando ${callResults.length} llamadas simultáneamente...`);

    const promises = callResults.map(callResult =>
      this.monitorCall(callResult, twilioConfig, onStatusChange),
    );

    return Promise.all(promises);
  }

  /**
   * Verificar si una llamada ha terminado
   */
  private isCallFinished(status: CallStatus): boolean {
    return ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status);
  }

  /**
   * Determinar si una llamada fue respondida
   */
  private wasCallAnswered(status: CallStatus, duration: number): boolean {
    // Si la llamada completó y duró más del mínimo, fue respondida
    if (status === 'completed' && duration >= MIN_CALL_DURATION_ANSWERED) {
      return true;
    }

    // Si aún está en progreso y ya pasó el mínimo, está siendo respondida
    if (status === 'in-progress' && duration >= MIN_CALL_DURATION_ANSWERED) {
      return true;
    }

    return false;
  }

  /**
   * Detener monitoreo de una llamada específica
   */
  stopMonitoring(callSid: string): void {
    const intervalId = this.monitoringIntervals.get(callSid);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(callSid);
      console.log(`⏹️ Monitoreo detenido: ${callSid}`);
    }
  }

  /**
   * Detener monitoreo de todas las llamadas
   */
  stopAllMonitoring(): void {
    this.monitoringIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.monitoringIntervals.clear();
    console.log('⏹️ Todos los monitoreos detenidos');
  }

  /**
   * Obtener número de llamadas siendo monitoreadas
   */
  getActiveMonitoringCount(): number {
    return this.monitoringIntervals.size;
  }

  /**
   * Verificar si una llamada está siendo monitoreada
   */
  isMonitoring(callSid: string): boolean {
    return this.monitoringIntervals.has(callSid);
  }

  /**
   * Esperar hasta que al menos una llamada sea respondida
   */
  async waitForFirstAnswer(
    callResults: CallResult[],
    twilioConfig: TwilioConfig,
  ): Promise<CallResult | null> {
    return new Promise((resolve) => {
      let resolved = false;

      const checkCalls = async () => {
        for (const callResult of callResults) {
          try {
            const { status, duration } = await TwilioVoiceService.getCallStatus(
              callResult.callSid,
              twilioConfig,
            );

            if (this.wasCallAnswered(status, duration)) {
              if (!resolved) {
                resolved = true;
                this.stopAllMonitoring();
                resolve({
                  ...callResult,
                  status,
                  duration,
                  answered: true,
                });
              }
              return;
            }
          } catch (error) {
            console.error('Error verificando llamada:', error);
          }
        }
      };

      // Verificar cada 2 segundos
      const intervalId = setInterval(checkCalls, CALL_STATUS_CHECK_INTERVAL);

      // Timeout de 2 minutos
      setTimeout(() => {
        if (!resolved) {
          clearInterval(intervalId);
          resolve(null);
        }
      }, 120000);
    });
  }
}

// Exportar instancia única (Singleton)
export default new CallMonitoringService();
