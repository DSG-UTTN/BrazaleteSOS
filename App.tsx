/**
 * 🚨 BrazaleteSOS - Sistema de Emergencia Inteligente
 * App Principal con Navegación
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importar pantallas
import HomeScreen from './src/screens/HomeScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AlertHistoryScreen from './src/screens/AlertHistoryScreen';

import { COLORS } from './src/utils/constants';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: '🚨 BrazaleteSOS' }}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsScreen}
            options={{ title: 'Contactos de Emergencia' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Configuración' }}
          />
          <Stack.Screen
            name="AlertHistory"
            component={AlertHistoryScreen}
            options={{ title: 'Historial de Alertas' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
