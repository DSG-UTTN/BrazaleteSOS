# 🚨 BrazaleteSOS - Sistema de Emergencia Inteligente

## 📋 Contexto del Proyecto

**BrazaleteSOS** es un sistema de emergencia personal que combina hardware (brazalete inteligente) y software (app móvil) para enviar alertas SOS automáticas con ubicación GPS a contactos de emergencia mediante llamadas pregrabadas y SMS usando Twilio.

### 🎯 Objetivo Principal
Crear un brazalete de emergencia que, al presionar un botón SOS, envíe automáticamente:
1. **Llamadas telefónicas pregrabadas** a contactos de emergencia
2. **SMS con ubicación GPS** en tiempo real
3. **Detección inteligente** de si la llamada fue respondida
4. **Reintentos automáticos** hasta confirmar que alguien atendió

---

## 🏗️ Arquitectura del Sistema

### Flujo de Operación Definitivo:

```
┌─────────────────────┐
│ Brazalete ESP32-S3  │
│  (Botón SOS + BLE)  │
└──────────┬──────────┘
           │ BLE (Bluetooth Low Energy)
           ↓
┌─────────────────────┐
│  App React Native   │
│  • Recibe señal BLE │
│  • Obtiene GPS      │
│  • Gestiona Twilio  │
└──────────┬──────────┘
           │ HTTPS API Calls
           ↓
┌─────────────────────┐
│   Twilio API        │
│  • Llamadas Voice   │
│  • SMS              │
│  • Status tracking  │
└──────────┬──────────┘
           │ Simultáneo
           ↓
┌─────────────────────────────────┐
│  Contactos de Emergencia        │
│  📞 Llamada + 📱 SMS             │
│  Con detección de respuesta     │
└─────────────────────────────────┘
```

---

## 🔧 Componentes del Sistema

### 1. **Hardware - Brazalete ESP32-S3**

#### Especificaciones:
- **MCU**: ESP32-S3 Supermini (BLE/WiFi, 3.3V)
- **Batería**: LiPo 3.7V (500-900 mAh)
- **Cargador**: TP4056 + protección PCM
- **Regulador**: Buck-boost 3.3V (TPS63021 o similar)
- **Componentes**:
  - Botón SOS (GPIO 0)
  - LED indicador (GPIO 2)
  - Buzzer (GPIO 1)

#### Funcionalidad:
```cpp
// Firmware básico:
1. Monitorear botón SOS constantemente
2. Al presionar: Enviar JSON via BLE
3. Confirmar envío con LED/buzzer
4. Deep sleep para ahorrar batería
5. Wake-up automático por botón
```

#### Protocolo BLE:
```json
{
  "user_id": "user_123",
  "device_id": "BrazaleteSOS_001",
  "timestamp": "1699285200000",
  "battery_level": 75,
  "alert_type": "SOS"
}
```

### 2. **Software - App Móvil React Native**

#### Stack Tecnológico:
- **Framework**: React Native CLI (nativo completo)
- **Lenguaje**: JavaScript/TypeScript
- **Comunicación BLE**: `react-native-ble-plx`
- **GPS**: `react-native-geolocation-service`
- **Llamadas/SMS**: Twilio SDK
- **Storage**: `@react-native-async-storage/async-storage`
- **Permisos**: `react-native-permissions`

#### Funcionalidades Principales:

**A. Escaneo y Conexión BLE**
```javascript
// Buscar y conectar con brazalete
- Escanear dispositivos BLE cercanos
- Filtrar por nombre "BrazaleteSOS_*"
- Conectar automáticamente
- Mantener conexión activa
- Reconectar si se pierde señal
```

**B. Recepción de Alertas**
```javascript
// Al recibir alerta SOS via BLE:
1. Parsear JSON del brazalete
2. Obtener coordenadas GPS precisas
3. Confirmar recepción al brazalete
4. Iniciar protocolo de emergencia
```

**C. Protocolo de Emergencia con Twilio**

