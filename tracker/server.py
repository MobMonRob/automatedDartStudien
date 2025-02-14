from flask import Flask, Response, render_template, request, json
import cv2 as cv
import numpy as np
from DartTracker import DartTracker

app = Flask(__name__)

darttracker = DartTracker()

def generate_frames(camera_id):
    while True:
        _, frame = darttracker.getCameraFrame(index = camera_id)
        _, buffer = cv.imencode('.jpg', frame)
        #_, buffer = cv.imwrite(f'{random.random()}.jpg', frame)
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
    frametimes = enumerate([1, 1, 1])
    response = ""
    for i, frametime in frametimes:
        response += f"Camera {i}: {1/frametime} FPS\n"

    return {"frametime": response}

@app.route('/calibrate', methods=['POST'])
def calibrate():
    if request.is_json:
        data = json.loads(request.data)
        actualPositions = data['actualPositions']
        if(len(actualPositions) != 4):
            return Response(status=400)
        darttracker.calibrateCameras(np.array(actualPositions))
        return Response(status=200)
    return Response(status=400)

@app.route("/empty", methods=['POST'])
def empty():
    darttracker.resetEmptyFrame()
    return Response(status=200)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)