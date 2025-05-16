from flask import Flask, request
import RPi.GPIO as GPIO
import time

app = Flask(__name__)
GPIO.setmode(GPIO.BCM)

# --- Step Motor (Yatay taşıma) ---
step_pins = [17, 18, 27, 22]
for pin in step_pins:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, False)

step_seq = [
    [1,0,0,1],
    [1,0,0,0],
    [1,1,0,0],
    [0,1,0,0],
    [0,1,1,0],
    [0,0,1,0],
    [0,0,1,1],
    [0,0,0,1]
]

motor_dip_pin = 23
GPIO.setup(motor_dip_pin, GPIO.OUT)
GPIO.output(motor_dip_pin, GPIO.LOW)

# --- Ayarlar ---
steps_per_pool = 512
current_position = 0

def rotate_step_motor(steps=512, delay=0.002, direction=1):
    seq = step_seq if direction == 1 else list(reversed(step_seq))
    for _ in range(steps):
        for step in seq:
            for pin in range(4):
                GPIO.output(step_pins[pin], step[pin])
            time.sleep(delay)

def dip_and_lift():
    GPIO.output(motor_dip_pin, GPIO.HIGH)
    time.sleep(2)
    GPIO.output(motor_dip_pin, GPIO.LOW)
    time.sleep(2)

@app.route("/move", methods=["GET"])
def move_from_to():
    global current_position

    from_pos = request.args.get("from")
    to_pos = request.args.get("to")

    if from_pos is None or to_pos is None:
        return "from ve to parametreleri zorunludur!", 400

    try:
        from_pos = int(from_pos)
        to_pos = int(to_pos)
    except ValueError:
        return "from ve to parametreleri tam sayı olmalıdır!", 400

    if from_pos < 0 or to_pos < 0 or from_pos > 5 or to_pos > 5:
        return "Pozisyonlar 0-5 arası olmalıdır (4 havuz + 2 bekleme).", 400

    steps_to_from = abs(from_pos - current_position) * steps_per_pool
    direction = 1 if from_pos > current_position else 0
    rotate_step_motor(steps=steps_to_from, direction=direction)
    current_position = from_pos

    dip_and_lift()

    steps_to_to = abs(to_pos - current_position) * steps_per_pool
    direction = 1 if to_pos > current_position else 0
    rotate_step_motor(steps=steps_to_to, direction=direction)
    current_position = to_pos

    dip_and_lift()

    return f"Ürün {from_pos} → {to_pos} başarıyla taşındı ve işlendi."

@app.route("/reset-position")
def reset_position():
    global current_position
    current_position = 0
    return "Pozisyon sıfırlandı (0)."

@app.route("/cleanup")
def cleanup():
    GPIO.cleanup()
    return "GPIO temizlendi."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)