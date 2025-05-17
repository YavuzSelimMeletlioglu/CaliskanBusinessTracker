from flask import Flask
from motor import motor_bp
from ml import ml_bp

app = Flask(__name__)

# Blueprint'leri kaydet
app.register_blueprint(motor_bp, url_prefix='/motor')
app.register_blueprint(ml_bp, url_prefix='/ml')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)