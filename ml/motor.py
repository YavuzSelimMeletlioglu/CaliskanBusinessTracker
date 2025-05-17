from flask import Blueprint, request
import RPi.GPIO as GPIO
import time

motor_bp = Blueprint('motor', __name__)
GPIO.setmode(GPIO.BCM)

# Motor pinleri ve setup
step_pins = [17, 18, 27, 22]
motor_dip_pin = 23
steps_per_pool = 512
current_position = 0

for pin in step_pins:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, False)
GPIO.setup(motor_dip_pin, GPIO.OUT)
GPIO.output(motor_dip_pin, GPIO.LOW)

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

@motor_bp.route('/move', methods=['GET'])
def move_from_to():
    global current_position

    from_pos = request.args.get("from")
    to_pos = request.args.get("to")

    if from_pos is None or to_pos is None:
        return "from ve to parametreleri zorunludur!", 400

    from_pos = int(from_pos)
    to_pos = int(to_pos)

    # move from
    steps = abs(from_pos - current_position) * steps_per_pool
    direction = 1 if from_pos > current_position else 0
    rotate_step_motor(steps, direction)
    current_position = from_pos
    dip_and_lift()

    # move to
    steps = abs(to_pos - current_position) * steps_per_pool
    direction = 1 if to_pos > current_position else 0
    rotate_step_motor(steps, direction)
    current_position = to_pos
    dip_and_lift()

    return f"Motor {from_pos} → {to_pos} taşıdı."

@motor_bp.route('/reset-position')
def reset_pos():
    global current_position
    current_position = 0
    return "Pozisyon sıfırlandı."

@motor_bp.route('/cleanup')
def cleanup():
    GPIO.cleanup()
    return "GPIO temizlendi."