from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from .database import get_db, User, EmergencyContact, Alert
from .schemas import SOSAlertRequest, SOSAlertResponse, UserCreate, EmergencyContactCreate
from .services import sms_service

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="BrazaleteSOS API",
    description="API simple para recibir alertas SOS y enviar notificaciones",
    version="1.0.0"
)

# Configurar CORS para permitir acceso desde app móvil
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint de bienvenida"""
    return {
        "message": "BrazaleteSOS API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# ============ ENDPOINT PRINCIPAL SOS ============
@app.post("/alert/sos", response_model=SOSAlertResponse)
async def receive_sos_alert(alert: SOSAlertRequest, db: Session = Depends(get_db)):
    """
    Endpoint principal: Recibe alerta SOS y envía notificaciones
    """
    try:
        logger.info(f"Recibida alerta SOS de usuario {alert.user_id}")
        
        # 1. Verificar que el usuario existe
        user = db.query(User).filter(User.id == alert.user_id).first()
        if not user:
            logger.error(f"Usuario {alert.user_id} no encontrado")
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # 2. Obtener contactos de emergencia del usuario
        contacts = db.query(EmergencyContact).filter(
            EmergencyContact.user_id == alert.user_id
        ).all()
        
        if not contacts:
            logger.warning(f"Usuario {alert.user_id} no tiene contactos de emergencia")
            raise HTTPException(
                status_code=400, 
                detail="Usuario no tiene contactos de emergencia configurados"
            )
        
        # 3. Crear registro de alerta en BD
        new_alert = Alert(
            user_id=alert.user_id,
            latitude=alert.latitude,
            longitude=alert.longitude,
            status="processing"
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        
        # 4. Preparar datos de contactos para SMS
        contact_data = [
            {
                "name": contact.name,
                "phone": contact.phone,
                "priority": contact.priority
            }
            for contact in contacts
        ]
        
        # 5. Enviar notificaciones SOS via SMS
        logger.info(f"Enviando notificaciones SOS para {len(contact_data)} contactos")
        notifications_sent = sms_service.send_sos_notifications(
            contacts=contact_data,
            user_name=user.name,
            latitude=alert.latitude,
            longitude=alert.longitude
        )
        
        # 6. Actualizar status de la alerta
        new_alert.status = "sent" if notifications_sent > 0 else "failed"
        new_alert.notifications_sent = notifications_sent
        db.commit()
        
        # 7. Responder con resultado
        response = SOSAlertResponse(
            alert_id=new_alert.id,
            status=new_alert.status,
            notifications_sent=notifications_sent,
            message=f"Alerta SOS procesada. {notifications_sent} notificaciones enviadas."
        )
        
        logger.info(f"Alerta SOS {new_alert.id} procesada exitosamente")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando alerta SOS: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ============ ENDPOINTS AUXILIARES ============
@app.post("/users/")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Crear usuario"""
    db_user = User(id=user.id, name=user.name, phone=user.phone)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/contacts/")
async def create_contact(contact: EmergencyContactCreate, db: Session = Depends(get_db)):
    """Agregar contacto de emergencia"""
    db_contact = EmergencyContact(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/users/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Obtener usuario por ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@app.get("/contacts/{user_id}")
async def get_user_contacts(user_id: str, db: Session = Depends(get_db)):
    """Obtener contactos de emergencia de un usuario"""
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == user_id
    ).order_by(EmergencyContact.priority).all()
    return contacts

@app.get("/alerts/{user_id}")
async def get_user_alerts(user_id: str, db: Session = Depends(get_db)):
    """Obtener historial de alertas de un usuario"""
    alerts = db.query(Alert).filter(
        Alert.user_id == user_id
    ).order_by(Alert.created_at.desc()).limit(50).all()
    return alerts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)