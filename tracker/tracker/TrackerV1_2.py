import cv2
import numpy as np

from matplotlib import pyplot as plt

import math
from sklearn.decomposition import PCA

from tracker.AbstractTracker import AbstractTracker

class TrackerV1_2(AbstractTracker):
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
        cv2.imwrite("premask.jpg",difference)
        
        kernel = np.ones((3, 3), np.uint8) 
        mask_eroded = cv2.erode(mask, kernel, iterations=1)
        
        mask_dilated = cv2.dilate(mask_eroded, kernel, iterations=1)

        return mask_dilated

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

    def findClosestPoint(self, current_point, centroids):
        nearest_point = None
        min_distance = float('inf')
        for centroid in centroids:
            distance = self.euclidean_distance(centroid, current_point)
            
            if distance < min_distance:
                min_distance = distance
                nearest_point = centroid
        return nearest_point

    def findClosestPointBasedOnLine(self, slope, intercept, points, init_y):
        nearest_point = None
        min_distance_to_line = float('inf')
        
        for point in points:
            x0, y0 = point 

            y_position_on_dart = abs(y0 - init_y)

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

        #PCA Hauptkomponenten Analyse
        pca = PCA(n_components=1)
        pca.fit(points)

        slope = 0
        if pca.components_[0][0] == 0:
            slope = float('inf')
        else:
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

    def groupDots(self, centroids, point_mask, line_mask):
        groups = []
        while len(centroids) > 0 and len(groups) < 3:
            sorted_centroids = sorted(centroids, key=lambda y: y[1])
            current_point = sorted_centroids[0]
            centroids.remove(current_point)

            nearest_points = []
            nearest_points.append(current_point)
            tmp_point = current_point
            point_range = len(centroids) if len(centroids) < 5 else 5
            for _ in range(point_range):
                nearest_point = self.findClosestPoint(tmp_point, centroids)
                tmp_point = nearest_point
                nearest_points.append(tmp_point)
                centroids.remove(nearest_point)

            slope, intercept = self.calculateLine(nearest_points)
            if slope == float("NaN"):
                continue
            self.drawLine(slope, line_mask, nearest_points[0])

            points_grouped = 0
            init_y = nearest_points[0][1]
            
            miss = False
            while not miss:
                nearest_point = self.findClosestPointBasedOnLine(slope, intercept, centroids, init_y)
                if nearest_point:
                    centroids.remove(nearest_point)
                    nearest_points.append(nearest_point)
                    points_grouped += 1
                else: 
                    miss = True
                if points_grouped%7 == 0:
                    slope, intercept = self.calculateLine(nearest_points)
                    self.drawLine(slope, line_mask, nearest_points[0])

            color = (85, 195, 189) 
            for _, group in enumerate(nearest_points):
                cv2.circle(point_mask, (group), 5, color, -1)

            point_mask = cv2.add(point_mask, line_mask)

            groups.append(nearest_points)
        return groups, point_mask, line_mask

    def findDartPositions(self, groups):
        darts = []
        for group in groups:
            sorted_group = sorted(group, key=lambda y: y[1])
            darts.append(sorted_group[0])
        return darts
        
    def calculateDartPostions(self):
        if(self.dart_frame is None or self.clean_frame is None):
            return
        
        dartFrameRotated = cv2.rotate(self.dart_frame, cv2.ROTATE_180)
        emptyFrameRotated = cv2.rotate(self.clean_frame, cv2.ROTATE_180)

        gray_dart = cv2.cvtColor(dartFrameRotated, cv2.COLOR_BGR2GRAY)
        gray_empty = cv2.cvtColor(emptyFrameRotated, cv2.COLOR_BGR2GRAY)
        difference = cv2.absdiff(gray_dart, gray_empty) 
        difference = cv2.cvtColor(difference, cv2.COLOR_GRAY2BGR)

        #Build difference so only darts are left
        mask1 = self.prepareMask(dartFrameRotated, emptyFrameRotated)

        mask2 = np.zeros_like(self.dart_frame)
        #Find centroid points in mask, draw them into an empty mask, min area threshold removes ausreißer
        centroids = self.findPointsInMask(mask1, 5)
        for (cx, cy) in centroids:
            cv2.circle(mask2, (cx, cy), 5, (255, 0, 0), -1)

        point_mask = np.zeros_like(self.dart_frame)
        line_mask = np.zeros_like(self.dart_frame)

        groups, point_mask, line_mask = self.groupDots(centroids, point_mask, line_mask)

        #Mark ausreißer in the mask, not group points (left in centroids) get added to the groups so they can be added as ausreißer in the result image
        if len(centroids) > 0:
            groups.append(centroids)

        #Neglect ausreißer and find positions for the dart groups 
        darts = self.findDartPositions(groups[0:3])

        colors = [
            (255, 0, 0),
            (0, 255, 0),
            (0, 0, 255),
            (0, 255, 255)
        ]

        mask3 = np.zeros_like(self.dart_frame)
        for index, group in enumerate(groups):
            color = colors[index % len(colors)] 
            for (cx, cy) in group:
                cv2.circle(mask3, (cx, cy), 5, color, -1)

        mask3 = cv2.add(line_mask, mask3)

        result_image = cv2.add(mask3, difference)
        self.tracked_frame = result_image

        #Set printOut to True to save the images
        printOut = False
        if(printOut):
            print(darts)
            cv2.imwrite('difference.jpg', difference)
            cv2.imwrite('mask1.jpg', mask1)
            cv2.imwrite('mask2.jpg', mask2)
            cv2.imwrite('mask3.jpg', mask3)
            cv2.imwrite('result.jpg', result_image)
            cv2.imwrite('point_mask.jpg', point_mask)
            plt.imshow(result_image)
            plt.show()

        self.dart_positions = darts