# PAS KONTROLÜ BLUEPRINT

from flask import Blueprint, request, jsonify
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import pickle
import io
import base64
import os
import requests

rust_bp = Blueprint('rust', __name__)

class RustDetector:
    def __init__(self, model_path):
        self.device = torch.device('cpu')
        self.model = None
        self.classes = ['CORROSION', 'NOCORROSION']
        self.load_model(model_path)
        
        # Resim dönüşümü
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self, model_path):
        """CPU-only model yükleme"""
        try:
            print(f"🔄 CPU modeli yükleniyor: {model_path}")
            
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            # Model oluştur
            self.model = models.mobilenet_v2(pretrained=False)
            self.model.classifier = nn.Sequential(
                nn.Dropout(0.2),
                nn.Linear(self.model.last_channel, 2)
            )
            
            # CPU'da ağırlıkları yükle
            self.model.load_state_dict(model_data['model_state_dict'])
            self.model.eval()  # CPU'da zaten, to() gereksiz
            
            print(f"✅ CPU modeli başarıyla yüklendi!")
            
        except Exception as e:
            print(f"❌ Model yükleme hatası: {e}")
            raise e
    
    def predict_from_image(self, image):
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            _, predicted = torch.max(outputs, 1)
            
            pred_class = predicted.item()
            
            return pred_class == 1 #paslı değil

detector = None

def init_rust_detector(model_path):
    """Pas detektörünü başlat"""
    global detector
    detector = RustDetector(model_path)
    return detector

@rust_bp.route('/check', methods=['POST'])
def check_rust():
    """Base64 encoded resimden pas kontrolü yap"""
    try:
        
        global detector
        if detector is None:
            model_path = os.getenv('RUST_MODEL_PATH', '/app/models/rust_classifier1.pkl')
            print(f"Model yükleniyor: {model_path}")
            init_rust_detector(model_path)
        
        # JSON veri kontrolü
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False, 
                'message': 'JSON verisi bulunamadı!'
            }), 400
        
        # Gerekli parametreler
        if 'image_base64' not in data:
            return jsonify({
                'success': False, 
                'message': 'image_base64 parametresi gerekli!'
            }), 400
            
        if 'pool_number' not in data:
            return jsonify({
                'success': False, 
                'message': 'pool_number parametresi gerekli!'
            }), 400
        
        pool_number = data['pool_number']
        
        # Base64 resmi decode et
        try:
            image_data = base64.b64decode(data['image_base64'])
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        except Exception as e:
            return jsonify({
                'success': False, 
                'message': f'Geçersiz base64 resim formatı: {str(e)}'
            }), 400
        
        # Pas kontrolü yap
        result = detector.predict_from_image(image)
        
        # NodeJS API URL'i
        base_url = f"http://{os.getenv('NODEJS_HOST', 'localhost')}:{os.getenv('NODEJS_PORT', '3000')}"
        req_data = {"pool_number": pool_number}
        print(result)
        # Pas durumuna göre işlem yap
        if result == False:
            url = f"{base_url}/pools/redip-product"
            try:
                requests.post(url=url, json=req_data, timeout=10)
            except Exception as e:
                print(f"Redip API hatası: {e}")
        else:
            url = f"{base_url}/pools/release-pool"
            try:
                requests.post(url=url, json=req_data, timeout=10)
            except Exception as e:
                print(f"Release API hatası: {e}")
        
        # Başarılı sonuç döndür
        return jsonify({
            'success': True,
            'result': result,
        })
        
    except Exception as e:
        print(f"Pas kontrol hatası: {e}")
        return jsonify({
            'success': False, 
            'message': f'Pas kontrol hatası: {str(e)}'
        }), 500

