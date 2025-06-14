from flask import Flask
from config import config

"""
# Blueprintleri import et
try:
    from motor import motor_bp
    print("✓ motor_bp başarıyla import edildi")
except ImportError as e:
    print(f"✗ motor_bp import hatası: {e}")
    motor_bp = None
"""

try:
    from ml import ml_bp
    print("✓ ml_bp başarıyla import edildi")
except ImportError as e:
    print(f"✗ ml_bp import hatası: {e}")
    ml_bp = None

app = Flask(__name__)

"""
# Blueprint'leri kaydet
if motor_bp:
    app.register_blueprint(motor_bp, url_prefix='/motor')
    print("✓ motor_bp blueprint kaydedildi")
"""
if ml_bp:
    app.register_blueprint(ml_bp, url_prefix='/ml')
    print("✓ ml_bp blueprint kaydedildi")

# Ana route
@app.route('/')
def hello():
    return {
        'message': 'Flask uygulaması çalışıyor!',
        'environment': config.FLASK_ENV,
        'blueprints': list(app.blueprints.keys())
    }

# Health check
@app.route('/health')
def health():
    return {
        'status': 'healthy',
        'environment': config.FLASK_ENV,
        'debug': config.FLASK_DEBUG
    }

if __name__ == '__main__':
    print(f"🚀 Flask uygulaması başlatılıyor...")
    print(f"📍 Host: {config.FLASK_HOST}:{config.FLASK_PORT}")
    print(f"🗄️  Database: {config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}")
    print(f"📁 Model Path: {config.MODEL_PATH}")
    print(f"📝 Kayıtlı Blueprint'ler: {list(app.blueprints.keys())}")
    
    app.run(
        host=config.FLASK_HOST, 
        port=config.FLASK_PORT, 
        debug=config.FLASK_DEBUG
    )