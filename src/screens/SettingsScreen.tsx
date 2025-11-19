// 🚨 BrazaleteSOS - Pantalla de Configuración

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StorageService } from '../services';
import type { TwilioConfig, UserConfig } from '../types';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { validateTwilioConfig, validateUserConfig } from '../utils/validators';

export default function SettingsScreen() {
  const [twilioData, setTwilioData] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
  });

  const [userData, setUserData] = useState({
    userId: '',
    userName: '',
    userPhone: '',
    homeAddress: '',
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    const twilio = await StorageService.getTwilioConfig();
    const user = await StorageService.getUserConfig();

    if (twilio) {
      setTwilioData(twilio);
    }
    if (user) {
      setUserData({
        ...user,
        homeAddress: user.homeAddress || '',
      });
    }
  };

  const saveTwilioConfig = async () => {
    const errors = validateTwilioConfig(twilioData);
    if (errors.length > 0) {
      Alert.alert('Error de Validación', errors.join('\n'));
      return;
    }

    try {
      await StorageService.saveTwilioConfig(twilioData as TwilioConfig);
      Alert.alert('✅ Guardado', 'Configuración de Twilio guardada correctamente');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar la configuración');
    }
  };

  const saveUserConfig = async () => {
    const config: UserConfig = {
      userId: userData.userId || `user_${Date.now()}`,
      userName: userData.userName,
      userPhone: userData.userPhone,
      homeAddress: userData.homeAddress,
    };

    const errors = validateUserConfig(config);
    if (errors.length > 0) {
      Alert.alert('Error de Validación', errors.join('\n'));
      return;
    }

    try {
      await StorageService.saveUserConfig(config);
      Alert.alert('✅ Guardado', 'Tus datos fueron guardados correctamente');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudieron guardar los datos');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Configuración de Twilio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Configuración de Twilio</Text>
          <Text style={styles.sectionSubtitle}>
            Obtén estas credenciales en: https://console.twilio.com/
          </Text>

          <Text style={styles.label}>Account SID</Text>
          <TextInput
            style={styles.input}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={twilioData.accountSid}
            onChangeText={(text) => setTwilioData({ ...twilioData, accountSid: text })}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Auth Token</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu auth token"
            value={twilioData.authToken}
            onChangeText={(text) => setTwilioData({ ...twilioData, authToken: text })}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Número de Teléfono Twilio</Text>
          <TextInput
            style={styles.input}
            placeholder="+12345678900"
            value={twilioData.phoneNumber}
            onChangeText={(text) => setTwilioData({ ...twilioData, phoneNumber: text })}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveTwilioConfig}>
            <Text style={styles.saveButtonText}>💾 Guardar Twilio</Text>
          </TouchableOpacity>
        </View>

        {/* Configuración de Usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Tus Datos</Text>
          <Text style={styles.sectionSubtitle}>
            Esta información se enviará en las alertas de emergencia
          </Text>

          <Text style={styles.label}>Tu Nombre Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            value={userData.userName}
            onChangeText={(text) => setUserData({ ...userData, userName: text })}
          />

          <Text style={styles.label}>Tu Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+52XXXXXXXXXX"
            value={userData.userPhone}
            onChangeText={(text) => setUserData({ ...userData, userPhone: text })}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Dirección de Casa (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Av. Principal 123, Ciudad, Estado"
            value={userData.homeAddress}
            onChangeText={(text) => setUserData({ ...userData, homeAddress: text })}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveUserConfig}>
            <Text style={styles.saveButtonText}>💾 Guardar Datos</Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información Importante</Text>
          <Text style={styles.infoText}>
            • Twilio ofrece $15 USD de crédito gratis para pruebas{'\n'}
            • Costo aproximado: $0.013/min llamadas, $0.0075/SMS{'\n'}
            • Los números deben estar verificados en modo de prueba{'\n'}
            • Formato de números México: +52XXXXXXXXXX
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
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
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
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
