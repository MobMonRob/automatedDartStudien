import os
import threading
import time
import cv2
import numpy as np
import requests
import datetime
from dotenv import load_dotenv
from itertools import islice

from tracker.TrackerV1 import TrackerV1
from tracker.AbstractTracker import AbstractTracker
from tracker.TemplateTracker import TemplateTracker
from tracker.ZeroTracker import ZeroTracker

load_dotenv()
API_URL = os.getenv("API_URL")

class DartTracker():

    CAMERA_COUNT = 3
    cameras = {}

    dartPositions = {}

    dispatcherThread : threading.Thread = None
    
    def __init__(self):
        self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=([],), daemon=True)
        self.initializeCameras()

    def initializeCameras(self):
        # Test for camera indices
        # Todo: Find better way
        for i in range(10):
            camera = Camera(i, self)

            if camera.valid == False:
                continue

            self.cameras[i] = (camera)

            if len(self.cameras) >= self.CAMERA_COUNT:
                break
        
        if len(self.cameras) == self.CAMERA_COUNT:
            for _, camera in self.cameras.items():
                camera.start()
                time.sleep(1/(camera.MAX_FPS*self.CAMERA_COUNT))
            

    def getCameraFrame(self, index: int = None):
        if index is not None and len(self.cameras.keys()) > index:
            _, camera = next(islice(self.cameras.items(), index, index+1))
            return camera.getEditedFrame()
        return False, None

    def getFrameTimes(self):
        frameTimes = []
        for _, camera in self.cameras.items():
            frameTimes.append((camera.index, camera.getFrametime()))
        return frameTimes
    
    def calibrateCameras(self, actualPositions):
        for _, camera in self.cameras.items():
            success = camera.calibrateAsync(actualPositions)

    def calculateDartPositions(self):
        calculatedDartPositions = np.zeros((3, 2), dtype=np.float32)

        # todo: math magic

        return calculatedDartPositions
    
    def receiveDartPositions(self, index, dartPositions):
        self.dartPositions[index] = dartPositions
        print(f"Received dart positions from camera {index}: {dartPositions}")

        # dispatch dart positions to backend async
        if not self.dispatcherThread.is_alive():
            positions = self.calculateDartPositions()
            self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=(positions,), daemon=True)
            self.dispatcherThread.start()

    def isCalibrated(self):
        calibrated = True
        for _, camera in self.cameras.items():
            calibrated = calibrated and camera.isCameraCalibrated
        return calibrated

    def __dispatchDartPositions(self, dart_positions):
        return
        url = f"{API_URL}/tracking-data"

        positions = []
        for x, y in dart_positions:
            positions.append({"x": str(x), "y": str(y)})

        data = {
                "timestamp": str(datetime.datetime.now()),
                "positions": positions,
                "calibrated": self.isCalibrated()
        }

        response = requests.post(url, json=data)

        if response.status_code != 200:
            print(f"Error dispatching dart positions: {response.text}")
            return


    
class Camera():

    parent: DartTracker

    WIDTH = 1920
    HEIGHT = 1080
    MAX_FPS = 24

    # The number over how many of the last frametimes the average is calculated.
    ROLLING_FRAMETIME_AVERAGE = 50

    camera: cv2.VideoCapture

    frame_buffer = None
    processed_frame_buffer = None

    frame_times = []
    index = -1
    valid = False

    focal_length = 3.6651 # calculated from sensor width and fov
    principal_point = (WIDTH//2, HEIGHT//2)

    sensor_width = 6.16
    sensor_height = 4.62

    translation = np.zeros((3, 1), dtype=np.float32)
    rotation_matrix = np.zeros((3, 3), dtype=np.float32)

    camera_matrix = np.array([
        [focal_length, 0, principal_point[0]],
        [0, focal_length, principal_point[1]],
        [0, 0, 1]
    ], dtype=np.float32)

    dist_coeffs = np.array([ 2.51531286e+02, -8.19915732e+04, 1.62496176e+00,  1.42073915e+00, -2.71497746e+02], dtype=np.float32)

    tracker : AbstractTracker = None

    calibrationStatus = -1
    isCameraCalibrated = False

    loadFrameThread : threading.Thread = None

    def __init__(self, index, parent: DartTracker):
        self.index = index
        self.parent = parent
        self.loadFrameThread = threading.Thread(target=self.asyncLoadFramesIntoBuffer, daemon=True)
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

        self.tracker = TrackerV1(self.frame_buffer)

    def start(self):
        self.loadFrameThread.start()
    
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

            self.processed_frame_buffer = self.getDartPositionsFromImage()
            self.parent.receiveDartPositions(self.index, self.processed_frame_buffer[1])

    def getFrame(self):
        return True, self.frame_buffer
    
    def getEditedFrame(self):
        return True, self.processed_frame_buffer[0]
    
    def getDartPositionsFromImage(self):
        self.tracker.setDartFrame(self.frame_buffer)
        return self.tracker.getTrackedFrame(), self.tracker.getDartPositions()
       
    def getFrametime(self):
        return sum(self.frame_times) / len(self.frame_times)
    
    def calibrate(self, worldPositions):
        self.isCameraCalibrated = False
        imagePositions = np.array([], dtype=np.float32)

        self.log(f"Starting calibration")
        self.calibrationStatus = 0
        # find dart positions for each world position
        for p in worldPositions:
            detected_dart_position = []
            self.log(f"Finding dart for world position: {p}")
            while True:
                time.sleep(1)
                _, detected_dart_position = self.getDartPositionsFromImage()
                if len(detected_dart_position) == 0:
                    self.log(f"No dart detected. Please place a dart at the position shown in the GUI.")
                elif len(detected_dart_position) > 1:
                    self.log(f"Warning: More than one dart detected")
                else:
                    self.log(f"Detected Position: {detected_dart_position[0]}")
                    break
            # no append
            imagePositions.append(detected_dart_position[0])
            self.calibrationStatus += 1
            while True:
                time.sleep(1)
                _, detected_dart_position = self.getDartPositionsFromImage()
                if len(detected_dart_position) != 0:
                    self.log(f"Warning: Please remove all darts from the board")
                    continue
                break
            self.log(f"Calibration point for {p} set")

        if len(imagePositions) != len(worldPositions):
            self.log("Error: Calibration failed. Not enough points detected")
            return False

        success, rotation_vector, translation_vector = cv2.solvePnP(worldPositions, imagePositions, self.camera_matrix, self.dist_coeffs)
        
        if success:
            self.log("Calibration successful for camera " + str(self.index))
            self.log("Rotation Vector: \n" + rotation_vector)
            self.log("Translation Vector: \n" + translation_vector)
        
            self.rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
            self.log("Rotation Matrix: \n" + self.rotation_matrix)

            self.translation = translation_vector

            self.log("Calibration successful") 

        else:
            self.log("Calibration failed")

        self.isCameraCalibrated = success

    def calibrateAsync(self, worldPositions):
        calibrationThread = threading.Thread(target=self.calibrate, args=(worldPositions,), daemon=True)
        calibrationThread.start()

    def log(self, message):
        print(f"[Camera {self.index}]: {message}")
        