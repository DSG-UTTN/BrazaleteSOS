from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Schema para SOS Alert Request
class SOSAlertRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None

# Schema para SOS Alert Response
class SOSAlertResponse(BaseModel):
    alert_id: int
    status: str
    notifications_sent: int
    message: str

# Schema para User
class UserBase(BaseModel):
    name: str
    phone: str

class UserCreate(UserBase):
    id: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema para Emergency Contact
class EmergencyContactBase(BaseModel):
    name: str
    phone: str
    priority: Optional[int] = 1

class EmergencyContactCreate(EmergencyContactBase):
    user_id: str

class EmergencyContact(EmergencyContactBase):
    id: int
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema para Alert
class AlertBase(BaseModel):
    latitude: float
    longitude: float

class Alert(AlertBase):
    id: int
    user_id: str
    status: str
    notifications_sent: int
    created_at: datetime
    
    class Config:
        from_attributes = True