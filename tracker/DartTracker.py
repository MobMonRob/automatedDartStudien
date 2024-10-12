import threading
import time
import cv2

class DartTracker():

    CAMERA_COUNT = 3
    MAX_FPS = 50

    # The number over how many of the last frametimes the average is calculated. Set to 1 to disable.
    ROLLING_FRAMETIME_AVERAGE = 50

    cameras = []
    frame_buffer = []
    frame_times = []

    bufferThread: threading.Thread = threading.Thread()
    
    def __init__(self):
        self.bufferThread = threading.Thread(target=self.asyncLoadFramesIntoBuffer, daemon=True)
        self.initializeCameras()

    def initializeCameras(self):
        # Test for camera indices
        # Todo: Find better way
        for i in range(10):
            camera = cv2.VideoCapture(i)

            if not camera.isOpened():
                print(f"Cannot open camera {i}")
                continue

            camera.set(cv2.CAP_PROP_FOURCC,cv2.VideoWriter_fourcc('M','J','P','G'))
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

            self.cameras.append(camera)
            self.frame_buffer.append(camera.read())

            if len(self.cameras) >= self.CAMERA_COUNT:
                break
        
        self.bufferThread.start()
        
    def asyncLoadFramesIntoBuffer(self):
        def updateFrameTimeList(frametime):
            self.frame_times.append(frametime)
            if len(self.frame_times) > self.ROLLING_FRAMETIME_AVERAGE:
                self.frame_times.pop(0)

        startTime = time.time()
        iteration = 1
        while True:
            frameTime = time.time() - startTime
            if(frameTime < 1/self.MAX_FPS):
                continue
            updateFrameTimeList(frameTime)
            if iteration > self.ROLLING_FRAMETIME_AVERAGE/2 and self.ROLLING_FRAMETIME_AVERAGE > 1:
                iteration = 0
                print(f"Rolling average frame time (last {self.ROLLING_FRAMETIME_AVERAGE} frames): {sum(self.frame_times) / len(self.frame_times)}")
                print(f"Rolling average frames per second (last {self.ROLLING_FRAMETIME_AVERAGE} frames): {len(self.frame_times) / sum(self.frame_times)}")

            iteration += 1
            startTime = time.time()
            for i, camera in enumerate(self.cameras):
                _, frame = camera.read()
                self.frame_buffer[i] = frame

        
                    

    def getCameraFrame(self, index: int = None):
        if index is not None and len(self.cameras) > index:
            return self.frame_buffer[index]
        return False, None

    def getDartPositions1D(self, frame):
        # get the location of the darts from one cameras perspective
        pass

    def getDartPositions2D(self):
        # get the location of the darts on the board
        pass

    