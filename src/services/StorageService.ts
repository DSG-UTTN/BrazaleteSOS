// 🚨 BrazaleteSOS - Servicio de Almacenamiento

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  EmergencyContact,
  TwilioConfig,
  UserConfig,
  ProtocolConfig,
  BLEConfig,
  AppConfig,
  SOSAlert,
} from '../types';
import { STORAGE_KEYS, DEFAULT_PROTOCOL_CONFIG, DEFAULT_BLE_CONFIG, MAX_ALERTS_HISTORY } from '../utils/constants';

class StorageService {
  /**
   * Guardar contactos de emergencia
   */
  async saveContacts(contacts: EmergencyContact[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
      console.log('✅ Contactos guardados:', contacts.length);
    } catch (error) {
      console.error('❌ Error guardando contactos:', error);
      throw error;
    }
  }

  /**
   * Obtener contactos de emergencia
   */
  async getContacts(): Promise<EmergencyContact[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo contactos:', error);
      return [];
    }
  }

  /**
   * Agregar un contacto
   */
  async addContact(contact: EmergencyContact): Promise<void> {
    try {
      const contacts = await this.getContacts();
      contacts.push(contact);
      await this.saveContacts(contacts);
    } catch (error) {
      console.error('❌ Error agregando contacto:', error);
      throw error;
    }
  }

  /**
   * Actualizar un contacto
   */
  async updateContact(contactId: string, updatedContact: EmergencyContact): Promise<void> {
    try {
      const contacts = await this.getContacts();
      const index = contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        contacts[index] = updatedContact;
        await this.saveContacts(contacts);
      }
    } catch (error) {
      console.error('❌ Error actualizando contacto:', error);
      throw error;
    }
  }

  /**
   * Eliminar un contacto
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.getContacts();
      const filtered = contacts.filter(c => c.id !== contactId);
      await this.saveContacts(filtered);
    } catch (error) {
      console.error('❌ Error eliminando contacto:', error);
      throw error;
    }
  }

  /**
   * Guardar configuración de Twilio
   */
  async saveTwilioConfig(config: TwilioConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TWILIO_CONFIG, JSON.stringify(config));
      console.log('✅ Configuración de Twilio guardada');
    } catch (error) {
      console.error('❌ Error guardando config de Twilio:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración de Twilio
   */
  async getTwilioConfig(): Promise<TwilioConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TWILIO_CONFIG);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo config de Twilio:', error);
      return null;
    }
  }

  /**
   * Guardar configuración de usuario
   */
  async saveUserConfig(config: UserConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
      console.log('✅ Configuración de usuario guardada');
    } catch (error) {
      console.error('❌ Error guardando config de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración de usuario
   */
  async getUserConfig(): Promise<UserConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_CONFIG);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo config de usuario:', error);
      return null;
    }
  }

  /**
   * Guardar configuración completa de la app
   */
  async saveAppConfig(config: AppConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      console.log('✅ Configuración completa guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración completa de la app
   */
  async getAppConfig(): Promise<AppConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error);
      return null;
    }
  }

  /**
   * Guardar configuración del protocolo
   */
  async saveProtocolConfig(config: ProtocolConfig): Promise<void> {
    try {
      const appConfig = await this.getAppConfig();
      if (appConfig) {
        appConfig.protocol = config;
        await this.saveAppConfig(appConfig);
      }
    } catch (error) {
      console.error('❌ Error guardando config del protocolo:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración del protocolo
   */
  async getProtocolConfig(): Promise<ProtocolConfig> {
    try {
      const appConfig = await this.getAppConfig();
      if (appConfig && appConfig.protocol) {
        return appConfig.protocol;
      }
      return DEFAULT_PROTOCOL_CONFIG;
    } catch (error) {
      console.error('❌ Error obteniendo config del protocolo:', error);
      return DEFAULT_PROTOCOL_CONFIG;
    }
  }

  /**
   * Guardar configuración BLE
   */
  async saveBLEConfig(config: BLEConfig): Promise<void> {
    try {
      const appConfig = await this.getAppConfig();
      if (appConfig) {
        appConfig.ble = config;
        await this.saveAppConfig(appConfig);
      }
    } catch (error) {
      console.error('❌ Error guardando config BLE:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración BLE
   */
  async getBLEConfig(): Promise<BLEConfig> {
    try {
      const appConfig = await this.getAppConfig();
      if (appConfig && appConfig.ble) {
        return appConfig.ble;
      }
      return DEFAULT_BLE_CONFIG;
    } catch (error) {
      console.error('❌ Error obteniendo config BLE:', error);
      return DEFAULT_BLE_CONFIG;
    }
  }

  /**
   * Guardar alerta en historial
   */
  async saveAlert(alert: SOSAlert): Promise<void> {
    try {
      const alerts = await this.getAlertsHistory();
      alerts.unshift(alert); // Agregar al inicio
      
      // Mantener solo las últimas MAX_ALERTS_HISTORY alertas
      if (alerts.length > MAX_ALERTS_HISTORY) {
        alerts.splice(MAX_ALERTS_HISTORY);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS_HISTORY, JSON.stringify(alerts));
      console.log('✅ Alerta guardada en historial');
    } catch (error) {
      console.error('❌ Error guardando alerta:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de alertas
   */
  async getAlertsHistory(): Promise<SOSAlert[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Limpiar historial de alertas
   */
  async clearAlertsHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS_HISTORY, JSON.stringify([]));
      console.log('✅ Historial limpiado');
    } catch (error) {
      console.error('❌ Error limpiando historial:', error);
      throw error;
    }
  }

  /**
   * Limpiar todos los datos (reset completo)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      console.log('✅ Todos los datos eliminados');
    } catch (error) {
      console.error('❌ Error eliminando datos:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay datos almacenados
   */
  async hasStoredData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.some(key => Object.values(STORAGE_KEYS).includes(key));
    } catch (error) {
      console.error('❌ Error verificando datos:', error);
      return false;
    }
  }
}

// Exportar instancia única (Singleton)
export default new StorageService();
