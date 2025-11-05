import requests
import os
from typing import List
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.api_key = os.getenv("SMS_API_KEY", "demo_key")
        self.service_url = os.getenv("SMS_SERVICE_URL", "https://httpbin.org/post")  # URL de prueba
    
    def send_sms(self, phone: str, message: str) -> bool:
        """
        Envía SMS a un número de teléfono
        Por ahora usa httpbin.org para simular el envío
        """
        try:
            payload = {
                "to": phone,
                "message": message,
                "api_key": self.api_key
            }
            
            response = requests.post(
                self.service_url,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"SMS enviado exitosamente a {phone}")
                return True
            else:
                logger.error(f"Error enviando SMS a {phone}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Excepción enviando SMS a {phone}: {str(e)}")
            return False
    
    def send_sos_notifications(self, contacts: List[dict], user_name: str, latitude: float, longitude: float) -> int:
        """
        Envía notificaciones SOS a lista de contactos
        Retorna el número de notificaciones enviadas exitosamente
        """
        google_maps_url = f"https://www.google.com/maps?q={latitude},{longitude}"
        
        message = f"🚨 EMERGENCIA SOS! {user_name} necesita ayuda urgente. Ubicación: {google_maps_url}"
        
        sent_count = 0
        
        # Ordenar contactos por prioridad (1 = más importante)
        sorted_contacts = sorted(contacts, key=lambda x: x.get('priority', 1))
        
        for contact in sorted_contacts:
            phone = contact.get('phone')
            name = contact.get('name', 'Contacto')
            
            if phone:
                logger.info(f"Enviando SOS SMS a {name} ({phone})")
                if self.send_sms(phone, message):
                    sent_count += 1
                else:
                    logger.warning(f"Falló envío SMS a {name} ({phone})")
        
        return sent_count

# Instancia global del servicio
sms_service = SMSService()