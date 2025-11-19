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

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        console.log('⏱️ Timeout de escaneo');
        this.connectionStatus = 'disconnected';
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

          if (device && device.name?.startsWith(BLE_CONSTANTS.DEVICE_NAME_PREFIX)) {
            console.log('✅ Brazalete encontrado:', device.name);
            onDeviceFound(device);
          }
        },
      );
    });
  }

  /**
   * Conectar a un brazalete específico
   */
  async connect(deviceId: string): Promise<void> {
    console.log(`🔗 Conectando a dispositivo: ${deviceId}`);
    this.connectionStatus = 'connecting';

    try {
      // Conectar al dispositivo
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;

      // Descubrir servicios y características
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectionStatus = 'connected';
      console.log('✅ Conectado al brazalete');

      // Suscribirse a notificaciones
      await this.subscribeToNotifications();

      // Monitorear desconexión
      device.onDisconnected(() => {
        console.log('🔌 Brazalete desconectado');
        this.connectionStatus = 'disconnected';
        this.connectedDevice = null;
      });
    } catch (error) {
      console.error('❌ Error conectando:', error);
      this.connectionStatus = 'error';
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
              // Decodificar mensaje (base64 -> string -> JSON)
              const decoded = base64.decode(characteristic.value);
              const message: BraceletMessage = JSON.parse(decoded);
              
              console.log('📨 Mensaje del brazalete:', message);
              
              // Notificar a los listeners
              this.listeners.forEach(listener => listener(message));
            } catch (e) {
              console.error('❌ Error parseando mensaje:', e);
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
