from flask import Flask, request, jsonify
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)

# Sahte model (örnek)
model = LinearRegression()
X_train = np.array([[1, 1, 100], [2, 2, 200], [3, 3, 300]])  # [product_id, company_id, quantity]
y_train = np.array([10, 20, 30])  # dakika cinsinden asit havuzu süresi
model.fit(X_train, y_train)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    product_id = data['product_id']
    company_id = data['company_id']
    quantity = data['quantity']

    X_input = np.array([[product_id, company_id, quantity]])
    prediction = model.predict(X_input)[0]

    return jsonify({'predicted_acid_pool_minutes': prediction})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)