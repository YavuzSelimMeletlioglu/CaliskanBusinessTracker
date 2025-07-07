#  0 Servo En tepede
#  180 servo en aşağıda (ürün almada)

from flask import Flask, request, jsonify
import gpiod
import time
import requests
import base64

app = Flask(__name__)

STEP_PINS = [14, 15, 17, 23]
SERVO_PIN = 18
GPIO_CHIP = 'gpiochip0'

STEPS_PER_POOL = 512
STEP_DELAY = 0.001

# Kamera ayarları
CAMERA_IP = "192.168.1.20"
CAMERA_PORT = 8080
RUST_API_URL = "http://192.168.1.24:5001/rust/check"

current_position = 0
servo_angle = 0     
chip = None
step_lines = []
servo_line = None

seg_right = [
    [1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0],
    [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]
]

seg_left = [
    [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 1, 0], [0, 1, 1, 0],
    [0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 1]
]

def setup_gpio():
    global chip, step_lines, servo_line
    
    chip = gpiod.Chip(GPIO_CHIP)
    
    step_lines = [chip.get_line(pin) for pin in STEP_PINS]
    for line in step_lines:
        line.request(consumer='stepper', type=gpiod.LINE_REQ_DIR_OUT, default_val=0)
    
    servo_line = chip.get_line(SERVO_PIN)
    servo_line.request(consumer='servo', type=gpiod.LINE_REQ_DIR_OUT, default_val=0)

def move_stepper(steps, direction=1):
    sequence = seg_right if direction == 1 else seg_left
    
    for _ in range(steps):
        for step in sequence:
            for i, pin_value in enumerate(step):
                step_lines[i].set_value(pin_value)
            time.sleep(STEP_DELAY)

def move_servo(angle):
    global servo_angle
    
    if angle < 0:
        angle = 0
    elif angle > 180:
        angle = 180
    
    pulse_width = 1 + (angle / 180.0)
    
    for _ in range(50):
        servo_line.set_value(1)
        time.sleep(pulse_width / 1000.0)
        servo_line.set_value(0)
    
    servo_angle = angle

def rotate_servo_max():
    for angle in range(0, 181, 10):
        move_servo(angle)

def capture_and_send_photo(pool_number):
    """Kameradan fotoğraf çek ve Rust API'ye gönder"""
    try:
        # Android telefondan fotoğraf çek
        camera_url = f"http://{CAMERA_IP}:{CAMERA_PORT}/photo.jpg"
        response = requests.get(camera_url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Kamera hatası: {response.status_code}")
            return False
        
        # Fotoğrafı base64'e çevir
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        print(image_base64)
        # Rust API'ye gönder
        payload = {
            "image_base64": image_base64,
            "pool_number": pool_number
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        api_response = requests.post(RUST_API_URL, 
                                   json=payload, 
                                   headers=headers, 
                                   timeout=30)
        
        if api_response.status_code == 200:
            print(f"✅ Fotoğraf başarıyla gönderildi - Pool {pool_number}")
            return True
        else:
            print(f"❌ API hatası: {api_response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Kamera/API bağlantı hatası: {e}")
        return False
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")
        return False

@app.route('/')
def home():
    return jsonify({
        "message": "Havuz Kontrol Sistemi",
        "current_position": current_position,
        "servo_angle": servo_angle
    }), 200

@app.route('/motor/move')
def move():
    global current_position
    
    from_pos = request.args.get("from")
    to_pos = request.args.get("to")
    
    if not from_pos or not to_pos:
        return jsonify({"error": "from ve to parametreleri gerekli"}), 400
    
    try:
        from_pos = int(from_pos)
        to_pos = int(to_pos)
        if from_pos < 0 or to_pos < 0 or to_pos > 5:
            raise ValueError()
    except ValueError:
        return jsonify({"error": "from ve to pozitif tam sayı olmalı"}), 400
    move_servo(0)
    if from_pos != current_position:
        steps = abs(from_pos - current_position) * STEPS_PER_POOL
        direction = 1 if from_pos > current_position else 0
        move_stepper(steps, direction)
        current_position = from_pos
        rotate_servo_max()
        time.sleep(1)
        move_servo(0)
    
    if to_pos != current_position:
        steps = abs(to_pos - current_position) * STEPS_PER_POOL
        direction = 1 if to_pos > current_position else 0
        move_stepper(steps, direction)
        current_position = to_pos
        
        rotate_servo_max()
        time.sleep(1)
        move_servo(0)
    
    return jsonify({
        "message": f"Havuz {from_pos} -> {to_pos} hareket tamamlandı",
        "current_position": current_position,
        "servo_angle": servo_angle
    }), 200

@app.route('/motor/lift')
def lift():
    global current_position
    
    pool_number = request.args.get("pool_number")
    
    if not pool_number:
        return jsonify({"error": "pool_number parametresi gerekli"}), 400
    
    try:
        pool_number = int(pool_number)
        if pool_number < 0:
            raise ValueError()
    except ValueError:
        return jsonify({"error": "pool_number pozitif tam sayı olmalı"}), 400
    
    if pool_number != current_position:
        steps = abs(pool_number - current_position) * STEPS_PER_POOL
        direction = 1 if pool_number > current_position else 0
        move_stepper(steps, direction)
        current_position = pool_number
    
    rotate_servo_max()
    
    time.sleep(1)
    
    move_servo(90)
    
    # 🔥 BURASI YENİ EKLENEN KISIM 🔥
    # Ürünler kaldırıldıktan sonra fotoğraf çek ve API'ye gönder
    print(f"📸 Pool {pool_number} fotoğrafı çekiliyor...")
    photo_success = capture_and_send_photo(pool_number)
    
    response_data = {
        "message": f"Havuz {pool_number}'den ürün kaldırıldı",
        "current_position": current_position,
        "servo_angle": servo_angle,
        "photo_sent": photo_success  # Fotoğraf gönderim durumu
    }
    
    if photo_success:
        response_data["photo_status"] = "Fotoğraf başarıyla çekildi ve API'ye gönderildi"
    else:
        response_data["photo_status"] = "Fotoğraf çekme/gönderme başarısız"
    
    return jsonify(response_data), 200

@app.route('/motor/home')
def home_position():
    global current_position
    
    if current_position != 0:
        steps = current_position * STEPS_PER_POOL
        move_stepper(steps, direction=0)
        current_position = 0
    
    move_servo(0)
    
    return jsonify({
        "message": "Ana pozisyona dönüldü",
        "current_position": current_position,
        "servo_angle": servo_angle
    }), 200

@app.route('/motor/dip')
def dip():
    rotate_servo_max()
    
    time.sleep(1)
    
    move_servo(0)
    
    return jsonify({
        "message": "Ürünler havuza sokuldu",
        "current_position": current_position,
        "servo_angle": servo_angle
    }), 200

def cleanup_gpio():
    """GPIO pinlerini temizle"""
    global chip, step_lines, servo
    try:
        if step_lines:
            for line in step_lines:
                if line:
                    line.release()
        if servo:
            servo.close()
        if chip:
            chip.close()
    except:
        pass

if __name__ == '__main__':
    try:
        setup_gpio()
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("Program durduruldu")
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        cleanup_gpio()