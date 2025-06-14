import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

class Config:
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
    DB_NAME = os.getenv('DB_NAME', 'galvaniz')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    MODEL_PATH = os.getenv('MODEL_PATH', './models/duration_model.pkl')
    MIN_TRAINING_DATA = int(os.getenv('MIN_TRAINING_DATA', 5))
    
    @property
    def DB_CONFIG(self):
        """Database connection dictionary"""
        return {
            'host': self.DB_HOST,
            'user': self.DB_USER,
            'password': self.DB_PASSWORD,
            'database': self.DB_NAME,
            'port': self.DB_PORT
        }
    
    def __repr__(self):
        return f"<Config DB={self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}>"

config = Config()