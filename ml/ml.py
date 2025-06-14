from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import mysql.connector
import os
from sklearn.linear_model import LinearRegression
from config import config

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/train', methods=['POST'])
def train_model():
    try:
        # Config'den database ayarlarını al
        conn = mysql.connector.connect(**config.DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT product_id, company_id, quantity, acid_pool_time_minutes
            FROM performance_logs
            WHERE acid_pool_time_minutes IS NOT NULL
        """)
        records = cursor.fetchall()
        conn.close()

        if len(records) < config.MIN_TRAINING_DATA:
            return jsonify({
                'success': False, 
                'message': f'Yeterli veri yok. En az {config.MIN_TRAINING_DATA} kayıt gerekli.'
            })

        X = np.array([[r['product_id'], r['company_id'], r['quantity']] for r in records])
        y = np.array([r['acid_pool_time_minutes'] for r in records])

        model = LinearRegression().fit(X, y)

        model_dir = os.path.dirname(config.MODEL_PATH)
        if model_dir and not os.path.exists(model_dir):
            os.makedirs(model_dir)

        with open(config.MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)

        return jsonify({
            'success': True, 
            'message': 'Model eğitildi', 
            'count': len(records),
            'model_path': config.MODEL_PATH
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@ml_bp.route('/predict', methods=['POST'])
def predict_duration():
    try:
        if not os.path.exists(config.MODEL_PATH):
            return jsonify({
                'success': False, 
                'message': f'Model bulunamadı: {config.MODEL_PATH}. Önce modeli eğitmeniz gerekiyor.'
            })

        data = request.get_json()
        
        # Veri kontrolü
        required_fields = ['product_id', 'company_id', 'quantity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False, 
                'message': f'Eksik parametreler. Gerekli alanlar: {", ".join(required_fields)}'
            })

        X = np.array([[data['product_id'], data['company_id'], data['quantity']]])
        
        with open(config.MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        
        prediction = model.predict(X)[0]
        
        return jsonify({
            'success': True,
            'predicted_duration': float(prediction)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@ml_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'message': 'ML service is running',
        'config': {
            'db_host': config.DB_HOST,
            'model_path': config.MODEL_PATH,
            'environment': config.FLASK_ENV
        }
    })

@ml_bp.route('/config', methods=['GET'])
def get_config():
    """Debug endpoint - production'da kaldırılmalı"""
    return jsonify({
        'db_host': config.DB_HOST,
        'db_name': config.DB_NAME,
        'model_path': config.MODEL_PATH,
        'min_training_data': config.MIN_TRAINING_DATA,
        'environment': config.FLASK_ENV
    })