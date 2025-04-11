from abc import ABC, abstractmethod

class AbstractTracker(ABC):

    clean_frame = None
    dart_frame = None
    tracked_frame = None
    dart_positions = []

    enabled = True

    def __init__(self, clean_frame):
        super().__init__()
        self.setCleanFrame(clean_frame)

    def setCleanFrame(self, clean_frame):
        self.clean_frame = clean_frame

    def setDartFrame(self, dart_frame):
        self.dart_frame = dart_frame
        if self.enabled:
            self.calculateDartPostions()

    def getCleanFrame(self):
        return self.clean_frame
    
    def getDartFrame(self):
        return self.dart_frame
    
    def getTrackedFrame(self):
        return self.tracked_frame

    # This method returns the dart positions for dispatching to the backend
    def getDartPositions(self):
        if not self.enabled:
            return []
        if self.dart_frame is None:
            print(f"Warning: Access to dart positions before setting the dart frame")
            return []
        
        if len(self.dart_positions) == 0:
            self.setCleanFrame(self.dart_frame)
        
        return self.dart_positions
    
    def enable(self):
        self.enabled = True

    def disable(self):
        self.enabled = False

    # This method must be implemented by the subclasses and should return a list of tuples
    @abstractmethod
    def calculateDartPostions(self):
        pass