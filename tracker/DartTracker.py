import time
import cv2 as cv

class DartTracker():

    CAMERA_COUNT = 3
    cameras = []
    
    def __init__(self):
        self.initializeCameras()

    def initializeCameras(self):
        # Test for camera indices
        # Todo: Find better way
        for i in range(10):
            camera = cv.VideoCapture(i)

            if not camera.isOpened():
                print(f"Cannot open camera {i}")
                continue

            camera.set(cv.CAP_PROP_FRAME_WIDTH, 1920)
            camera.set(cv.CAP_PROP_FRAME_HEIGHT, 1080)

            self.cameras.append(camera)
            if len(self.cameras) >= self.CAMERA_COUNT:
                break
    
    def getCameraFrame(self, camera: cv.VideoCapture = None, index: int = None):
        if camera is not None:
            return camera.read()
        if index is not None and len(self.cameras) > index:
            return self.cameras[index].read()
        return False, None

    def getDartPositions1D(self, frame):
        # get the location of the darts from one cameras perspective
        pass

    def getDartPositions2D(self):
        # get the location of the darts on the board
        pass