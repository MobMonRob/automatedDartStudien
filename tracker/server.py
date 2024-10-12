from flask import Flask, Response, render_template
import cv2 as cv
from DartTracker import DartTracker

app = Flask(__name__)

darttracker = DartTracker()

def generate_frames(camera_id):
    while True:
        _, frame = darttracker.getCameraFrame(index = camera_id)
        _, buffer = cv.imencode('.jpg', frame)
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

@app.route('/frametime')
def frametime():
    frametimes = darttracker.getFrameTimes()
    response = ""
    for i, frametime in frametimes:
        response += f"Camera {i}: {1/frametime} FPS\n"

    return {"frametime": response}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)