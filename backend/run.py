#!/usr/bin/env python3
"""
Script de inicio para PaperLens Backend
Configura el entorno y ejecuta la aplicación Flask
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_python_version():
    """Verificar que la versión de Python sea compatible"""
    if sys.version_info < (3, 8):
        logger.error("Se requiere Python 3.8 o superior")
        sys.exit(1)
    logger.info(f"Python {sys.version_info.major}.{sys.version_info.minor} detectado")

def check_dependencies():
    """Verificar que las dependencias estén instaladas"""
    try:
        import flask
        import pandas
        import numpy
        import xgboost
        import requests
        logger.info("Todas las dependencias están instaladas")
    except ImportError as e:
        logger.error(f"Dependencia faltante: {e}")
        logger.info("Ejecuta: pip install -r requirements.txt")
        sys.exit(1)

def check_model_file():
    """Verificar que el archivo del modelo existe"""
    model_path = Path("../models/paperlens_xgb_pipeline.pkl")
    if not model_path.exists():
        logger.error("Archivo del modelo no encontrado: ../models/paperlens_xgb_pipeline.pkl")
        sys.exit(1)
    logger.info("Archivo del modelo encontrado")

def setup_environment():
    """Configurar variables de entorno para desarrollo"""
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('DEBUG', 'True')
    os.environ.setdefault('PORT', '5000')
    os.environ.setdefault('HOST', '0.0.0.0')
    
    # Clave secreta para desarrollo
    if not os.environ.get('SECRET_KEY'):
        os.environ['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    
    logger.info("Variables de entorno configuradas para desarrollo")

def run_app():
    """Ejecutar la aplicación Flask"""
    try:
        from app import app
        port = int(os.environ.get('PORT', 5000))
        host = os.environ.get('HOST', '0.0.0.0')
        
        logger.info(f"Iniciando PaperLens Backend en http://{host}:{port}")
        logger.info("Presiona Ctrl+C para detener el servidor")
        
        app.run(
            host=host,
            port=port,
            debug=True,
            use_reloader=True
        )
        
    except KeyboardInterrupt:
        logger.info("Servidor detenido por el usuario")
    except Exception as e:
        logger.error(f"Error al ejecutar la aplicación: {e}")
        sys.exit(1)

def main():
    """Función principal"""
    print("🚀 Iniciando PaperLens Backend...")
    print("=" * 50)
    
    # Verificaciones previas
    check_python_version()
    check_dependencies()
    check_model_file()
    setup_environment()
    
    print("=" * 50)
    print("✅ Todas las verificaciones completadas")
    print("🌐 Backend listo para recibir requests")
    print("=" * 50)
    
    # Ejecutar la aplicación
    run_app()

if __name__ == "__main__":
    main() 