from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelo User
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación con contactos de emergencia
    emergency_contacts = relationship("EmergencyContact", back_populates="user")

# Modelo Emergency Contact
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String, index=True)
    phone = Column(String, index=True)
    priority = Column(Integer, default=1)  # 1 = más prioritario
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación con user
    user = relationship("User", back_populates="emergency_contacts")

# Modelo Alert (opcional para registro)
class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="sent")
    notifications_sent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

# Dependencia para obtener DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()