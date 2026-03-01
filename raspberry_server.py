import argparse

# Use a mock if not on actual Raspberry Pi
try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
except ImportError:
    HAS_GPIO = False
    print("WARNING: RPi.GPIO not found. Running in simulation mode without hardware.")

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS to allow React frontend to make requests
CORS(app)

PIN_NUMBER = 5

if HAS_GPIO:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PIN_NUMBER, GPIO.OUT)

@app.route('/test-pin', methods=['POST'])
def test_pin():
    """Endpoint that turns on PIN 5."""
    if HAS_GPIO:
        GPIO.output(PIN_NUMBER, GPIO.HIGH)
        print(f"Hardware Output: Pin {PIN_NUMBER} turned ON")
    else:
        print(f"Simulation Output: Pin {PIN_NUMBER} turned ON")
        
    return jsonify({
        "status": "success",
        "pin": PIN_NUMBER,
        "state": "ON"
    })

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Raspberry Pi GPIO Server")
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    args = parser.parse_args()
    
    print(f"Starting server on port {args.port}...")
    app.run(host='0.0.0.0', port=args.port)
