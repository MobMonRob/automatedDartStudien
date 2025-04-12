import cv2
import numpy as np

from matplotlib import pyplot as plt

import math
from sklearn.decomposition import PCA

from tracker.AbstractTracker import AbstractTracker

class Dart: 
    def __init__(self, centroids, dartNumber, isStrayGroup, posX, posY):
        self.centroids = centroids
        self.dartNumber = dartNumber
        self.isStrayGroup = isStrayGroup
        self.posX = posX
        self.posY = posY

class TrackerV2_2(AbstractTracker):
    sortedValues = False
    saveTrackingUtilImages = False
    utilImagesCircleDiameter = 3
    printLinesIntoResultImage = True
    showPixelCoordinatesInResultImage = False #Can be messy with many darts

    currentRunDarts = []
    run = 1

    #Parameter for the Tracker 
    #Used for the binary mask to remove occurence of single pixels and strays
    min_area_threshold = 5
    #Used for the amount of connected dots to be grouped together to recalculate the line
    adaptionRate = 3
    #Describes the amount of pixel fluctation between the runs within the dart centroid positions
    fluctationThreshhold = 7
    #Working with the same dart groups in the next run, sometimes new centroids are detected which are part of the old darts. To enable these centroids to be collected turn on recircleUsedDarts. 
    #The threshhold describes the maximum distance to the line to be added to the dart group
    recircleUsedDarts = True
    recircleThreshhold = 14
    recircleThreshholdUpward = 15

    # These are the functions needed for the main part
    def euclidean_distance(self, point1, point2):
        return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)

    def brighten_image(self, image, factor):
        if factor < 0 or factor > 255:
            raise ValueError("Factor must be between 0 and 255.")
        brightened_image = image.astype(np.int16) + factor
        return np.clip(brightened_image, 0, 255).astype(np.uint8)

    def enhance_contrast(self, image, factor):
        if factor < 0:
            raise ValueError("Factor must be positive.")
        contrast_image = image.astype(np.int16)
        contrast_image = 128 + factor * (contrast_image - 128)
        return np.clip(contrast_image, 0, 255).astype(np.uint8)

    def prepareMask(self, emptyFrame, dartFrame):
        brightness_factor = 10
        empty_dartboard_bright = self.brighten_image(emptyFrame, brightness_factor)
        dartboard_with_darts_bright = self.brighten_image(dartFrame, 0)

        contrast_factor = 1.2
        empty_dartboard_contrast = self.enhance_contrast(empty_dartboard_bright, contrast_factor)
        dartboard_with_darts_contrast = self.enhance_contrast(dartboard_with_darts_bright, 1.3)
        
        empty_gray = cv2.cvtColor(empty_dartboard_contrast, cv2.COLOR_BGR2GRAY)
        darts_gray = cv2.cvtColor(dartboard_with_darts_contrast, cv2.COLOR_BGR2GRAY)
        
        difference = cv2.absdiff(empty_gray, darts_gray)
        difference = self.enhance_contrast(difference, 1.5) 
        
        _, mask = cv2.threshold(difference, 40, 255, cv2.THRESH_BINARY)
        
        kernel = np.ones((3, 3), np.uint8) 
        mask_eroded = cv2.erode(mask, kernel, iterations=1)
        
        kernel = np.ones((2, 2), np.uint8) 
        mask_dilated = cv2.dilate(mask_eroded, kernel, iterations=1)

        return difference, mask_dilated

    def findPointsInMask(self, mask, min_area_threshold):
        #Find Centerpoints in Contours of Mask
        contours_in_mask, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        centroids = []

        for contour_mask in contours_in_mask:
            area = cv2.contourArea(contour_mask)
            
            if area > min_area_threshold:
                #Append Highgest Point
                topmost_point = min(contour_mask, key=lambda point: point[0][1])  
                cx, cy = int(topmost_point[0][0]), int(topmost_point[0][1])
                centroids.append((cx, cy))
                #Append Centerpoints
                M = cv2.moments(contour_mask)
                if M['m00'] != 0:
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])
                    centroids.append((cx, cy))
        return centroids

    def findDartPositions(self, groups, currentRunDarts):
        used_positions = {(dart.posX, dart.posY) for dart in currentRunDarts if not dart.isStrayGroup}
        for group in groups:
            if group.isStrayGroup or (group.posX, group.posY) in used_positions:
                continue

            sorted_group = sorted(group.centroids, key=lambda y: y[1])
            group.posX = sorted_group[0][0]
            group.posY = sorted_group[0][1]
        return groups

    def findClosestPoint(self, current_point, centroids):
        nearest_point = None
        min_distance = float('inf')
        for centroid in centroids:
            distance = self.euclidean_distance(centroid, current_point)
            
            if distance < min_distance:
                min_distance = distance
                nearest_point = centroid
        return nearest_point

    def findClosestPointBasedOnLine(self, slope, intercept, points, init_y, used_points, tolerance=2):
        nearest_point = None
        min_distance_to_line = float('inf')
        
        for point in points:
            x0, y0 = point

            if (any(abs(x0 - ux) <= tolerance and abs(y0 - uy) <= tolerance for ux, uy in used_points)):
                continue 

            y_position_on_dart = abs(y0 - init_y)

            #Expand the threshhold for the distance to the line based on the y-position difference to the dart
            if y_position_on_dart < 200:
                max_distance_threshhold = 25
            elif y_position_on_dart < 300:
                max_distance_threshhold = 30
            elif y_position_on_dart < 400:
                max_distance_threshhold = 35
            else:
                max_distance_threshhold = 85

            distance_to_line = abs(slope * x0 - y0 + intercept) / np.sqrt(slope**2 + 1)

            if distance_to_line < min_distance_to_line and distance_to_line < max_distance_threshhold:
                min_distance_to_line = distance_to_line
                nearest_point = point

        return nearest_point

    def calculateLine(self, points):
        x = np.array([point[0] for point in points])
        y = np.array([point[1] for point in points])

        #PCA Principal Component Analysis
        pca = PCA(n_components=1)
        pca.fit(points)

        slope = pca.components_[0][1] / pca.components_[0][0]
        intercept = np.mean(y) - slope * np.mean(x)

        return slope, intercept

    def drawLine(self, slope, line_mask, start_point):
        try:
            if slope == float("NaN") or slope == float("inf"):
                return
            line_length = 600

            x_offset = line_length / np.sqrt(1 + slope**2)
            y_offset = slope * x_offset

            if x_offset == float("NaN") or y_offset == float("NaN") :
                return

            end_point = (int(start_point[0] + (x_offset if slope >= 0 else -x_offset)),
                        int(start_point[1] + (y_offset if slope >= 0 else -y_offset)))
            
            cv2.line(line_mask, start_point, end_point, (255, 255, 255), 2)
        except ValueError:
            print("VALUE ERROR")
            print(f"slope: {slope}")


    def groupDots(self, centroids, point_mask, line_mask, adapting_rate, currentRunDarts, fluctationThreshhold, recircleUsedDarts, recircleThreshhold, upwardsThreshhold):
        groups = []
        used_points = set() 

        if len(currentRunDarts) > 0:
            groups, centroids, used_points = self.analyzeDartCorrespondences(centroids, currentRunDarts, fluctationThreshhold, recircleUsedDarts, recircleThreshhold, upwardsThreshhold, line_mask)
        
        current_point = self.getTopMostPoint(centroids)
        if current_point is not None:
            self.processGrouping(current_point, centroids, point_mask, line_mask, adapting_rate, used_points, fluctationThreshhold, groups)

        if len(centroids) > 0:
            groups.append(Dart(centroids, 0, isStrayGroup=True, posX=0, posY=0))

        return groups, point_mask, line_mask

    def analyzeDartCorrespondences(self, centroids, currentRunDarts, fluctationThreshhold, recircleUsedDarts, recircleThreshhold, upwardsThreshhold, line_mask):
        groups = []
        remaining_centroids = centroids.copy()
        used_points = set() 

        for dart in currentRunDarts:
            if dart.isStrayGroup:
                continue 

            corresponding_points = [
                point for point in remaining_centroids
                if any(
                    abs(point[0] - centroid[0]) <= fluctationThreshhold and
                    abs(point[1] - centroid[1]) <= fluctationThreshhold
                    for centroid in dart.centroids
                )
            ]

            highest_point = min(corresponding_points, key=lambda p: p[1], default=None)

            if not corresponding_points:
                continue

            used_points.update(corresponding_points)
            for point in corresponding_points:
                remaining_centroids.remove(point)

            dart_points = corresponding_points.copy()

            groups.append(Dart(dart_points, len(groups) + 1, isStrayGroup=False, posX=highest_point[0], posY=highest_point[1]))
        
        if recircleUsedDarts:
            for group in groups:
                slope, intercept = self.calculateLine(group.centroids)
                if self.printLinesIntoResultImage:
                    self.drawLine(slope, line_mask, (group.posX, group.posY))
                added_points = set()
                
                for point in remaining_centroids:
                    x0, y0 = point
                    distance = abs(slope * x0 - y0 + intercept) / np.sqrt(slope**2 + 1)
        
                    if distance <= recircleThreshhold and y0 >= group.posY - upwardsThreshhold: 
                        added_points.add((x0, y0))
                
                group.centroids.extend(added_points)
                used_points.update(added_points)
                for point in added_points:
                    remaining_centroids.remove(point)

        return groups, remaining_centroids, used_points

    def processGrouping(self, current_point, centroids, point_mask, line_mask, adaption_rate, used_points, fluctationThreshhold, groups):
        centroids.remove(current_point)
        nearest_points = [current_point]
        tmp_point = current_point

        for _ in range(min(len(centroids), adaption_rate)):
            nearest_point = self.findNextPoint(tmp_point, centroids, used_points, fluctationThreshhold)
            if nearest_point:
                tmp_point = nearest_point
                nearest_points.append(tmp_point)
                centroids.remove(nearest_point)

        slope, intercept = self.calculateLine(nearest_points)
        if self.printLinesIntoResultImage:
            self.drawLine(slope, line_mask, nearest_points[0])

        self.updateLineAndGroup(nearest_points, centroids, slope, intercept, line_mask, used_points, fluctationThreshhold, adaption_rate)

        if self.saveTrackingUtilImages:
            self.drawGroupedPoints(nearest_points, point_mask, line_mask)

        groups.append(Dart(nearest_points, len(groups) + 1, isStrayGroup=False, posX=0, posY=0))

    def getTopMostPoint(self, centroids):
        if not centroids:
            return None
        return min(centroids, key=lambda point: point[1])  

    def findNextPoint(self, current_point, centroids, used_points, threshhold):
        #Add Threhshold for pixel fluctation between runtimes
        new_points = [p for p in centroids if not any(abs(p[0] - ux) <= threshhold and abs(p[1] - uy) <= threshhold for ux, uy in used_points)]
        if new_points:
            return self.findClosestPoint(current_point, new_points)
        return self.findClosestPoint(current_point, centroids)


    def updateLineAndGroup(self, nearest_points, centroids, slope, intercept, line_mask, used_points, threshhold, adaption_rate):
        points_grouped = 0
        init_y = nearest_points[0][1]
        
        while True:
            nearest_point = self.findClosestPointBasedOnLine(slope, intercept, centroids, init_y, used_points, threshhold)
            if not nearest_point:
                break  

            centroids.remove(nearest_point)
            nearest_points.append(nearest_point)
            points_grouped += 1

            if points_grouped % adaption_rate == 0: 
                slope, intercept = self.calculateLine(nearest_points)
            elif points_grouped % 7 == 0 and self.printLinesIntoResultImage:
                self.drawLine(slope, line_mask, nearest_points[0])


    def drawGroupedPoints(self, nearest_points, point_mask, line_mask):
        color = (85, 195, 189)
        for point in nearest_points:
            cv2.circle(point_mask, point, 3, color, -1)
        point_mask = cv2.add(point_mask, line_mask)

    def drawCrossWithCoordinates(self, groups, dartFrame, colors, show_coordinates):
        mask3 = np.zeros_like(dartFrame) 

        for index, group in enumerate(groups):
            color = colors[index % len(colors)] 
            for (cx, cy) in group.centroids:
                cv2.line(mask3, (cx - 5, cy), (cx + 5, cy), color, 2) 
                cv2.line(mask3, (cx, cy - 5), (cx, cy + 5), color, 2)
                
                if show_coordinates:
                    coordinate_text = f"({cx}, {cy})"
                    cv2.putText(mask3, coordinate_text, (cx + 10, cy - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
        
        return mask3

    def calculateDartPostions(self, run=run):
        if(self.dart_frame is None or self.clean_frame is None):
            return
        
        dartFrameRotated = cv2.rotate(self.dart_frame, cv2.ROTATE_180)
        emptyFrameRotated = cv2.rotate(self.clean_frame, cv2.ROTATE_180)

        gray_dart = cv2.cvtColor(dartFrameRotated, cv2.COLOR_BGR2GRAY)
        gray_empty = cv2.cvtColor(emptyFrameRotated, cv2.COLOR_BGR2GRAY)
        difference = cv2.absdiff(gray_dart, gray_empty) 
        difference = cv2.cvtColor(difference, cv2.COLOR_GRAY2BGR)

        #Build difference so only darts are left
        mask0, mask1 = self.prepareMask(dartFrameRotated, emptyFrameRotated)

        mask2 = np.zeros_like(mask1)
        #Find centroid points in mask, draw them into an empty mask, min area threshold removes strays
        centroids = self.findPointsInMask(mask1, self.min_area_threshold)
        if self.saveTrackingUtilImages:
            for (cx, cy) in centroids:
                cv2.circle(mask2, (cx, cy), self.utilImagesCircleDiameter, (255, 0, 0), -1)

        point_mask = np.zeros_like(self.dart_frame)
        #For Line Mask to be filled, set self.printLinesIntoResultImage to True
        line_mask = np.zeros_like(self.dart_frame)

        groups, point_mask, line_mask = self.groupDots(centroids, point_mask, line_mask, self.adaptionRate, self.currentRunDarts, self.fluctationThreshhold, self.recircleUsedDarts, self.recircleThreshhold, self.recircleThreshholdUpward)

        #Neglect strays and find positions for the dart groups 
        darts = self.findDartPositions(groups, self.currentRunDarts)
        self.currentRunDarts.clear()
        self.currentRunDarts.extend(darts)

        colors = [
            (255, 0, 0),
            (0, 255, 0),
            (0, 0, 255),
            (0, 255, 255)
        ]

        mask3 = self.drawCrossWithCoordinates(groups, self.dart_frame, colors, self.showPixelCoordinatesInResultImage)
        mask3 = cv2.add(line_mask, mask3)

        result_image = cv2.add(mask3, difference)
        if(self.saveTrackingUtilImages):
            print(darts)
            cv2.imwrite('difference_'+run+'.jpg', difference)
            cv2.imwrite('mask0_'+run+'.jpg', mask0)
            cv2.imwrite('mask1_'+run+'.jpg', mask1)
            cv2.imwrite('mask2_'+run+'.jpg', mask2)
            cv2.imwrite('mask3_'+run+'.jpg', mask3)
            cv2.imwrite('result_'+run+'.jpg', result_image)
            cv2.imwrite('point_mask_'+run+'.jpg', point_mask)
            plt.imshow(result_image)
            plt.show()
        
        self.tracked_frame = result_image
        self.run += 1
        self.dart_positions = [[dart.posX, dart.posY, dart.dartNumber] for dart in darts[0:3]]

    def setCleanFrame(self, clean_frame):
        self.currentRunDarts = []
        self.clean_frame = clean_frame
        self.run = 1