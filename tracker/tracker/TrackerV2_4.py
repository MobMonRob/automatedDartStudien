import cv2
import numpy as np
import os
import subprocess
import tempfile

from matplotlib import pyplot as plt

import math
from sklearn.decomposition import PCA

from PIL import Image

from pixelmatch.contrib.PIL import pixelmatch

from tracker.AbstractTracker import AbstractTracker


class Dart:
    def __init__(self, centroids, dartNumber, isStrayGroup, posX, posY):
        self.centroids = centroids
        self.dartNumber = dartNumber
        self.isStrayGroup = isStrayGroup
        self.posX = posX
        self.posY = posY


class TrackerV2_4(AbstractTracker):
    sortedValues = True
    saveTrackingUtilImages = False
    utilImagesCircleDiameter = 3
    printLinesIntoResultImage = True
    showPixelCoordinatesInResultImage = False  # Can be messy with many darts
    drawPerpendicularLinesForShapeDetection = True

    currentRunDarts = []
    run = 1

    # Parameter for the Tracker
    # Used for the binary mask to remove occurence of single pixels and strays
    min_area_threshold = 8
    baseBinaryThreshold = 26
    #Parameters used to fit the detection to the dart outline. Threshold based on distance to the tip of the dart 
    distance_parameters = [(50, 35), (100, 40), (150, 35), (200, 55), (250, 120), (300, 150), (0, 175)]
    # Used for the amount of connected dots to be grouped together to recalculate the line
    adaptionRate = 3
    # Describes the amount of pixel fluctation between the runs within the dart centroid positions
    fluctationThreshold = 9
    # Working with the same dart groups in the next run, sometimes new centroids are detected which are part of the old darts. To enable these centroids to be collected turn on recircleUsedDarts.
    # The threshold describes the maximum distance to the line to be added to the dart group
    recircleUsedDarts = True
    recircleThreshold = 15
    recircleDistanceParameterFactor = 0.06
    recircleThresholdUpward = 60
    #Defines the maximum between two points for them to be considered grouped together
    maxAllowedDistance = 150

    #PixelMatch Library Intergration and parameters
    usePixelmatchLibrary = False
    usePixelmatchLibraryBinded = False
    pixelmatchThreshold = 0.15
    pixelmatchUseAA = True

    # These are the functions needed for the main part
    def euclidean_distance(self, point1, point2):
        return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)

    def adjust_brightness(self, image, factor):
        if factor < -255 or factor > 255:
            raise ValueError("Factor must be between -255 and 255.")
        adjusted_image = image.astype(np.int16) + factor
        return np.clip(adjusted_image, 0, 255).astype(np.uint8)

    def enhance_contrast(self, image, factor):
        if factor < 0:
            raise ValueError("Factor must be positive.")
        contrast_image = image.astype(np.int16)
        contrast_image = 128 + factor * (contrast_image - 128)
        return np.clip(contrast_image, 0, 255).astype(np.uint8)

    def prepareMask(self, emptyFrame, dartFrame, baseBinaryThreshold, usePixelmatch, usePixelmatchBinded, pixelMatchThreshold, pixelMatchUseAA):
        difference = None
        if usePixelmatch and not usePixelmatchBinded:
            baseBinaryThreshold += 30
            _, difference = self.pixelmatchCall(emptyFrame, dartFrame, pixelMatchThreshold, pixelMatchUseAA)
        elif not usePixelmatch and usePixelmatchBinded:
            baseBinaryThreshold += 30
            difference = self.pixelmatchCallBinded(emptyFrame, dartFrame, pixelMatchThreshold, pixelMatchUseAA)
        elif usePixelmatch and usePixelmatchBinded:
            raise ValueError("Only one pixelmatch library can be used at a time.")
        else: 
            empty_dartboard_bright = self.adjust_brightness(emptyFrame, 30)
            dartboard_with_darts_bright = self.adjust_brightness(dartFrame, 45)

            empty_dartboard_contrast = self.enhance_contrast(
                empty_dartboard_bright, 1.3
            )
            dartboard_with_darts_contrast = self.enhance_contrast(
                dartboard_with_darts_bright, 1.5
            )

            empty_gray = cv2.cvtColor(empty_dartboard_contrast, cv2.COLOR_BGR2GRAY)
            darts_gray = cv2.cvtColor(dartboard_with_darts_contrast, cv2.COLOR_BGR2GRAY)

            difference = cv2.absdiff(empty_gray, darts_gray)
            difference = self.enhance_contrast(difference, 1.8)
            difference = self.adjust_brightness(difference, 15)

        _, mask = cv2.threshold(difference, baseBinaryThreshold, 255, cv2.THRESH_BINARY)

        if not usePixelmatch and not usePixelmatchBinded:
            kernel = np.ones((3, 3), np.uint8)
            mask_eroded = cv2.erode(mask, kernel, iterations=1)

            kernel = np.ones((3, 3), np.uint8)
            mask = cv2.dilate(mask_eroded, kernel, iterations=1)

        return difference, mask

    def pixelmatchCall(self, img_a_cv, img_b_cv, pixelMatchThreshold, pixelMatchUseAA):
        #Pixelmatch Library wrapper
        img_a = Image.fromarray(cv2.cvtColor(img_a_cv, cv2.COLOR_BGR2RGB))
        img_b = Image.fromarray(cv2.cvtColor(img_b_cv, cv2.COLOR_BGR2RGB))
        
        img_diff = Image.new("RGBA", img_a.size)

        mismatch = pixelmatch(img_a, img_b, img_diff, pixelMatchThreshold, pixelMatchUseAA)

        img_diff = np.array(img_diff)
        img_diff = 255 - img_diff

        if img_diff.shape[2] == 4:
            img_diff = cv2.cvtColor(img_diff, cv2.COLOR_RGBA2GRAY)
        elif img_diff.shape[2] == 3:
            img_diff = cv2.cvtColor(img_diff, cv2.COLOR_RGB2GRAY)

        return mismatch, img_diff

    def pixelmatchCallBinded(self, img_a_cv, img_b_cv, pixelMatchThreshold, pixelMatchUseAA):
        #Pixelmatch Library wrapper for C++17 binded version via pybind11
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_a, \
            tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_b, \
            tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_out:

            cv2.imwrite(temp_a.name, img_a_cv)
            cv2.imwrite(temp_b.name, img_b_cv)

            cmd = [
                "python3", "-m", "pybind11_pixelmatch",
                temp_a.name, temp_b.name, temp_out.name,
                "--threshold", str(pixelMatchThreshold),
                "--includeAA", str(pixelMatchUseAA)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                print("Error while running pixelmatch:", result.stderr)
                return None

            img_diff = cv2.imread(temp_out.name, cv2.IMREAD_UNCHANGED)
            img_diff = cv2.cvtColor(img_diff, cv2.COLOR_RGBA2GRAY)
            img_diff = cv2.bitwise_not(img_diff)

            os.remove(temp_a.name)
            os.remove(temp_b.name)
            os.remove(temp_out.name)

            return img_diff

    def findPointsInMask(self, mask, min_area_threshold):
        # Find Centerpoints in Contours of Mask
        contours_in_mask, _ = cv2.findContours(
            mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        centroids = []

        for contour_mask in contours_in_mask:
            area = cv2.contourArea(contour_mask)

            if area > min_area_threshold:
                # Append Highest and Lowest Point
                topmost_point = min(contour_mask, key=lambda point: point[0][1])
                bottommost_point = max(contour_mask, key=lambda point: point[0][1])

                cx_top, cy_top = int(topmost_point[0][0]), int(topmost_point[0][1])
                cx_bottom, cy_bottom = int(bottommost_point[0][0]), int(bottommost_point[0][1])

                centroids.append((cx_top, cy_top))
                centroids.append((cx_bottom, cy_bottom))
                # Append Centerpoints
                M = cv2.moments(contour_mask)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    centroids.append((cx, cy))
        return centroids

    def findDartPositions(self, groups, currentRunDarts):
        used_positions = {
            (dart.posX, dart.posY) for dart in currentRunDarts if not dart.isStrayGroup
        }
        for group in groups:
            if group.isStrayGroup or (group.posX, group.posY) in used_positions:
                continue

            sorted_group = sorted(group.centroids, key=lambda y: y[1])
            group.posX = sorted_group[0][0]
            group.posY = sorted_group[0][1]
        return groups

    def findClosestPoint(self, current_point, centroids, maxAllowedDistance):
        nearest_point = None
        min_distance = float("inf")
        for centroid in centroids:
            distance = self.euclidean_distance(centroid, current_point)

            if distance < min_distance and distance <= maxAllowedDistance:
                min_distance = distance
                nearest_point = centroid
        return nearest_point

    def findClosestPointBasedOnLine(
        self, slope, intercept, points, init_y, distance_parameters
    ):
        nearest_point = None
        min_distance_to_line = float("inf")

        for point in points:
            x0, y0 = point

            y_position_on_dart = abs(y0 - init_y)

            # Expand the threshold for the distance to the line based on the y-position difference to the dart
            default_threshold = next(threshold for y, threshold in distance_parameters if y == 0)

            max_distance_threshold = next(
                (threshold for y, threshold in distance_parameters if y_position_on_dart < y),
                default_threshold
            )

            if slope == float("inf"):
                distance_to_line = abs(x0 - intercept)
            else:
                distance_to_line = abs(slope * x0 - y0 + intercept) / np.sqrt(
                    slope**2 + 1
                )

            if (
                distance_to_line < min_distance_to_line
                and distance_to_line < max_distance_threshold
            ):
                min_distance_to_line = distance_to_line
                nearest_point = point

        return nearest_point

    def calculateLine(self, points):
        x = np.array([point[0] for point in points])
        y = np.array([point[1] for point in points])

        # PCA Principal Component Analysis
        pca = PCA(n_components=1)
        pca.fit(points)

        direction = pca.components_[0]

        if direction[0] == 0:
            return float("inf"), np.mean(x)

        slope = direction[1] / direction[0]
        intercept = np.mean(y) - slope * np.mean(x)

        return slope, intercept

    def drawLine(self, slope, line_mask, start_point):
        try:
            if slope == float("NaN") or slope == float("inf"):
                return
            line_length = 600

            x_offset = line_length / np.sqrt(1 + slope**2)
            y_offset = slope * x_offset

            if any(math.isnan(v) for v in [x_offset, y_offset]):
                return

            end_point = (
                int(start_point[0] + (x_offset if slope >= 0 else -x_offset)),
                int(start_point[1] + (y_offset if slope >= 0 else -y_offset)),
            )

            cv2.line(line_mask, start_point, end_point, (255, 255, 255), 2)

            if not self.drawPerpendicularLinesForShapeDetection:
                return
            
            perpendicular_slope = -1 / slope if slope != 0 else float("inf")

            for distance, length in self.distance_parameters:
                x_pos = int(start_point[0] + (distance if slope > 0 else -distance) / np.sqrt(1 + slope**2))  
                y_pos = int(start_point[1] + slope * (x_pos - start_point[0]))

                perp_x_offset = length / (2 * np.sqrt(1 + perpendicular_slope**2))
                if not np.isinf(perpendicular_slope) and not np.isnan(perpendicular_slope):
                    perp_y_offset = perpendicular_slope * perp_x_offset
                    perp_start = (int(x_pos + perp_x_offset), int(y_pos + perp_y_offset))
                    perp_end = (int(x_pos - perp_x_offset), int(y_pos - perp_y_offset))

                    cv2.line(line_mask, perp_start, perp_end, (128, 0, 128), 2)
                
        except ValueError:
            print("VALUE ERROR")
            print(f"slope: {slope}")

    def groupDots(
        self,
        centroids,
        point_mask,
        line_mask,
        adapting_rate,
        currentRunDarts,
        fluctationThreshold,
        recircleUsedDarts,
        recircleThreshold,
        upwardsThreshold,
        maxAllowedDistance,
        distance_parameters,
        recircleDistanceParameterFactor
    ):
        groups = []

        if len(currentRunDarts) > 0:
            groups, centroids = self.analyzeDartCorrespondences(
                centroids,
                currentRunDarts,
                fluctationThreshold,
                recircleUsedDarts,
                recircleThreshold,
                upwardsThreshold,
                line_mask,
                distance_parameters,
                recircleDistanceParameterFactor
            )
        
        if len(groups) < 3 and len(centroids) >2:
            current_point = self.getTopMostPoint(centroids)
            if current_point is not None:
                self.processGrouping(
                    current_point,
                    centroids,
                    point_mask,
                    line_mask,
                    adapting_rate,
                    groups,
                    maxAllowedDistance,
                    distance_parameters
                )

        if len(centroids) > 0:
            groups.append(Dart(centroids, 0, isStrayGroup=True, posX=0, posY=0))

        return groups, point_mask, line_mask

    def analyzeDartCorrespondences(
        self,
        centroids,
        currentRunDarts,
        fluctationThreshold,
        recircleUsedDarts,
        recircleThreshold,
        upwardsThreshold,
        line_mask,
        distance_parameters,
        recircleDistanceParameterFactor
    ):
        groups = []
        remaining_centroids = centroids.copy()

        for dart in currentRunDarts:
            if dart.isStrayGroup:
                continue

            corresponding_points = [
                point for point in remaining_centroids
                if any(
                    abs(point[0] - centroid[0]) <= fluctationThreshold
                    and abs(point[1] - centroid[1]) <= fluctationThreshold
                    for centroid in dart.centroids
                )
            ]

            if not corresponding_points or len(corresponding_points) < 3:
                continue

            highest_point = min(corresponding_points, key=lambda p: p[1], default=None)

            for point in corresponding_points:
                remaining_centroids.remove(point)

            groups.append(
                Dart(
                    corresponding_points.copy(),
                    len(groups) + 1,
                    isStrayGroup=False,
                    posX=highest_point[0],
                    posY=highest_point[1],
                )
            )

        if recircleUsedDarts:
            for group in groups:
                slope, intercept = self.calculateLine(group.centroids)
                if self.printLinesIntoResultImage:
                    self.drawLine(slope, line_mask, (group.posX, group.posY))
                added_points = set()

                for point in remaining_centroids:
                    x0, y0 = point
                    if slope == float("inf"):
                        distance = abs(x0 - intercept)
                    else:
                        distance = abs(slope * x0 - y0 + intercept) / np.sqrt(
                            slope**2 + 1
                )

                    y_position_on_dart = abs(y0 - group.posY)

                    default_threshold = next(threshold for y, threshold in distance_parameters if y == 0)

                    max_distance_threshold = next(
                        ((threshold*recircleDistanceParameterFactor + recircleThreshold) for y, threshold in distance_parameters if y_position_on_dart < y),
                        (default_threshold*recircleDistanceParameterFactor + recircleThreshold)
                    )

                    if distance <= max_distance_threshold and y0 >= group.posY - upwardsThreshold:
                        added_points.add((x0, y0))

                group.centroids.extend(added_points)
                for point in added_points:
                    remaining_centroids.remove(point)

        return groups, remaining_centroids

    def processGrouping(
        self,
        current_point,
        centroids,
        point_mask,
        line_mask,
        adaption_rate,
        groups,
        maxAllowedDistance,
        distance_parameters
    ):
        centroids.remove(current_point)
        if len(centroids) == 0:
            groups.append(Dart([current_point], 0, isStrayGroup=True, posX=0, posY=0))
            return
        nearest_points = [current_point]

        for _ in range(min(len(centroids), adaption_rate)):
            nearest_point = self.findClosestPoint(current_point, centroids, maxAllowedDistance)
            if nearest_point:
                current_point = nearest_point
                nearest_points.append(current_point)
                centroids.remove(nearest_point)

        slope, intercept = self.calculateLine(nearest_points)
        if self.printLinesIntoResultImage:
            self.drawLine(slope, line_mask, nearest_points[0])

        self.updateLine(
            nearest_points,
            centroids,
            slope,
            intercept,
            line_mask,
            adaption_rate,
            distance_parameters
        )

        if self.saveTrackingUtilImages:
            self.drawGroupedPoints(nearest_points, point_mask, line_mask)
        
        if nearest_points and len(nearest_points) >= 2:
            groups.append(Dart(nearest_points, len(groups) + 1, isStrayGroup=False, posX=0, posY=0))
        else: 
            centroids.extend(nearest_points)

    def getTopMostPoint(self, centroids):
        if not centroids:
            return None
        return min(centroids, key=lambda point: point[1])

    def updateLine(
        self,
        nearest_points,
        centroids,
        slope,
        intercept,
        line_mask,
        adaption_rate,
        distance_parameters
    ):
        points_grouped = 0
        init_y = nearest_points[0][1]

        while (nearest_point := self.findClosestPointBasedOnLine(
            slope, intercept, centroids, init_y, distance_parameters
        )):
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
            if group.isStrayGroup:
                color = colors[len(colors)-1] 
            else:   
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
        if self.dart_frame is None or self.clean_frame is None:
            return

        dartFrameRotated = cv2.rotate(self.dart_frame, cv2.ROTATE_180)
        emptyFrameRotated = cv2.rotate(self.clean_frame, cv2.ROTATE_180)

        gray_dart = cv2.cvtColor(dartFrameRotated, cv2.COLOR_BGR2GRAY)
        gray_empty = cv2.cvtColor(emptyFrameRotated, cv2.COLOR_BGR2GRAY)
        difference = cv2.absdiff(gray_dart, gray_empty)
        difference = cv2.cvtColor(difference, cv2.COLOR_GRAY2BGR)

        # Build difference so only darts are left
        mask0, mask1 = self.prepareMask(dartFrameRotated, emptyFrameRotated, self.baseBinaryThreshold, self.usePixelmatchLibrary, self.usePixelmatchLibraryBinded, self.pixelmatchThreshold, self.pixelmatchUseAA)

        mask2 = np.zeros_like(mask1)
        # Find centroid points in mask, draw them into an empty mask, min area threshold removes strays
        centroids = self.findPointsInMask(mask1, self.min_area_threshold)
        if len(centroids) < 1: 
            self.tracked_frame = mask1
            self.run = 1
            self.dart_positions = []
            return

        if self.saveTrackingUtilImages:
            for cx, cy in centroids:
                cv2.circle(
                    mask2, (cx, cy), self.utilImagesCircleDiameter, (255, 0, 0), -1
                )

        point_mask = np.zeros_like(self.dart_frame)
        # For Line Mask to be filled, set self.printLinesIntoResultImage to True
        line_mask = np.zeros_like(self.dart_frame)

        groups, point_mask, line_mask = self.groupDots(
            centroids,
            point_mask,
            line_mask,
            self.adaptionRate,
            self.currentRunDarts,
            self.fluctationThreshold,
            self.recircleUsedDarts,
            self.recircleThreshold,
            self.recircleThresholdUpward,
            self.maxAllowedDistance,
            self.distance_parameters,
            self.recircleDistanceParameterFactor
        )

        # Neglect strays and find positions for the dart groups
        darts = self.findDartPositions(groups, self.currentRunDarts)
        self.currentRunDarts.clear()
        self.currentRunDarts.extend(darts)

        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (0, 255, 255)]

        mask3 = self.drawCrossWithCoordinates(
            groups, self.dart_frame, colors, self.showPixelCoordinatesInResultImage
        )
        mask3 = cv2.add(line_mask, mask3)

        difference= self.adjust_brightness(difference, 50)
        result_image = cv2.add(mask3, difference)
        if self.saveTrackingUtilImages:
            print(darts)
            cv2.imwrite("difference_" + run + ".jpg", difference)
            cv2.imwrite("mask0_" + run + ".jpg", mask0)
            cv2.imwrite("mask1_" + run + ".jpg", mask1)
            cv2.imwrite("mask2_" + run + ".jpg", mask2)
            cv2.imwrite("mask3_" + run + ".jpg", mask3)
            cv2.imwrite("result_" + run + ".jpg", result_image)
            cv2.imwrite("point_mask_" + run + ".jpg", point_mask)
            plt.imshow(result_image)
            plt.show()

        #self.tracked_frame = cv2.rotate(result_image, cv2.ROTATE_180)
        self.tracked_frame = result_image
        self.run = getattr(self, 'run', 0) + 1
        self.dart_positions = [
            [dart.posX, dart.posY, dart.dartNumber] for dart in darts if not dart.isStrayGroup
        ]

    def setCleanFrame(self, clean_frame):
        self.currentRunDarts = []
        self.clean_frame = clean_frame
        self.run = 1
