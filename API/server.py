#!/usr/bin/env python
"""
Script de arranque para la API BrazaleteSOS
"""
import os
import sys

# Agregar el directorio actual al path de Python
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    print("🚀 Iniciando BrazaleteSOS API...")
    print(f"📂 Directorio de trabajo: {current_dir}")
    print("🌐 Servidor disponible en: http://localhost:8000")
    print("📖 Documentación en: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,  # Desactivar reload para evitar warnings
        log_level="info"
    )