##### **Llamadas Pregrabadas Inteligentes:**
```javascript
// TwilioVoiceService.js
async function makeEmergencyCall(contact) {
  const call = await twilio.calls.create({
    to: contact.phone,
    from: TWILIO_PHONE_NUMBER,
    twiml: `
      <Response>
        <Say voice="alice" language="es-ES">
          EMERGENCIA SOS. Juan Pérez necesita ayuda urgente.
          Ubicación: Avenida Corrientes 1234, Buenos Aires.
          Latitud: menos 34 punto 60. Longitud: menos 58 punto 38.
          Presione cualquier tecla para confirmar que recibió este mensaje.
        </Say>
        <Gather numDigits="1" timeout="15">
          <Say>Presione cualquier número para confirmar.</Say>
        </Gather>
        <Redirect>/voice/no-response</Redirect>
      </Response>
    `,
    statusCallback: 'https://yourapi.com/twilio/call-status',
    statusCallbackEvent: ['answered', 'completed'],
    timeout: 30,
    record: true
  });
  
  return call;
}
```

##### **SMS Simultáneos:**
```javascript
// TwilioSMSService.js
async function sendEmergencySMS(contact, location) {
  const message = await twilio.messages.create({
    to: contact.phone,
    from: TWILIO_PHONE_NUMBER,
    body: `
🚨 EMERGENCIA SOS!

${userName} necesita ayuda urgente.

📍 Ubicación:
${location.address}
https://www.google.com/maps?q=${location.latitude},${location.longitude}

⏰ ${new Date().toLocaleString('es-AR')}

Este mensaje fue enviado automáticamente por BrazaleteSOS.
    `
  });
  
  return message;
}
```

##### **Detección Inteligente de Respuesta:**
```javascript
// CallMonitoringService.js
function monitorCallStatus(callSid, contact) {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const call = await twilio.calls(callSid).fetch();
      
      if (call.status === 'completed') {
        clearInterval(checkInterval);
        
        // Análisis de duración para detectar respuesta
        if (call.duration > 10) {
          // ✅ Llamada respondida (más de 10 segundos)
          logSuccess(contact, call);
          resolve({ answered: true, contact });
        } else {
          // ❌ No respondida (colgó rápido o buzón)
          logNoAnswer(contact, call);
          resolve({ answered: false, contact });
        }
      } else if (call.status === 'busy') {
        // 📵 Ocupado - reintentar
        clearInterval(checkInterval);
        resolve({ answered: false, busy: true, contact });
      } else if (call.status === 'no-answer') {
        // 🔇 No contesta
        clearInterval(checkInterval);
        resolve({ answered: false, contact });
      }
    }, 2000); // Check cada 2 segundos
  });
}
```

##### **Algoritmo de Escalamiento:**
```javascript
// EmergencyProtocol.js
async function executeEmergencyProtocol(contacts, location) {
  // Ordenar contactos por prioridad
  const sortedContacts = contacts.sort((a, b) => a.priority - b.priority);
  
  // Enviar SMS a TODOS inmediatamente
  await Promise.all(
    sortedContacts.map(contact => sendEmergencySMS(contact, location))
  );
  
  // Llamadas escalonadas con detección
  for (const contact of sortedContacts) {
    let attempts = 0;
    let answered = false;
    
    while (attempts < 2 && !answered) {
      console.log(`Llamando a ${contact.name} (intento ${attempts + 1})`);
      
      const call = await makeEmergencyCall(contact, location);
      const result = await monitorCallStatus(call.sid, contact);
      
      if (result.answered) {
        answered = true;
        console.log(`✅ ${contact.name} respondió la llamada`);
        
        // Opcional: continuar llamando a otros contactos
        // o detener aquí si solo necesitas 1 confirmación
        break;
      } else if (result.busy) {
        console.log(`📵 ${contact.name} ocupado, reintentando en 30s...`);
        await delay(30000); // 30 segundos
      } else {
        console.log(`❌ ${contact.name} no respondió`);
        await delay(15000); // 15 segundos antes de siguiente intento
      }
      
      attempts++;
    }
    
    if (!answered) {
      console.log(`⚠️ ${contact.name} no respondió después de 2 intentos`);
      // Pasar al siguiente contacto
    }
    
    // Pequeña pausa antes del siguiente contacto
    await delay(5000);
  }
  
  // Si nadie respondió después de todos los intentos
  // Protocolo de emergencia extremo (opcional)
  await callEmergencyServices(); // 911, 112, etc.
}
```

