from triangulators.AbstractTriangulator import AbstractTriangulator
import numpy as np
import cv2

class SortedTriangulator(AbstractTriangulator):

    """
    This triangulator assumes that the points are already sorted by the camera tracker.
    Each 2D point should have a third value, which represents the order of its appearance.
    """

    MAX_DISTANCE = 0.02

    def triangulate(self, points):
        calculatedDartPositions = []

        if not self.calibrated:
            return calculatedDartPositions

        # check if the points have the correct format
        if len(points) < 2:
            print(f"Error: Not enough points to triangulate. Got {len(points)}.")
            return calculatedDartPositions
        
        if len(points) != len(self.cameras):
            print(f"Error: Number of cameras ({len(self.cameras)}) does not match number of points ({len(points)}).")
            return calculatedDartPositions
        
        for cameraPoints in points:
            for point in cameraPoints:
                if len(point) != 3:
                    print(f"Error: Points have the wrong format. Expected 3 values, got {len(point)}.")
                    return calculatedDartPositions

        pointCorrespondences = {}
        for i, cameraPoints in enumerate(points):
            for point in cameraPoints:
                if point[2] not in pointCorrespondences.keys():
                    pointCorrespondences[point[2]] = []
                pointCorrespondences[point[2]].append((point[:2], i))

        pointCorrespondences = [value for key, value in sorted(pointCorrespondences.items(), key=lambda x: x[0])]

        #print(f"point correspondences: {pointCorrespondences}")

        validCorrespondences = {}
        # check epipolar constraint for each point
        for i, value in enumerate(pointCorrespondences):
            validCorrespondences[i] = []
            for j in range(len(value) - 1):
                for k in range(j + 1, len(value)):
                    F = self.fundamentalMatrices[value[j][1]][value[k][1]]
                    if F is None:
                        continue
                    distance = np.abs(self.getEpipolarDistance(F, value[j][0], value[k][0]))
                    if distance < self.MAX_DISTANCE:
                        validCorrespondences[i].append(((value[j], value[k]), distance))
                    else:
                        print(f"Point discarded: {value[j][0]} {value[k][0]}. Distance: {distance}")

        #print(f"valid correspondences: {validCorrespondences}")

        for i, validCorrespondence in validCorrespondences.items():
            if len(validCorrespondence) == 0:
                calculatedDartPositions.append([None, None, None, None])
                continue
            averagePoint = np.zeros((4,1), dtype=np.float32)
            total_weight = 0
            for correspondence in validCorrespondence:
                # correspondence = ((((x1, y1), camera1), ((x2, y2), camera2)), inverse_error)
                # sorry :(

                # scale the error to be between 0 and 1 and invert it
                # so that a smaller error has a larger weight
                weight = 1 - (correspondence[1] / self.MAX_DISTANCE)
                total_weight += weight

                # triangulate the points
                homogenousPoint = cv2.triangulatePoints(
                    self.projectionMatrices[correspondence[0][0][1]], 
                    self.projectionMatrices[correspondence[0][1][1]], 
                    np.array(correspondence[0][0][0], dtype=np.float32), 
                    np.array(correspondence[0][1][0], dtype=np.float32))
                
                # weighted average
                homogenousPoint /= homogenousPoint[3]
                averagePoint += homogenousPoint * weight

            averagePoint = averagePoint / total_weight
            if abs(averagePoint[2]) < 0.25:
                calculatedDartPositions.append(averagePoint)
            else:
                calculatedDartPositions.append([None, None, None, None])
                print(f"Point discarded: {averagePoint}. Z value: {averagePoint[2]}")

        return calculatedDartPositions