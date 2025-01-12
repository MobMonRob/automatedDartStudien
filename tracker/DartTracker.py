import os
import threading
import time
import cv2
import requests
import datetime
from dotenv import load_dotenv

from tracker.AbstractTracker import AbstractTracker
from tracker.TemplateTracker import TemplateTracker
from tracker.ZeroTracker import ZeroTracker

load_dotenv()
API_URL = os.getenv("API_URL")

class DartTracker():

    CAMERA_COUNT = 3
    cameras = []
    
    def __init__(self):
        self.initializeCameras()

    def initializeCameras(self):
        # Test for camera indices
        # Todo: Find better way
        for i in range(10):
            camera = Camera(i)

            if camera.valid == False:
                continue

            self.cameras.append(camera)

            if len(self.cameras) >= self.CAMERA_COUNT:
                break
        
        if len(self.cameras) == self.CAMERA_COUNT:
            for camera in self.cameras:
                camera.start()
                time.sleep(1/(camera.MAX_FPS*self.CAMERA_COUNT))
            

    def getCameraFrame(self, index: int = None):
        if index is not None and len(self.cameras) > index:
            return self.cameras[index].getFrame()
        return False, None

    def getFrameTimes(self):
        frameTimes = []
        for camera in self.cameras:
            frameTimes.append((camera.index, camera.getFrametime()))
        return frameTimes

    
class Camera():

    WIDTH = 1920
    HEIGHT = 1080
    MAX_FPS = 24

    # The number over how many of the last frametimes the average is calculated.
    ROLLING_FRAMETIME_AVERAGE = 50

    camera = cv2.VideoCapture()

    frame_buffer = None
    processed_frame_buffer = None

    frame_times = []
    index = -1
    valid = False

    tracker : AbstractTracker = None

    dispatcherThread : threading.Thread = None

    def __init__(self, index):
        self.index = index
        self.initialize_camera(index)

    def initialize_camera(self, index):
        camera = cv2.VideoCapture(index)

        if not camera.isOpened():
            print(f"Cannot open camera {index}")
            self.valid = False
            return

        camera.set(cv2.CAP_PROP_FOURCC,cv2.VideoWriter_fourcc('M','J','P','G'))
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.WIDTH)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.HEIGHT)

        ret, self.frame_buffer = camera.read()
        self.processed_frame_buffer = self.frame_buffer, []

        if ret == False:
            self.valid = False
            return
        
        self.camera = camera
        self.valid = True

        self.tracker = ZeroTracker(self.frame_buffer)

        self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=(self.processed_frame_buffer[1],), daemon=True)
    
    def start(self):
        threading.Thread(target=self.asyncLoadFramesIntoBuffer, daemon=True).start()
    
    def asyncLoadFramesIntoBuffer(self):
        startTime = time.time()
        iteration = 1
        while True:
            frameTime = time.time() - startTime
            if(frameTime < 1/self.MAX_FPS):
                continue

            self.frame_times.append(frameTime)
            if len(self.frame_times) > self.ROLLING_FRAMETIME_AVERAGE:
                self.frame_times.pop(0)

            if iteration > self.ROLLING_FRAMETIME_AVERAGE/2:
                iteration = 0

            iteration += 1
            startTime = time.time()

            _, frame = self.camera.read()
            self.frame_buffer = frame

            self.processed_frame_buffer = self.getDartPositions2D()

            # dispatch dart positions to backend async
            if not self.dispatcherThread.is_alive():
                self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=(self.processed_frame_buffer[1],), daemon=True)
                self.dispatcherThread.start()

    def getFrame(self):
        return True, self.frame_buffer
    
    def getEditedFrame(self):
        return True, self.processed_frame_buffer[0]
    
    def getDartPositions2D(self):
        self.tracker.setDartFrame(self.frame_buffer)
        return self.tracker.getTrackedFrame(), self.tracker.getDartPositions()
       
    def getFrametime(self):
        return sum(self.frame_times) / len(self.frame_times)
        
    def __dispatchDartPositions(self, dart_positions):
        url = f"{API_URL}/tracking-data"

        positions = []
        for x, y in dart_positions:
            positions.append({"x": x, "y": y})

        data = {
                "camera_id": "camera" + str(self.index),
                "timestamp": str(datetime.datetime.now()),
                "positions": positions
        }

        response = requests.post(url, json=data)

        if response.status_code != 200:
            print(f"Error dispatching dart positions: {response.text}")
            return
        