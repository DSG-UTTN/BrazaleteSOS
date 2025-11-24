// 🚨 BrazaleteSOS - Servicio Bluetooth Low Energy

import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import * as base64 from 'base-64';
import type { BraceletMessage, BLEConnectionStatus } from '../types';
import { BLE_CONSTANTS } from '../utils/constants';

class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private connectionStatus: BLEConnectionStatus = 'disconnected';
  private listeners: ((message: BraceletMessage) => void)[] = [];
  private messageBuffer: string = ''; // Buffer para acumular fragmentos de JSON
  private bufferTimeout: NodeJS.Timeout | null = null; // Timeout para limpiar buffer

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Solicitar permisos BLE (Android)
   */
  async requestBLEPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          // Android 12+ requiere permisos específicos
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android < 12
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (error) {
        console.error('❌ Error solicitando permisos BLE:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Escanear dispositivos BLE cercanos
   */
  async scanForBracelet(
    onDeviceFound: (device: Device) => void,
    timeoutMs: number = 30000,
  ): Promise<void> {
    console.log('🔍 Escaneando brazaletes BLE...');
    this.connectionStatus = 'scanning';

    const hasPermission = await this.requestBLEPermissions();
    if (!hasPermission) {
      throw new Error('Permisos BLE no concedidos');
    }

    let deviceFoundAndHandled = false;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!deviceFoundAndHandled) {
          this.manager.stopDeviceScan();
          console.log('⏱️ Timeout de escaneo');
          if (this.connectionStatus === 'scanning') {
            this.connectionStatus = 'disconnected';
          }
        }
        resolve();
      }, timeoutMs);

      this.manager.startDeviceScan(
        null,
        null,
        (error, device) => {
          if (error) {
            console.error('❌ Error en escaneo BLE:', error);
            clearTimeout(timeout);
            this.manager.stopDeviceScan();
            this.connectionStatus = 'error';
            reject(error);
            return;
          }

          // Log de TODOS los dispositivos detectados
          if (device?.name) {
            console.log('📱 Dispositivo detectado:', device.name, 'ID:', device.id);
          }

          if (device && device.name?.startsWith(BLE_CONSTANTS.DEVICE_NAME_PREFIX)) {
            if (!deviceFoundAndHandled) {
              deviceFoundAndHandled = true;
              console.log('✅ Brazalete encontrado:', device.name, 'RSSI:', device.rssi);
              
              // Detener escaneo inmediatamente
              clearTimeout(timeout);
              this.manager.stopDeviceScan();
              console.log('⏹️ Escaneo detenido (brazalete encontrado)');
              
              // Llamar al callback
              onDeviceFound(device);
              resolve();
            }
          }
        },
      );
    });
  }

  /**
   * Conectar a un brazalete específico
   */
  async connect(deviceId: string): Promise<void> {
    console.log(`🔗 Intentando conectar a: ${deviceId}`);
    this.connectionStatus = 'connecting';

    try {
      // Detener escaneo antes de conectar
      this.manager.stopDeviceScan();
      console.log('⏹️ Escaneo detenido');

      // Conectar al dispositivo con timeout explícito
      console.log('⏳ Conectando... (esto puede tardar unos segundos)');
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 15000, // 15 segundos
        requestMTU: 512, // Solicitar MTU más grande para menos fragmentación
      });
      this.connectedDevice = device;
      console.log('🔗 Dispositivo conectado, descubriendo servicios...');

      // Descubrir servicios y características
      await device.discoverAllServicesAndCharacteristics();
      console.log('📡 Servicios descubiertos');

      // Solicitar MTU más grande
      try {
        const mtuResult = await device.requestMTU(512);
        const mtuValue = typeof mtuResult === 'object' ? (mtuResult as any).mtu || 'desconocido' : mtuResult;
        console.log(`📏 MTU negociado: ${mtuValue} bytes`);
      } catch (mtuError) {
        console.log('⚠️ No se pudo negociar MTU, usando predeterminado');
      }
      
      this.connectionStatus = 'connected';
      console.log('✅ CONEXION EXITOSA');

      // Suscribirse a notificaciones
      await this.subscribeToNotifications();

      // Monitorear desconexión
      device.onDisconnected((error, disconnectedDevice) => {
        console.log('🔌 Brazalete desconectado');
        if (error) {
          console.error('Error de desconexión:', error);
        }
        this.connectionStatus = 'disconnected';
        this.connectedDevice = null;
        this.messageBuffer = ''; // Limpiar buffer al desconectar
        
        // Intentar reconectar automáticamente
        console.log('🔄 Intentando reconectar en 3 segundos...');
        setTimeout(() => {
          this.reconnect(deviceId);
        }, 3000);
      });
    } catch (error: any) {
      console.error('❌ Error conectando:', error.message || error);
      console.error('Detalles:', error);
      this.connectionStatus = 'error';
      this.connectedDevice = null;
      throw error;
    }
  }

  /**
   * Suscribirse a notificaciones del brazalete
   */
  private async subscribeToNotifications(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No hay dispositivo conectado');
    }

    try {
      // Resetear buffer al suscribirse
      this.messageBuffer = '';

      this.connectedDevice.monitorCharacteristicForService(
        BLE_CONSTANTS.SERVICE_UUID,
        BLE_CONSTANTS.CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Error en notificación BLE:', error);
            return;
          }

          if (characteristic?.value) {
            try {
              // Decodificar mensaje (base64 -> string)
              const decoded = base64.decode(characteristic.value);
              console.log('📦 Mensaje recibido:', decoded);

              // Acumular en buffer
              this.messageBuffer += decoded;

              // Cancelar timeout anterior si existe
              if (this.bufferTimeout) {
                clearTimeout(this.bufferTimeout);
              }

              // Verificar si el mensaje está completo (termina sin fragmentar)
              // Para formato delimitado: "SOS|timestamp|battery"
              const trimmed = this.messageBuffer.trim();
              
              // Si tiene el formato esperado (3 partes separadas por |)
              if (trimmed.includes('|')) {
                const parts = trimmed.split('|');
                
                if (parts.length === 3) {
                  // Mensaje completo recibido
                  const message: BraceletMessage = {
                    user_id: 'user_123',
                    device_id: 'BrazaleteSOS_001',
                    timestamp: parts[1],
                    battery_level: parseInt(parts[2]),
                    alert_type: parts[0],
                  };
                  
                  console.log('✅ Mensaje parseado:', message);
                  
                  // Notificar a los listeners
                  this.listeners.forEach(listener => listener(message));
                  
                  // Limpiar buffer después de procesar
                  this.messageBuffer = '';
                  this.bufferTimeout = null;
                } else {
                  // Mensaje incompleto, esperar más datos
                  console.log('⏳ Mensaje incompleto, esperando más datos...');
                  this.bufferTimeout = setTimeout(() => {
                    console.warn('⏱️ Timeout de buffer, limpiando datos incompletos');
                    console.warn('Buffer descartado:', this.messageBuffer);
                    this.messageBuffer = '';
                    this.bufferTimeout = null;
                  }, 2000); // 2 segundos (menos tiempo porque es más rápido)
                }
              } else {
                // Sin delimitador, esperar más datos
                console.log('⏳ Esperando delimitadores...');
                this.bufferTimeout = setTimeout(() => {
                  console.warn('⏱️ Timeout de buffer, limpiando datos incompletos');
                  console.warn('Buffer descartado:', this.messageBuffer);
                  this.messageBuffer = '';
                  this.bufferTimeout = null;
                }, 2000);
              }
            } catch (e) {
              console.error('❌ Error parseando mensaje:', e);
              this.messageBuffer = ''; // Limpiar buffer en caso de error crítico
            }
          }
        },
      );

      console.log('✅ Suscrito a notificaciones del brazalete');
    } catch (error) {
      console.error('❌ Error suscribiéndose a notificaciones:', error);
      throw error;
    }
  }

  /**
   * Reconectar automáticamente
   */
  private async reconnect(deviceId: string): Promise<void> {
    if (this.connectionStatus === 'connected') {
      console.log('⏸️ Ya reconectado, cancelando intento');
      return;
    }

    console.log('🔄 Reintentando conexión...');
    try {
      await this.connect(deviceId);
      console.log('✅ Reconexión exitosa');
    } catch (error) {
      console.error('❌ Error en reconexión, reintentando en 5 segundos...');
      setTimeout(() => {
        this.reconnect(deviceId);
      }, 5000);
    }
  }

  /**
   * Desconectar del brazalete
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
        console.log('✅ Desconectado del brazalete');
      } catch (error) {
        console.error('❌ Error desconectando:', error);
      } finally {
        this.connectedDevice = null;
        this.connectionStatus = 'disconnected';
      }
    }
  }

  /**
   * Enviar confirmación al brazalete
   */
  async sendConfirmation(message: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No hay dispositivo conectado');
    }

    try {
      const encoded = base64.encode(message);
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        BLE_CONSTANTS.SERVICE_UUID,
        BLE_CONSTANTS.CHARACTERISTIC_UUID,
        encoded,
      );
      console.log('✅ Confirmación enviada al brazalete');
    } catch (error) {
      console.error('❌ Error enviando confirmación:', error);
      throw error;
    }
  }

  /**
   * Registrar listener para mensajes del brazalete
   */
  addMessageListener(listener: (message: BraceletMessage) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remover listener
   */
  removeMessageListener(listener: (message: BraceletMessage) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus(): BLEConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.connectedDevice !== null;
  }

  /**
   * Obtener dispositivo conectado
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Destruir instancia y limpiar recursos
   */
  destroy(): void {
    this.manager.stopDeviceScan();
    this.disconnect();
    this.listeners = [];
  }
}

// Exportar instancia única (Singleton)
export default new BLEService();