**D. Configuración de Contactos**
```javascript
// ContactsScreen.js
const contactSchema = {
  id: string,
  name: string,
  phone: string,        // Formato: +54911xxxxxxxx
  priority: number,     // 1 = más importante
  relationship: string, // "family", "friend", "medical", "emergency"
  photo: string,        // URI opcional
  notes: string         // Notas adicionales
};

// Ejemplo:
const contacts = [
  {
    id: '1',
    name: 'María Pérez (Esposa)',
    phone: '+5491123456789',
    priority: 1,
    relationship: 'family'
  },
  {
    id: '2',
    name: 'Dr. González',
    phone: '+5491187654321',
    priority: 2,
    relationship: 'medical'
  },
  {
    id: '3',
    name: 'Emergencias 911',
    phone: '911',
    priority: 3,
    relationship: 'emergency'
  }
];
```

**E. Gestión de Configuración**
```javascript
// SettingsManager.js
const config = {
  // Twilio
  twilioAccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  twilioAuthToken: 'your_auth_token',
  twilioPhoneNumber: '+1234567890',
  
  // Usuario
  userId: 'user_123',
  userName: 'Juan Pérez',
  userPhone: '+5491123456789',
  homeAddress: 'Av. Corrientes 1234, CABA',
  
  // Protocolo
  retryAttempts: 2,
  retryDelay: 30000, // 30 segundos
  escalationDelay: 60000, // 60 segundos
  
  // BLE
  brazaleteDeviceId: 'BrazaleteSOS_001',
  autoReconnect: true,
  scanTimeout: 30000
};
```

### 3. **API REST (Opcional - Para Logging)**

Aunque el flujo principal es directo (Brazalete → App → Twilio), puedes mantener una API simple para:
- Logging de alertas
- Historial de emergencias
- Analytics
- Backup de configuración

```python
# FastAPI endpoints básicos:
POST /api/v1/alerts/log      # Registrar alerta
GET  /api/v1/alerts/{user_id} # Historial
POST /api/v1/config/backup   # Backup configuración
GET  /api/v1/config/restore  # Restaurar configuración
```

---

## 📱 Estructura del Proyecto React Native

```
BrazaleteSOS/
├── src/
│   ├── services/
│   │   ├── BLEService.js              # Manejo Bluetooth
│   │   ├── TwilioVoiceService.js      # Llamadas
│   │   ├── TwilioSMSService.js        # SMS
│   │   ├── CallMonitoringService.js   # Detección respuesta
│   │   ├── EmergencyProtocol.js       # Lógica escalamiento
│   │   ├── GeolocationService.js      # GPS
│   │   └── StorageService.js          # AsyncStorage
│   │
│   ├── screens/
│   │   ├── HomeScreen.js              # Dashboard principal
│   │   ├── ContactsScreen.js          # Gestión contactos
│   │   ├── SettingsScreen.js          # Configuración
│   │   ├── BLEConnectionScreen.js     # Conectar brazalete
│   │   └── AlertHistoryScreen.js      # Historial
│   │
│   ├── components/
│   │   ├── ContactCard.js
│   │   ├── BLEStatusIndicator.js
│   │   ├── EmergencyButton.js
│   │   └── AlertCard.js
│   │
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   │
│   └── config/
│       ├── twilio.config.js
│       └── ble.config.js
│
├── android/                           # Configuración Android
├── ios/                               # Configuración iOS (opcional)
└── package.json
```

---

## 🔐 Configuración de Twilio

### Obtener Credenciales:

1. **Crear cuenta Twilio**: https://www.twilio.com/try-twilio
2. **Obtener números de prueba** (gratis)
3. **Credenciales necesarias**:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token_here
   Phone Number: +1234567890 (Twilio number)
   ```

### Costos Aproximados:
```
📞 Llamadas salientes: ~$0.013/minuto
📱 SMS saliente: ~$0.0075/mensaje
📲 Número telefónico: ~$1/mes

