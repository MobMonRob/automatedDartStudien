import os
import threading
import time
import cv2
import numpy as np
import requests
import datetime
import json
from dotenv import load_dotenv
from itertools import islice

from tracker.TrackerV2_4 import TrackerV2_4
from tracker.AbstractTracker import AbstractTracker
from tracker.TemplateTracker import TemplateTracker
from tracker.ZeroTracker import ZeroTracker
from triangulators.AbstractTriangulator import AbstractTriangulator
from triangulators.UnsortedTriangulator import UnsortedTriangulator
from triangulators.SortedTriangulator import SortedTriangulator

load_dotenv()
API_URL = os.getenv("API_URL")

POSITION_MODE = False

class DartTracker():

    CAMERA_COUNT = 3
    cameras = {}

    dartPositions = {}

    dispatcherThread : threading.Thread = None

    triangulator: AbstractTriangulator = None
    
    def __init__(self):
        self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=([],), daemon=True)
        self.initializeCameras()
        self.triangulator = SortedTriangulator([value for key, value in sorted(self.cameras.items(), key=lambda x: x[0])])

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
                self.setInitialCalibrationData(camera)                   
                camera.start()
                time.sleep(1/(camera.MAX_FPS*self.CAMERA_COUNT))
        if True:
            for _, camera in self.cameras.items():
                if not camera.isCameraCalibrated:
                    print(f"Camera {camera.index} is not calibrated. Starting calibration with default positions.")
                    threading.Thread(target=self.calibrateCameras,
                                     daemon=True,
                                     args=(np.array([
                        [0.199569,0.59232],
                        [-0.934412,0.006765],
                        [-0.199569,-0.59232],
                        [0.886588,-0.295183]]),)).start()
                    return
    
    def setInitialCalibrationData(self, camera):
        try:
            with open(f"calibration/camera{camera.index}.json", "r") as file:
                data = json.load(file)
                camera.isCameraCalibrated = data["calibrated"]
                if camera.isCameraCalibrated:
                    camera.rotation_matrix = np.array(data["rotation_matrix"], dtype=np.float32)
                    camera.translation = np.array(data["translation"], dtype=np.float32)
                    camera.camera_matrix = np.array(data["camera_matrix"], dtype=np.float32)
                    camera.dist_coeffs = np.array(data["dist_coeffs"], dtype=np.float32)
        except FileNotFoundError:
            print(f"Calibration data for camera {camera.index} not found")


    def getCameraFrame(self, index: int = None):
        if index is not None and len(self.cameras.keys()) > index:
            _, camera = next(islice(self.cameras.items(), index, index+1))
            if POSITION_MODE: 
                return camera.getFrame()
            return camera.getEditedFrame()
        return False, None

    def getFrameTimes(self):
        frameTimes = []
        for _, camera in self.cameras.items():
            frameTimes.append((camera.index, camera.getFrametime()))
        return frameTimes
    
    def calibrateCameras(self, actualPositions):
        print(f"Starting world coordinate collection with points: {actualPositions}")
        # first, feed the points one by one to the cameras
        for i, position in enumerate(actualPositions):
            # Add 3rd coordinate to the position
            new_position = np.array([position[0], position[1], 0], dtype=np.float32)
            print(f"Calibrating with position: {new_position}")
            threads = []
            for _, camera in self.cameras.items():
                threads.append(threading.Thread(target=camera.addCalibrationPoint, args=(new_position,i,), daemon=True))
                threads[-1].start()
            # ensure all threads are finished (all cameras have found the point) before continuing
            while any([thread.is_alive() for thread in threads]):
                time.sleep(1)
            
        # then, let the cameras calibrate with the image points
        print("All points have been found. Starting calibration.")
        for _, camera in self.cameras.items():
            camera.calibrate()
        self.saveCalibrationData()
        self.triangulator = SortedTriangulator([value for key, value in sorted(self.cameras.items(), key=lambda x: x[0])])
        
    def saveCalibrationData(self):
        if not os.path.exists("calibration"):
            os.makedirs("calibration")
        for _, camera in self.cameras.items():
            data = {
                "calibrated": camera.isCameraCalibrated,
                "rotation_matrix": camera.rotation_matrix.tolist(),
                "translation": camera.translation.tolist(),
                "camera_matrix": camera.camera_matrix.tolist(),
                "dist_coeffs": camera.dist_coeffs.tolist()
            }
            print(f"Saving calibration data for camera {camera.index}: \n {data}")
            with open(f"calibration/camera{camera.index}.json", "w+") as file:
                json.dump(data, file)

    def calculateDartPositions(self):
        return self.triangulator.triangulate([value for key, value in sorted(self.dartPositions.items(), key=lambda x: x[0])]) 
    
    def receiveDartPositions(self, index, dartPositions):
        if self.triangulator is None:
            return
        self.dartPositions[index] = dartPositions
        print(f"Dart positions: {self.dartPositions}")

        # save current frames for each camera
        # for _, camera in self.cameras.items():
        #     _, frame = camera.getEditedFrame()
        #     if frame is not None:
        #         cv2.imwrite(f"frames/{time.time()}/camera{camera.index}.jpg", frame)

        # dispatch dart positions to backend async
        if not self.dispatcherThread.is_alive():
            positions = self.calculateDartPositions()
            self.printPositions(positions)
            self.dispatcherThread = threading.Thread(target=self.__dispatchDartPositions, args=(positions,), daemon=True)
            self.dispatcherThread.start()

    def isCalibrated(self):
        calibrated = True
        for _, camera in self.cameras.items():
            calibrated = calibrated and camera.isCameraCalibrated
        return calibrated
    
    def resetEmptyFrame(self):
        for _, camera in self.cameras.items():
            camera.resetEmptyFrame()

    def __dispatchDartPositions(self, dart_positions):
        url = f"{API_URL}/tracking-data"

        positions = []
        for position in dart_positions:
            positions.append({"x": float(position[0]), "y": float(position[1])})

        data = {
                "timestamp": str(datetime.datetime.now()),
                "positions": positions#,
                #"calibrated": self.isCalibrated()
        }

        try:
            response = requests.post(url, json=data)
            if response.status_code != 200:
                print(f"Error dispatching dart positions: {response.text}")
                return
        except:
            pass

    def printPositions(self, positions):
        if len(positions) < 1:
            print("No calculated positions")
            return
        print(f"{'X':>10} {'Y':>10} {'Z':>10}")
        print("-" * 35)
        for point in positions:
            flat_point = point.flatten()  # Convert column vector to 1D array
            print(f"{flat_point[0]:10.5f} {flat_point[1]:10.5f} {flat_point[2]:10.5f}")

