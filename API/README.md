# BrazaleteSOS API Simple

API REST simplificada para recibir alertas SOS del brazalete y enviar notificaciones SMS.

## 🚀 Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## ▶️ Ejecutar

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📡 Endpoint Principal

**POST /alert/sos**
```json
{
  "user_id": "12345",
  "latitude": -34.6037,
  "longitude": -58.3816,
  "timestamp": "2025-11-03T14:30:00Z"
}
```

## 📖 Documentación

Swagger UI: http://localhost:8000/docs