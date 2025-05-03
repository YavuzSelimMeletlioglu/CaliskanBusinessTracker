from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import io
from duration_predictor import DurationPredictorCNN
from rust_classifier import RustClassifier

# Flask uygulaması başlat
app = Flask(__name__)

# Cihaz ayarı
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Modelleri yükle
duration_model = DurationPredictorCNN()
duration_model.load_state_dict(torch.load('duration_predictor_model.pt', map_location=device))
duration_model = duration_model.to(device)
duration_model.eval()

pas_model = RustClassifier()
pas_model.load_state_dict(torch.load('pas_classifier_model.pt', map_location=device))
pas_model = pas_model.to(device)
pas_model.eval()

# Transform ayarı (fotoğrafları işlemek için)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ===========================
# ENDPOINT: Süre Tahmini
# ===========================

@app.route('/predict_duration', methods=['POST'])
def predict_duration():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided.'}), 400
    
    image = request.files['image']
    image = Image.open(io.BytesIO(image.read())).convert('RGB')
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = duration_model(image)
        duration = output.item()

    return jsonify({'predicted_duration': duration})

# ===========================
# ENDPOINT: Pas Tespiti
# ===========================

@app.route('/predict_rust', methods=['POST'])
def predict_rust():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided.'}), 400
    
    image = request.files['image']
    image = Image.open(io.BytesIO(image.read())).convert('RGB')
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = pas_model(image)
        prediction = torch.argmax(output, dim=1).item()

    result = 'pas çözüldü' if prediction == 1 else 'pas çözülmedi'

    return jsonify({'pas_result': result})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)