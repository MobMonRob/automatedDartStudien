## This tracker only returns (0,0)

from tracker.AbstractTracker import AbstractTracker

class ZeroTracker(AbstractTracker):
        sortedValues = False
        
        def calculateDartPostions(self):
            self.dart_positions = [(0,0), (0,0), (0,0)]

