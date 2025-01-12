## This tracker is a template for other trackers. It does not find any darts.

from tracker.AbstractTracker import AbstractTracker

class TemplateTracker(AbstractTracker):
        
        def calculateDartPostions(self):
            # Given variables
            print(self.clean_frame)
            print(self.dart_frame)

            # Please set the following variables while calculating the dart positions
            print(self.tracked_frame)

            # Set the dart positions as a list of tuples
            # [(x1, y1), (x2, y2), ...]
            # If no darts are found, set to an empty list

            self.dart_positions = []