class Camera():

    parent: DartTracker

    WIDTH = 1280
    HEIGHT = 720
    MAX_FPS = 3

    # The number over how many of the last frametimes the average is calculated.
    ROLLING_FRAMETIME_AVERAGE = 50

    camera: cv2.VideoCapture

    frame_buffer = None
    processed_frame_buffer = None

    frame_times = []
    index = -1
    valid = False

    focal_length = 2.1
    principal_point = (WIDTH//2, HEIGHT//2)
    pixel_size = 0.003

    translation: np.array
    rotation_matrix: np.array

    camera_matrix = np.array([
        [focal_length/pixel_size, 0, principal_point[0]],
        [0, focal_length/pixel_size, principal_point[1]],
        [0, 0, 1]
    ], dtype=np.float32)

    dist_coeffs = np.array([1.40017137e-14, 2.14617695e-10, -1.38004061e-16, 2.35596742e-16, -6.64757209e-15], dtype=np.float32)

    tracker : AbstractTracker = None

    isCameraCalibrated = False
    imagePoints: np.array
    worldPoints: np.array

    loadFrameThread : threading.Thread = None

    def __init__(self, index, parent: DartTracker):
        self.index = index
        self.parent = parent
        self.loadFrameThread = threading.Thread(target=self.asyncLoadFramesIntoBuffer, daemon=True)
        self.imagePoints = np.zeros((4,2), dtype=np.float32)
        self.worldPoints = np.zeros((4,3), dtype=np.float32)
        self.translation = np.zeros((3, 1), dtype=np.float32)
        self.rotation_matrix = np.zeros((3, 3), dtype=np.float32)
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
        camera.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
        camera.set(cv2.CAP_PROP_EXPOSURE, 2400)

        ret, self.frame_buffer = camera.read()
        self.processed_frame_buffer = self.frame_buffer, []

        if ret == False:
            self.valid = False
            return
        
        self.camera = camera
        self.valid = True

        if POSITION_MODE:
            self.tracker = ZeroTracker(self.frame_buffer)
        else:
            self.tracker = TrackerV2_4(self.frame_buffer)


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
    
    def resetEmptyFrame(self):
        self.tracker.setCleanFrame(self.frame_buffer)
    
    def calibrate(self):
        self.isCameraCalibrated = False

        if len(self.imagePoints) != len(self.worldPoints):
            self.log("Error: Calibration failed. Not enough points detected")
            return False

        if len(self.imagePoints) < 4:
            self.log("Error: Calibration failed. At least 4 points are required")
            return False

        success, rotation_vector, translation_vector, _ = cv2.solvePnPRansac(self.worldPoints, self.imagePoints, self.camera_matrix, self.dist_coeffs)
        
        if success:
            self.log(f"Rotation Vector: \n {rotation_vector}")
            self.log(f"Translation Vector: \n {translation_vector}")
        
            self.rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
            self.log(f"Rotation Matrix: \n {self.rotation_matrix}")

            self.translation = translation_vector

            self.log("Calibration successful") 

        else:
            self.log("Calibration failed")

        self.isCameraCalibrated = success

    def addCalibrationPoint(self, worldPosition, index):
        self.log(f"Starting calibration of point {worldPosition}")
        self.worldPoints[index] = worldPosition
        # First, ensure that no dart is on the board
        while True:
            time.sleep(1/self.MAX_FPS)
            detected_dart_position = self.processed_frame_buffer[1]
            if len(detected_dart_position) != 0:
                self.log(f"Warning: Please remove all darts from the board")
                continue
            break
        # Then, wait for the dart to be placed at the correct position
        previous_dart_position = []
        same_position_count = 0
        while True:
            time.sleep(1/self.MAX_FPS)
            detected_dart_position = self.processed_frame_buffer[1]
            if len(detected_dart_position) == 0:
                self.log(f"No dart detected. Please place a dart at the position shown in the GUI ({worldPosition}).")
                same_position_count = 0
            elif len(detected_dart_position) > 1:
                self.log(f"Warning: More than one dart detected: {detected_dart_position}")
                same_position_count = 0
            else:
                self.log(f"Detected Position: {detected_dart_position[0]}")

                # the "same" position must be detected three times
                if self.isEqualPosition(detected_dart_position[0][:2], previous_dart_position):
                    same_position_count += 1
                else:
                    same_position_count = 0
                    previous_dart_position = detected_dart_position[0][:2]

                if same_position_count < 10:
                    self.log(f"Detected dart. Waiting for stable position (Iteration {same_position_count+1}).")
                    continue

                # save the image for debug purposes
                path = f"frames/{self.index}/calibration/{index}"
                os.makedirs(path, exist_ok=True)
                cv2.imwrite(f"{path}/clean.jpg", self.frame_buffer)
                cv2.imwrite(f"{path}/detected.jpg", self.processed_frame_buffer[0])
                break

        self.imagePoints[index] = detected_dart_position[0][:2]

    def isEqualPosition(self, position1, position2):
        if len(position1) < 2 or len(position2) < 2:
            return False
        return abs(position1[0] - position2[0]) < 1 and abs(position1[1] - position2[1]) < 1

    def getProjectionMatrix(self):
        Rt = np.hstack((self.rotation_matrix, self.translation))
        return self.camera_matrix @ Rt

    def log(self, message):
        print(f"[Camera {self.index}]: {message}")
        