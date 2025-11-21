#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin del boton
const int BUTTON_PIN = 6;

// UUIDs (deben coincidir con la app)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define DEVICE_NAME         "BrazaleteSOS_001"

// Variables BLE
BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

// Control del boton
int lastButtonState = HIGH;
unsigned long lastAlertTime = 0;

// Callback de conexion
class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("CONECTADO");
    }
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("DESCONECTADO");
      BLEDevice::startAdvertising();
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("BrazaleteSOS iniciando...");
  
  // Configurar boton
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Inicializar BLE
  BLEDevice::init(DEVICE_NAME);
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();
  
  Serial.println("BLE iniciado - Esperando conexion...");
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  
  // Boton presionado (LOW porque usa pull-up)
  if (buttonState == LOW && lastButtonState == HIGH) {
    delay(50); // Anti-rebote
    
    // Verificar cooldown de 2 segundos
    if (millis() - lastAlertTime > 2000) {
      Serial.println("BOTON PRESIONADO");
      
      if (deviceConnected) {
        // Enviar mensaje JSON simple
        String mensaje = "{\"user_id\":\"user_123\",\"device_id\":\"BrazaleteSOS_001\",\"timestamp\":\"" + 
                        String(millis()) + "\",\"battery_level\":100,\"alert_type\":\"SOS\"}";
        
        pCharacteristic->setValue(mensaje.c_str());
        pCharacteristic->notify();
        
        Serial.println("ALERTA ENVIADA");
        Serial.println(mensaje);
        lastAlertTime = millis();
      } else {
        Serial.println("NO CONECTADO - No se puede enviar");
      }
    }
  }
  
  lastButtonState = buttonState;
  delay(10);
}
