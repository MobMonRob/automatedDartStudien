import os
import threading
import time
import cv2
import numpy as np
import requests
import datetime
from dotenv import load_dotenv
from itertools import islice

from tracker.TrackerV1_2 import TrackerV1_2
from tracker.AbstractTracker import AbstractTracker
from tracker.TemplateTracker import TemplateTracker
from tracker.ZeroTracker import ZeroTracker

load_dotenv()
API_URL = os.getenv("API_URL")

POSITION_MODE = False

class DartTracker():

    CAMERA_COUNT = 2
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

    def calculateDartPositions(self):

        def getFundamentalMatrix(K1, K2, R1, R2, t1, t2):
            # returns the fundamental matrix, the matrix that describes the epipolar geometry between two cameras
            
            R = R2 @ R1.T # relative rotation
            t = t2 - R @ t1 # relative translation

            t_skew = np.array([
                [0, -t[2, 0], t[1, 0]],
                [t[2, 0], 0, -t[0, 0]],
                [-t[1, 0], t[0, 0], 0]
            ])
            E = t_skew @ R

            F = np.linalg.inv(K2).T @ E @ np.linalg.inv(K1)
            if np.linalg.norm(F) != 0:
                F /= np.linalg.norm(F)
            return F

        def getEpipolarConstraint(F, x1, x2):
            # get distance of x2 to epipolar line of x1
            x1 = np.array([x1[0], x1[1], 1], dtype=np.float32)
            x2 = np.array([x2[0], x2[1], 1], dtype=np.float32)
            return x2.T @ F @ x1
        
        calculatedDartPositions = []

        # todo: make work with more than 2 cameras
        if len(self.cameras) != 2:
            print("Error: Only 2 cameras are supported as of now")
            return calculatedDartPositions
        
        projectionMatrices = []
        for _, camera in self.cameras.items():
            if not camera.isCameraCalibrated:
                return calculatedDartPositions
            projectionMatrices.append(camera.getProjectionMatrix())
        
        camera0 = list(self.cameras.values())[0]
        camera1 = list(self.cameras.values())[1]

        print(f"Camera 0 matrix: {camera0.rotation_matrix}")
        print(f"Camera 1 matrix: {camera1.rotation_matrix}")

        F = getFundamentalMatrix(camera0.camera_matrix, camera1.camera_matrix, camera0.rotation_matrix, camera1.rotation_matrix, camera0.translation, camera1.translation)

        print(f"Fundamental Matrix: {F}")

        foundCorrespondences = []
        
        if len(list(self.dartPositions.values())) < 2:
            return calculatedDartPositions
        positions1 = list(self.dartPositions.values())[0]
        positions2 = list(self.dartPositions.values())[1]

        print(f"Postions: {positions1} {positions2}")

        for point1 in positions1:
            for point2 in positions2:
                distance = getEpipolarConstraint(F, point1, point2)
                foundCorrespondences.append(((point1, point2), distance))

        if len(foundCorrespondences) == 0:
            print("No correspondences found")
            return calculatedDartPositions
        
        print(f"All Correspondences: {foundCorrespondences}")
        
        # todo: also check if all points are used
        best3Correspondences = sorted(foundCorrespondences, key=lambda x: x[1], reverse=True)[:3]

        print(f"Best 3 Correspondences: {best3Correspondences}")

        for i, (correspondence, _) in enumerate(best3Correspondences):
            homogenousPoint = cv2.triangulatePoints(projectionMatrices[0], projectionMatrices[1], correspondence[0], correspondence[1])
            calculatedDartPositions.append(homogenousPoint / homogenousPoint[3])

        return calculatedDartPositions
    
    
    def receiveDartPositions(self, index, dartPositions):
        self.dartPositions[index] = dartPositions
        print(f"Received dart positions from camera {index}: {dartPositions}")

        # dispatch dart positions to backend async
        if not self.dispatcherThread.is_alive():
            positions = self.calculateDartPositions()
            print("Calculated Positions {0}".format(positions))
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

    WIDTH = 1280
    HEIGHT = 720
    MAX_FPS = 5

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
            self.tracker = TrackerV1_2(self.frame_buffer)


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
            time.sleep(1)
            detected_dart_position = self.processed_frame_buffer[1]
            if len(detected_dart_position) != 0:
                self.log(f"Warning: Please remove all darts from the board")
                continue
            break
        # Then, wait for the dart to be placed at the correct position
        while True:
            detected_dart_position = self.processed_frame_buffer[1]
            if len(detected_dart_position) == 0:
                self.log(f"No dart detected. Please place a dart at the position shown in the GUI ({worldPosition}).")
            elif len(detected_dart_position) > 1:
                self.log(f"Warning: More than one dart detected")
            else:
                self.log(f"Detected Position: {detected_dart_position[0]}")
                break
            time.sleep(1)
        self.imagePoints[index] = detected_dart_position[0]

    def getProjectionMatrix(self):
        Rt = np.hstack((self.rotation_matrix, self.translation))
        return self.camera_matrix @ Rt

    def log(self, message):
        print(f"[Camera {self.index}]: {message}")
        