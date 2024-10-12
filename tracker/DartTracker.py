import threading
import time
import cv2

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

    def getDartPositions2D(self):
        # get the location of the darts on the board
        pass

    def getFrameTimes(self):
        frameTimes = []
        for camera in self.cameras:
            frameTimes.append((camera.index, camera.getFrametime()))
        return frameTimes

    
class Camera():

    MAX_FPS = 24

    # The number over how many of the last frametimes the average is calculated.
    ROLLING_FRAMETIME_AVERAGE = 50

    camera = cv2.VideoCapture()
    frame_buffer = None
    frame_times = []
    index = -1
    valid = False

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
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        ret, self.frame_buffer = camera.read()
        if ret == False:
            self.valid = False
            return
        
        self.camera = camera
        self.valid = True
    
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

    def getFrame(self):
        return True, self.frame_buffer
    
    def getDartPositions1D(self):
        # get the location of the darts from the camera's perspective
        pass

    def getFrametime(self):
        return sum(self.frame_times) / len(self.frame_times)