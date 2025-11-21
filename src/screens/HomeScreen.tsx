// 🚨 BrazaleteSOS - Pantalla Principal

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmergencyProtocol, StorageService, GeolocationService } from '../services';
import type { EmergencyContact, TwilioConfig, UserConfig } from '../types';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { isAppConfigured } from '../utils/validators';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const [loadedContacts, loadedTwilio, loadedUser] = await Promise.all([
        StorageService.getContacts(),
        StorageService.getTwilioConfig(),
        StorageService.getUserConfig(),
      ]);

      setContacts(loadedContacts);
      
      // Si no hay configuración de Twilio guardada, usar valores por defecto
      if (!loadedTwilio) {
        const { TWILIO_CONFIG } = require('../config/twilio.config');
        const defaultConfig: TwilioConfig = {
          accountSid: TWILIO_CONFIG.ACCOUNT_SID,
          authToken: TWILIO_CONFIG.AUTH_TOKEN,
          phoneNumber: TWILIO_CONFIG.PHONE_NUMBER,
        };
        await StorageService.saveTwilioConfig(defaultConfig);
        setTwilioConfig(defaultConfig);
      } else {
        setTwilioConfig(loadedTwilio);
      }
      
      setUserConfig(loadedUser);

      const { configured } = isAppConfigured(
        loadedTwilio || undefined,
        loadedUser || undefined,
        loadedContacts,
      );
      setIsReady(configured);

      if (!configured) {
        Alert.alert(
          'Configuración Incompleta',
          'Por favor, configura Twilio, tus datos y agrega contactos de emergencia.',
          [
            { text: 'Configurar Ahora', onPress: () => navigation.navigate('Settings') },
            { text: 'Más Tarde', style: 'cancel' },
          ],
        );
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleSOSPress = () => {
    if (!isReady) {
      Alert.alert(
        'Configuración Incompleta',
        'Debes configurar Twilio, tus datos y agregar contactos antes de usar SOS.',
        [{ text: 'Configurar', onPress: () => navigation.navigate('Settings') }],
      );
      return;
    }

    Alert.alert(
      '🚨 CONFIRMAR EMERGENCIA',
      '¿Estás seguro que deseas enviar una alerta SOS a todos tus contactos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'ENVIAR SOS', style: 'destructive', onPress: sendSOSAlert },
      ],
    );
  };

  const sendSOSAlert = async () => {
    if (!twilioConfig || !userConfig || contacts.length === 0) {
      Alert.alert('Error', 'Configuración incompleta');
      return;
    }

    setIsSending(true);
    setProgressMessage('Iniciando protocolo de emergencia...');

    try {
      const protocolConfig = await StorageService.getProtocolConfig();

      const alert = await EmergencyProtocol.execute(
        contacts,
        userConfig.userName,
        twilioConfig,
        protocolConfig,
        (message, data) => {
          setProgressMessage(message);
          console.log('📊 Progreso:', message, data);
        },
      );

      setProgressMessage('');
      setIsSending(false);

      // Verificar si hubo errores de Trial Account
      const trialCallErrors = alert.callResults.filter(r => r.errorCode === 21219);
      const trialSmsErrors = alert.smsResults.filter(r => r.errorCode === 21608);
      const hasTrialErrors = trialCallErrors.length > 0 || trialSmsErrors.length > 0;

      if (hasTrialErrors) {
        Alert.alert(
          '⚠️ Cuenta Trial de Twilio',
          'Los números de destino no están verificados en tu cuenta Trial de Twilio.\n\n' +
          '📋 Pasos para verificar números:\n' +
          '1. Ve a console.twilio.com\n' +
          '2. Ir a Phone Numbers > Manage > Verified Caller IDs\n' +
          '3. Agrega y verifica cada número\n' +
          '4. Vuelve a intentar\n\n' +
          'O actualiza a una cuenta pagada para eliminar esta restricción.',
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          '✅ Alerta Enviada',
          'El protocolo de emergencia se completó exitosamente.',
          [{ text: 'OK' }],
        );
      }
    } catch (error: any) {
      console.error('Error enviando SOS:', error);
      setProgressMessage('');
      setIsSending(false);

      Alert.alert('❌ Error', `No se pudo completar la alerta: ${error.message}`);
    }
  };

  const testLocation = async () => {
    try {
      const location = await GeolocationService.getLocationWithAddress();
      Alert.alert(
        'Ubicación Obtenida',
        `Lat: ${location.latitude.toFixed(6)}\nLng: ${location.longitude.toFixed(6)}\n${location.address}`,
      );
    } catch (error: any) {
      Alert.alert('Error', `No se pudo obtener la ubicación: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Estado de configuración */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Configuración:</Text>
            <Text style={[styles.statusValue, isReady ? styles.statusReady : styles.statusNotReady]}>
              {isReady ? '✅ Lista' : '⚠️ Incompleta'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Contactos:</Text>
            <Text style={styles.statusValue}>{contacts.length} registrados</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Twilio:</Text>
            <Text style={styles.statusValue}>{twilioConfig ? '✅ Configurado' : '❌ Sin configurar'}</Text>
          </View>
        </View>

        {/* Botón SOS Principal */}
        <TouchableOpacity
          style={[styles.sosButton, !isReady && styles.sosButtonDisabled]}
          onPress={handleSOSPress}
          disabled={isSending || !isReady}
          activeOpacity={0.7}>
          <Text style={styles.sosButtonText}>🚨</Text>
          <Text style={styles.sosButtonLabel}>
            {isSending ? 'ENVIANDO...' : 'EMERGENCIA SOS'}
          </Text>
        </TouchableOpacity>

        {/* Mensaje de progreso */}
        {isSending && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progressText}>{progressMessage}</Text>
          </View>
        )}

        {/* Menú de opciones */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.menuButtonIcon}>👥</Text>
            <Text style={styles.menuButtonText}>Contactos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuButtonIcon}>⚙️</Text>
            <Text style={styles.menuButtonText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('AlertHistory')}>
            <Text style={styles.menuButtonIcon}>📋</Text>
            <Text style={styles.menuButtonText}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={testLocation}>
            <Text style={styles.menuButtonIcon}>📍</Text>
            <Text style={styles.menuButtonText}>Probar GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Información */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            Presiona el botón SOS en caso de emergencia. Se enviará tu ubicación GPS y se 
            llamará automáticamente a todos tus contactos de emergencia.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  statusLabel: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  statusValue: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusReady: {
    color: COLORS.success,
  },
  statusNotReady: {
    color: COLORS.warning,
  },
  sosButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.lg,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0.2,
  },
  sosButtonText: {
    fontSize: 80,
  },
  sosButtonLabel: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: SPACING.sm,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  menuButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  menuButtonIcon: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  menuButtonText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.info + '20',
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