Ejemplo de emergencia:
- 3 contactos
- 1 SMS c/u = $0.0225
- 1 llamada 30s c/u = $0.0195
Total: ~$0.042 por emergencia
```

---

## 🎯 Requerimientos del Sistema

### Funcionales:
- ✅ Alerta por botón físico en brazalete
- ✅ Comunicación BLE estable (rango 10-30m)
- ✅ **Llamadas pregrabadas automáticas**
- ✅ **SMS con ubicación GPS en tiempo real**
- ✅ **Detección inteligente de respuesta**
- ✅ **Reintentos automáticos si no responden**
- ✅ Confirmación visual/auditiva en brazalete
- ✅ Gestión de múltiples contactos por prioridad
- ✅ Funciona sin conexión a internet (alerta local)

### No Funcionales:
- ✅ Autonomía brazalete: 24-48h con batería 500mAh
- ✅ Latencia de alerta: < 10 segundos
- ✅ Tamaño brazalete: Máx. 45×25×12 mm
- ✅ Compatibilidad: Android 8.0+ con BLE
- ✅ Código modular y documentado
- ✅ Protección eléctrica (PCM + TP4056)

---

## 🚀 Plan de Implementación

### Fase 1: Firmware Brazalete
- [ ] Código ESP32-S3 con BLE
- [ ] Manejo de botón SOS
- [ ] LED y buzzer feedback
- [ ] Deep sleep y gestión energía
- [ ] Protocolo JSON para comunicación

### Fase 2: App React Native
- [ ] Setup proyecto React Native CLI
- [ ] Implementar BLE service
- [ ] Implementar Twilio Voice (llamadas)
- [ ] Implementar Twilio SMS
- [ ] Detección de respuesta de llamadas
- [ ] Algoritmo de escalamiento
- [ ] UI para configurar contactos
- [ ] Testing con números reales

### Fase 3: Testing e Integración
- [ ] Testing BLE brazalete ↔ app
- [ ] Testing llamadas Twilio reales
- [ ] Testing SMS con ubicación
- [ ] Testing detección de respuesta
- [ ] Testing protocolo completo end-to-end
- [ ] Optimización de batería
- [ ] Testing en escenarios reales

### Fase 4: Producción (Opcional)
- [ ] APK firmado para distribución
- [ ] Documentación de usuario
- [ ] Setup cuenta Twilio producción
- [ ] Monitoreo y analytics
- [ ] Soporte y mantenimiento

---

## 💡 Principios de Diseño

### KISS (Keep It Simple, Stupid)
- Flujo directo: Brazalete → App → Twilio
- Sin arquitecturas complejas innecesarias
- Código limpio y mantenible
- Funcionalidad core primero, features después

### Confiabilidad
- Reintentos automáticos
- Múltiples contactos de respaldo
- Alertas locales si falla conectividad
- Logging completo para debugging

### Experiencia de Usuario
- Setup en < 5 minutos
- Operación con un solo botón
- Confirmación inmediata visual/auditiva
- Configuración simple e intuitiva

---

## 📊 Métricas de Éxito

1. **Tiempo de respuesta**: < 10 segundos desde botón hasta primera llamada
2. **Tasa de entrega**: > 95% de alertas completadas exitosamente
3. **Detección de respuesta**: > 90% de precisión
4. **Autonomía**: Mínimo 24 horas de uso continuo
5. **Confiabilidad BLE**: Reconexión automática en < 30 segundos

---



## 📚 Referencias Importantes

- **Twilio Voice API**: https://www.twilio.com/docs/voice
- **Twilio SMS API**: https://www.twilio.com/docs/sms
- **React Native BLE**: https://github.com/dotintent/react-native-ble-plx
- **ESP32-S3 Docs**: https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/


**Este prompt contiene toda la información necesaria para desarrollar el sistema BrazaleteSOS completo con enfoque en Twilio para llamadas y SMS con detección inteligente de respuesta.**