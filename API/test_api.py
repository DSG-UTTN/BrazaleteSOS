"""
Script para crear datos de prueba en la base de datos
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Probando BrazaleteSOS API...")
    
    # 1. Verificar que la API está funcionando
    print("\n1. ✅ Verificando conexión...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # 2. Crear usuario de prueba
    print("\n2. 👤 Creando usuario de prueba...")
    user_data = {
        "id": "user_123",
        "name": "Juan Pérez",
        "phone": "+5491123456789"
    }
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Usuario creado: {response.json()}")
    else:
        print(f"Error: {response.text}")
    
    # 3. Agregar contactos de emergencia
    print("\n3. 📞 Agregando contactos de emergencia...")
    contacts = [
        {
            "user_id": "user_123",
            "name": "María Pérez (Esposa)",
            "phone": "+5491198765432",
            "priority": 1
        },
        {
            "user_id": "user_123", 
            "name": "Dr. González (Médico)",
            "phone": "+5491187654321",
            "priority": 2
        },
        {
            "user_id": "user_123",
            "name": "Policía Local",
            "phone": "+54911911",
            "priority": 3
        }
    ]
    
    for contact in contacts:
        response = requests.post(f"{BASE_URL}/contacts/", json=contact)
        print(f"Contacto '{contact['name']}': Status {response.status_code}")
    
    # 4. Verificar contactos creados
    print("\n4. 📋 Verificando contactos creados...")
    response = requests.get(f"{BASE_URL}/contacts/user_123")
    if response.status_code == 200:
        contacts_list = response.json()
        print(f"Contactos encontrados: {len(contacts_list)}")
        for contact in contacts_list:
            print(f"  - {contact['name']}: {contact['phone']} (Prioridad: {contact['priority']})")
    
    # 5. Probar alerta SOS
    print("\n5. 🚨 Probando alerta SOS...")
    sos_data = {
        "user_id": "user_123",
        "latitude": -34.6037,
        "longitude": -58.3816,
        "timestamp": "2025-11-03T14:30:00Z"
    }
    
    response = requests.post(f"{BASE_URL}/alert/sos", json=sos_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Alerta SOS enviada exitosamente!")
        print(f"  - Alert ID: {result['alert_id']}")
        print(f"  - Status: {result['status']}")
        print(f"  - Notificaciones enviadas: {result['notifications_sent']}")
        print(f"  - Mensaje: {result['message']}")
    else:
        print(f"❌ Error en alerta SOS: {response.text}")
    
    # 6. Verificar historial de alertas
    print("\n6. 📊 Verificando historial de alertas...")
    response = requests.get(f"{BASE_URL}/alerts/user_123")
    if response.status_code == 200:
        alerts = response.json()
        print(f"Alertas en historial: {len(alerts)}")
        for alert in alerts:
            print(f"  - Alert {alert['id']}: {alert['status']} - {alert['notifications_sent']} SMS enviados")

if __name__ == "__main__":
    try:
        test_api()
        print("\n🎉 ¡Pruebas completadas!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar a la API. ¿Está ejecutándose en http://localhost:8000?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")