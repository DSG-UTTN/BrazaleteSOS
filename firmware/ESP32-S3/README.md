# 🚨 BrazaleteSOS - Firmware ESP32-S3

Firmware para el brazalete de emergencia ESP32-S3 que se conecta vía BLE con la app React Native.

## 📋 Requisitos

### Hardware
- ESP32-S3 Supermini (o cualquier ESP32-S3)
- Botón push conectado a GPIO 6
- Cable USB-C para programación

### Software
- Arduino IDE 2.x
- Placa ESP32 instalada en Arduino IDE
- Biblioteca ArduinoJson

## 🔧 Instalación de Dependencias

### 1. Instalar Soporte para ESP32 en Arduino IDE

1. Abre Arduino IDE
2. Ve a `Archivo > Preferencias`
3. En "Gestor de URLs Adicionales de Tarjetas", agrega:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Ve a `Herramientas > Placa > Gestor de Tarjetas`
5. Busca "ESP32" y instala "esp32 by Espressif Systems"

### 2. Instalar Biblioteca ArduinoJson

1. Ve a `Herramientas > Administrar Bibliotecas`
2. Busca "ArduinoJson"
3. Instala "ArduinoJson by Benoit Blanchon" (versión 6.x o superior)

## ⚙️ Configuración de Arduino IDE

### Seleccionar Placa y Puerto

1. Ve a `Herramientas > Placa > esp32`
2. Selecciona "ESP32S3 Dev Module"
3. Configuración recomendada:
   - **USB CDC On Boot**: Enabled
   - **CPU Frequency**: 240MHz (WiFi/BT)
   - **Flash Size**: 4MB (según tu módulo)
   - **Partition Scheme**: Default 4MB with spiffs
   - **PSRAM**: Disabled (o según tu módulo)
   - **Upload Speed**: 921600

4. Selecciona el puerto COM correcto en `Herramientas > Puerto`

## 📤 Compilar y Subir

1. Abre el archivo `BrazaleteSOS.ino`
2. Verifica la configuración (botón de verificar ✓)
3. Sube el código (botón de flecha →)
4. Abre el Monitor Serie (`Herramientas > Monitor Serie`) a 115200 baudios

## 🔍 Verificar Funcionamiento

En el Monitor Serie deberías ver:

```
========================================
🚨 BrazaleteSOS - ESP32-S3
========================================

✅ Pin del botón configurado (GPIO 6)
🔵 Iniciando BLE...
✅ BLE iniciado correctamente
📱 Nombre del dispositivo: BrazaleteSOS_001
🔍 Esperando conexión...

========================================
✅ Sistema listo
📱 Abre la app y conecta el brazalete
🔘 Presiona el botón para enviar SOS
========================================
```

## 🔗 Conectar con la App

1. Asegúrate de que el firmware esté cargado y ejecutándose
2. Abre la app BrazaleteSOS en tu teléfono
3. El ESP32 debería aparecer como "BrazaleteSOS_001"
4. Conecta desde la app
5. Presiona el botón físico para enviar alerta SOS

## 🔧 Configuración del Hardware

### ⚡ Pin del Botón: GPIO 6

### Conexión del Botón

```
┌────────────────────────────────┐
│       ESP32-S3 Supermini       │
│                                │
│  [GPIO 6] ───────────┐        │
│                      │        │
│  [GND]   ────────────┤        │
│                      │        │
└──────────────────────┼────────┘
                       │
                   [BOTÓN SOS]
                (Push Button)
```

**Importante**:
- ✅ Usa el pull-up interno (INPUT_PULLUP)
- ✅ Presionado = LOW
- ✅ No presionado = HIGH
- ✅ NO necesitas resistencias externas

### 🔵 Nombre BLE del Dispositivo

```
Nombre: BrazaleteSOS_001
Prefijo de búsqueda: BrazaleteSOS
```

**Nota**: La app busca cualquier dispositivo que empiece con "BrazaleteSOS"

## 📊 Protocolo BLE

### UUIDs (Deben coincidir con la app)
- **Service UUID**: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Characteristic UUID**: `beb5483e-36e1-4688-b7f5-ea07361b26a8`

### ⚡ Formato del Mensaje (Delimitado)

**Formato compacto**: `alert_type|timestamp|battery_level`

```
SOS|1234567890|100
```

**Ventajas**:
- ✅ Solo ~15 bytes (vs 133 JSON)
- ✅ 1 fragmento BLE (vs 7 JSON)
- ✅ Transmisión instantánea
- ✅ Sin problemas de fragmentación

**Campos**:
- `SOS`: Tipo de alerta
- `1234567890`: Timestamp en milisegundos
- `100`: Nivel de batería (0-100)

## 🐛 Solución de Problemas

### El ESP32 no se conecta

1. Verifica que el BLE esté habilitado en tu teléfono
2. Verifica que la app tenga permisos de Bluetooth
3. Reinicia el ESP32
4. Verifica en el Monitor Serie que el BLE se inicializó correctamente

### El botón no responde

1. Verifica la conexión física del botón
2. Prueba con otro GPIO si es necesario
3. Verifica en el Monitor Serie que detecta las pulsaciones

### No aparece en la app

1. Verifica que el nombre del dispositivo sea "BrazaleteSOS_001" o empiece con "BrazaleteSOS_"
2. Los UUIDs deben coincidir exactamente con los de la app
3. Reinicia la app y el ESP32

## 📝 Personalización

### Cambiar el Nombre del Dispositivo

En el código, modifica:
```cpp
#define DEVICE_NAME "BrazaleteSOS_001"
```

### Cambiar el Pin del Botón

En el código, modifica:
```cpp
const int BUTTON_PIN = 6;  // Cambia al GPIO que uses
```

### Ajustar el Cooldown

Para cambiar el tiempo mínimo entre alertas:
```cpp
const unsigned long COOLDOWN_PERIOD = 3000;  // milisegundos
```

## 🚀 Próximas Funcionalidades (Futuras Iteraciones)

- ✅ Conexión BLE básica
- ✅ Envío de alerta SOS
- ⏳ LED de estado
- ⏳ Buzzer de confirmación
- ⏳ Sensor de batería
- ⏳ Deep sleep para ahorro de energía
- ⏳ Heartbeat periódico
- ⏳ Reconexión automática mejorada

## 📚 Referencias

- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [ArduinoJson Documentation](https://arduinojson.org/)
- [ESP32 BLE Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/bluetooth/index.html)

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
