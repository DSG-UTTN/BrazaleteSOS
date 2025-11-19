// 🚨 BrazaleteSOS - Servicio de Geolocalización

import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import type { Location } from '../types';

class GeolocationService {
  /**
   * Solicitar permisos de ubicación (Android)
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message: 'BrazaleteSOS necesita acceso a tu ubicación para enviar alertas de emergencia.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          },
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Permiso de ubicación concedido');
          return true;
        } else {
          console.log('❌ Permiso de ubicación denegado');
          return false;
        }
      } catch (error) {
        console.error('❌ Error solicitando permiso de ubicación:', error);
        return false;
      }
    }
    
    // En iOS los permisos se manejan automáticamente con Info.plist
    return true;
  }

  /**
   * Verificar si los permisos están concedidos
   */
  async hasLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return hasPermission;
    }
    return true;
  }

  /**
   * Obtener ubicación actual
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise(async (resolve, reject) => {
      // Verificar permisos
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          reject(new Error('Permiso de ubicación no concedido'));
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            timestamp: position.timestamp,
          };
          
          console.log('✅ Ubicación obtenida:', location);
          resolve(location);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          reject(error);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  /**
   * Obtener dirección aproximada usando reverse geocoding
   * Nota: Para producción, usar un servicio como Google Maps Geocoding API
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      // Para prototipo KISS, retornamos coordenadas formateadas
      // En producción, aquí harías una llamada a Google Maps Geocoding API
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      
      /* Ejemplo con Google Maps Geocoding API (requiere API Key):
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      */
    } catch (error) {
      console.error('❌ Error obteniendo dirección:', error);
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }
  }

  /**
   * Obtener ubicación completa con dirección
   */
  async getLocationWithAddress(): Promise<Location> {
    try {
      const location = await this.getCurrentLocation();
      const address = await this.getAddressFromCoordinates(
        location.latitude,
        location.longitude,
      );
      
      return {
        ...location,
        address,
      };
    } catch (error) {
      console.error('❌ Error obteniendo ubicación con dirección:', error);
      throw error;
    }
  }

  /**
   * Observar cambios de ubicación en tiempo real
   */
  watchLocation(
    onLocationChange: (location: Location) => void,
    onError: (error: any) => void,
  ): number {
    return Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          timestamp: position.timestamp,
        };
        onLocationChange(location);
      },
      onError,
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        interval: 5000, // Actualizar cada 5 segundos
        fastestInterval: 2000,
        distanceFilter: 10, // Metros mínimos de movimiento
      },
    );
  }

  /**
   * Detener observación de ubicación
   */
  clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }
}

// Exportar instancia única (Singleton)
export default new GeolocationService();
