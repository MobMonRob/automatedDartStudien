from abc import ABC, abstractmethod

class AbstractTracker(ABC):

    clean_frame = None
    dart_frame = None
    tracked_frame = None
    dart_positions = []

    def __init__(self, clean_frame):
        super().__init__()
        self.setCleanFrame(clean_frame)

    def setCleanFrame(self, clean_frame):
        self.clean_frame = clean_frame

    def setDartFrame(self, dart_frame):
        self.dart_frame = dart_frame
        self.dart_positions = self.getDartPostions()

    def getCleanFrame(self):
        return self.clean_frame
    
    def getDartFrame(self):
        return self.dart_frame
    
    def getTrackedFrame(self):
        return self.tracked_frame

    def getDartPositions(self):
        self.dart_positions = self.calculateDartPostions()
        
        if len(self.dart_positions) == 0:
            self.clean_frame = self.dart_frame
        
        return self.dart_positions

    @abstractmethod
    def calculateDartPostions(self):
        pass