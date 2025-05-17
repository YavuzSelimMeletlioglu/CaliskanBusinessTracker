from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import mysql.connector
from sklearn.linear_model import LinearRegression

ml_bp = Blueprint('ml', __name__)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'user',
    'password': 'password',
    'database': 'galvaniz'
}

@ml_bp.route('/train', methods=['POST'])
def train_model():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT product_id, company_id, quantity, acid_pool_time_minutes
            FROM performance_logs
            WHERE acid_pool_time_minutes IS NOT NULL
        """)
        records = cursor.fetchall()
        conn.close()

        if len(records) < 5:
            return jsonify({'success': False, 'message': 'Yeterli veri yok'})

        X = np.array([[r['product_id'], r['company_id'], r['quantity']] for r in records])
        y = np.array([r['acid_pool_time_minutes'] for r in records])

        model = LinearRegression().fit(X, y)

        with open('duration_model.pkl', 'wb') as f:
            pickle.dump(model, f)

        return jsonify({'success': True, 'message': 'Model eğitildi', 'count': len(records)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@ml_bp.route('/predict', methods=['POST'])
def predict_duration():
    data = request.get_json()
    try:
        X = np.array([[data['product_id'], data['company_id'], data['quantity']]])
        with open('duration_model.pkl', 'rb') as f:
            model = pickle.load(f)
        prediction = model.predict(X)[0]
        return jsonify({'predicted_duration': prediction})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})