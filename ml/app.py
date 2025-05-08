from flask import Flask, request, jsonify
import pickle
import numpy as np
import mysql.connector
from sklearn.linear_model import LinearRegression
app = Flask(__name__)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'user',
    'password': 'password',
    'database': 'galvaniz'
}


@app.route('/train', methods=['POST'])
def train():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT product_id, company_id, quantity, acid_pool_time_minutes
            FROM performance_logs
            WHERE acid_pool_time_minutes IS NOT NULL
        """)
        records = cursor.fetchall()

        cursor.close()
        connection.close()

        if len(records) < 5:
            return jsonify({'success': False, 'message': 'Yeterli veri yok!'})

        X = np.array([[r['product_id'], r['company_id'], r['quantity']] for r in records])
        y = np.array([r['acid_pool_time_minutes'] for r in records])

        model = LinearRegression()
        model.fit(X, y)

        with open('duration_model.pkl', 'wb') as f:
            pickle.dump(model, f)

        return jsonify({'success': True, 'message': f'Model başarıyla eğitildi. Veri adedi: {len(records)}'})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'message': str(e)})  


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    product_id = int(data['product_id'])
    company_id = int(data['company_id'])
    quantity = int(data['quantity'])

    input_data = np.array([[product_id, company_id, quantity]])
    
    with open('duration_model.pkl', 'rb') as f:
        model = pickle.load(f)

    prediction = model.predict(input_data)[0]

    return jsonify({'predicted_duration': prediction})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)