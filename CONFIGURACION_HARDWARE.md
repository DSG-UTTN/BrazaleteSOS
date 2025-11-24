# ⚙️ Configuración de Hardware - BrazaleteSOS

## 📱 Configuración del ESP32-S3

### 🔌 Conexiones del Botón SOS

```
┌─────────────────────────────────────┐
│         ESP32-S3 Supermini          │
│                                     │
│  GPIO 6 ────────────┐              │
│                     │              │
│  GND ───────────────┤              │
│                     │              │
└─────────────────────┼──────────────┘
                      │
                  [BOTÓN SOS]
```

#### Especificaciones:
- **Pin utilizado**: GPIO 6
- **Tipo de conexión**: INPUT_PULLUP (resistencia pull-up interna)
- **Lógica**: Presionado = LOW, No presionado = HIGH
- **Rebote**: Filtrado por software (50ms)

### 📋 Instrucciones de Conexión:

1. **Terminal 1 del botón** → GPIO 6 del ESP32-S3
2. **Terminal 2 del botón** → GND del ESP32-S3

**Nota**: El ESP32 usa resistencia pull-up interna, no necesitas resistencias externas.

---

## 🔵 Configuración Bluetooth (BLE)

### Identificadores del Dispositivo

| Parámetro | Valor |
|-----------|-------|
| **Nombre del dispositivo** | `BrazaleteSOS_001` |
| **Prefijo de búsqueda** | `BrazaleteSOS` |
| **Service UUID** | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| **Characteristic UUID** | `beb5483e-36e1-4688-b7f5-ea07361b26a8` |

### ⚠️ Importante:
- El nombre DEBE empezar con "BrazaleteSOS" para que la app lo detecte
- Los UUIDs DEBEN coincidir exactamente entre ESP32 y la app
- Si cambias el nombre del dispositivo, actualiza ambos archivos:
  - `firmware/ESP32-S3/BrazaleteSOS.ino` → `#define DEVICE_NAME`
  - `src/utils/constants.ts` → `DEVICE_NAME_PREFIX`

---

## 📊 Protocolo de Comunicación

### ⚡ Formato Delimitado (Ultra Rápido)

Cuando presionas el botón, el ESP32 envía este mensaje compacto por BLE:

```
SOS|123456789|100
```

### 🎯 Estructura:
```
alert_type | timestamp | battery_level
```

**Campos**:
- Campo 1: `alert_type` - Tipo de alerta (SOS, PANIC, FALL, etc.)
- Campo 2: `timestamp` - Milisegundos desde que inició el ESP32
- Campo 3: `battery_level` - Nivel de batería (0-100)

**Ventajas sobre JSON**:
- ✅ **15 bytes** vs 133 bytes (89% más pequeño)
- ✅ **1 fragmento BLE** vs 7 fragmentos
- ✅ **Instantáneo** - Sin problemas de fragmentación
- ✅ **Fácil debug** - Legible en Serial Monitor

---

## 🔧 Configuración en Arduino IDE

### Placa y Configuración

1. **Placa**: ESP32S3 Dev Module
2. **Configuración recomendada**:
   ```
   USB CDC On Boot: Enabled
   CPU Frequency: 240MHz (WiFi/BT)
   Flash Size: 4MB
   Partition Scheme: Default 4MB with spiffs
   Upload Speed: 921600
   ```

3. **Puerto Serial**: 115200 baudios para monitor

---

## 🧪 Verificación de Funcionamiento

### ✅ Checklist de Prueba:

#### 1. Hardware ESP32:
- [ ] Botón conectado correctamente (GPIO 6 y GND)
- [ ] ESP32 alimentado y programado
- [ ] Serial Monitor muestra: "BLE iniciado - Esperando conexion..."

#### 2. Conexión BLE:
- [ ] App encuentra el dispositivo "BrazaleteSOS_001"
- [ ] Estado en app muestra: "Conectado ✓"
- [ ] Serial Monitor del ESP muestra: "CONECTADO"

#### 3. Prueba del Botón:
- [ ] Presionar botón físico
- [ ] Serial Monitor muestra: "BOTON PRESIONADO" y "ALERTA ENVIADA"
- [ ] App muestra diálogo: "🚨 ALERTA SOS"
- [ ] Al confirmar, se envían SMS y llamadas

---

## 🐛 Solución de Problemas

### Problema: "Botón no responde"

**Verificar**:
1. Conexión física del botón
2. Usar un multímetro para verificar continuidad
3. Probar con otro GPIO si es necesario

**En código, cambiar**:
```cpp
const int BUTTON_PIN = 6;  // Cambiar a otro GPIO
```

### Problema: "No se detecta el brazalete en la app"

**Verificar**:
1. Serial Monitor muestra "BLE iniciado"
2. Permisos de Bluetooth y Ubicación en la app
3. Nombre del dispositivo coincide

**Ver logs**:
```bash
adb logcat -s ReactNativeJS:V
```

### Problema: "Se conecta con nRF Connect pero no con la app"

**Causas**:
1. Permisos de ubicación no concedidos
2. Otra app está conectada (cerrar nRF Connect)
3. Reiniciar ESP32 y app

**Solución**:
```bash
# Otorgar permisos manualmente
adb shell pm grant com.brazaletesos android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.brazaletesos android.permission.BLUETOOTH_SCAN
adb shell pm grant com.brazaletesos android.permission.BLUETOOTH_CONNECT
```

---

## 📝 Personalización

### Cambiar el Pin del Botón

**Archivo**: `firmware/ESP32-S3/BrazaleteSOS.ino`

```cpp
const int BUTTON_PIN = 6;  // ← Cambiar aquí
```

### Cambiar el Nombre del Dispositivo

**Archivo 1**: `firmware/ESP32-S3/BrazaleteSOS.ino`
```cpp
#define DEVICE_NAME "BrazaleteSOS_002"  // ← Tu nuevo nombre
```

**Archivo 2**: `src/utils/constants.ts` (si cambias el prefijo)
```typescript
DEVICE_NAME_PREFIX: 'BrazaleteSOS',  // ← Mantener para detectar todos
```

### Cambiar el Cooldown del Botón

**Archivo**: `firmware/ESP32-S3/BrazaleteSOS.ino`

```cpp
if (millis() - lastAlertTime > 2000) {  // ← 2000ms = 2 segundos
```

---

## 📚 Referencias

- **GPIO del ESP32-S3**: [Pinout oficial](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/)
- **BLE con ESP32**: [Documentación](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/bluetooth/index.html)
- **React Native BLE PLX**: [GitHub](https://github.com/dotintent/react-native-ble-plx)

---

**Última actualización**: Noviembre 2025  
**Versión del firmware**: 1.0.0  
**Versión de la app**: 1.0.0
