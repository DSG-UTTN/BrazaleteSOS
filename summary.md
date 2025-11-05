# 🧠 Contexto resumido para IA – Brazalete de Emergencia BLE

**Proyecto:** Brazalete inteligente de emergencia basado en ESP32-S3 Supermini + App móvil React Native.

**Objetivo:** Emitir alertas SOS mediante BLE hacia una app pasarela que use el móvil para enviar notificaciones por:
1. REST API
2. SMS
3. Llamada telefónica
4. WhatsApp API

---

## 🧩 Arquitectura
**Capa 1 – Hardware**
- MCU: ESP32-S3 Supermini (BLE/Wi-Fi, 3.3V)
- Batería LiPo 3.7V (200–900 mAh)
- Cargador TP4056 + PCM
- Regulador buck-boost 3.3V (TPS63021 o similar)
- Botón SOS, LED y buzzer

**Capa 2 – App móvil (React Native)**
- BLE con `react-native-ble-plx`
- GPS con `react-native-geolocation-service`
- Comunicación: Axios (API), Linking (SMS/Llamada/WhatsApp)
- Configuración de contactos y pruebas

---

## ⚙️ Requerimientos
**Funcionales**
- Alerta por botón físico  
- Comunicación BLE estable  
- Envío escalonado: API → SMS → Llamada → WhatsApp  
- Confirmación visual/auditiva  
- Uso del GPS del móvil  

**No Funcionales**
- Autonomía 1–5 h (200–900 mAh)  
- Tamaño máx. 45×25×12 mm  
- Android 10+ BLE compatible  
- Código modular/documentado  
- Protección eléctrica (PCM + TP4056)  

---

## 🔋 Regulador – Especificaciones
- Tipo: Buck-boost (1S LiPo → 3.3V)  
- Vin: 1.8–5.5V | Vout: 3.3V ±1%  
- Iout ≥ 500mA (pico ≥ 1A)  
- Eficiencia ≥ 85%  
- Iq ≤ 50µA  
- Protecciones: OCP, OVP, OTP, UVP  
- EN pin para apagado  

---

## 🧱 Lineamientos para IA
- Mantener código limpio, modular y eficiente  
- Priorizar compatibilidad con ESP32-S3 y Android  
- Explicar decisiones técnicas brevemente  
- Evitar dependencias pesadas o GSM  
- Considerar consumo y tamaño en cada diseño  

---

**Metas iniciales:**
- Prototipo funcional BLE (botón → app → alerta)  
- Autonomía ≥ 1h  
- Documentación completa y trazable  
