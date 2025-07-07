import os
from flask import Flask, jsonify
from config import config
from flask_cors import CORS

try:
    from ml import ml_bp
    print("✅ ml blueprint yüklendi")
except ImportError as e:
    print(f"⚠️ ml blueprint yüklenemedi: {e}")
    ml_bp = None

try:
    from rust_classifier import rust_bp
    print("✅ rust_classifier blueprint yüklendi")
except ImportError as e:
    print(f"⚠️ rust_classifier blueprint yüklenemedi: {e}")
    rust_bp = None

# Flask app oluştur
app = Flask(__name__)

# CORS'u app seviyesinde tanımla (Gunicorn için önemli)
CORS(app, origins='*')

# Blueprint'leri kaydet
if ml_bp:
    app.register_blueprint(ml_bp, url_prefix='/ml')
    print("✅ ml blueprint kaydedildi: /ml/*")

if rust_bp:
    app.register_blueprint(rust_bp, url_prefix='/rust')
    print("✅ rust blueprint kaydedildi: /rust/*")

if __name__ == '__main__':
    app.run(
        debug=os.getenv('DEBUG', True),
        host=getattr(config, 'FLASK_HOST', '0.0.0.0'), 
        port=getattr(config, 'FLASK_PORT', 5001)
    )