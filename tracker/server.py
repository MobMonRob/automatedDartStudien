import time
from flask import Flask, Response, render_template
import cv2 as cv
from DartTracker import DartTracker

app = Flask(__name__)

darttracker = DartTracker()

def generate_frames(camera_id):
    while True:
        success, frame = darttracker.getCameraFrame(index = camera_id)
        if not success:
            break
        else:
            ret, buffer = cv.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed/<int:camera_id>')
def video_feed(camera_id):
    return Response(generate_frames(camera_id),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)