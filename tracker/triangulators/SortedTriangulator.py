from triangulators.AbstractTriangulator import AbstractTriangulator
import numpy as np
import cv2

class SortedTriangulator(AbstractTriangulator):

    """
    This triangulator assumes that the points are already sorted by the camera tracker.
    Each 2D point should have a third value, which represents the order of its appearance.
    """

    def triangulate(self, points):
        calculatedDartPositions = []

        # check if the points have the correct format
        if len(points) < 2:
            return calculatedDartPositions
        
        if len(points) != len(self.cameras):
            return calculatedDartPositions
        
        for cameraPoints in points:
            for point in cameraPoints:
                if len(point) != 3:
                    print(f"Error: Points have the wrong format. Expected 3 values, got {len(point)}.")
                    return calculatedDartPositions

        projectionMatrices = []
        for camera in self.cameras:
            if not camera.isCameraCalibrated:
                return calculatedDartPositions
            projectionMatrices.append(camera.getProjectionMatrix())

        fundamentalMatrices = []
        for camera1 in self.cameras:
            matrices = []
            for camera2 in self.cameras:
                if camera1.index == camera2.index:
                    matrices.append(None)
                    continue
                matrices.append(self.getFundamentalMatrix(camera1, camera2))
            fundamentalMatrices.append(matrices)

        pointCorrespondences = {}
        for i, cameraPoints in enumerate(points):
            for point in cameraPoints:
                if point[2] not in pointCorrespondences.keys():
                    pointCorrespondences[point[2]] = []
                pointCorrespondences[point[2]].append((point[:2], i))

        pointCorrespondences = [value for key, value in sorted(pointCorrespondences.items(), key=lambda x: x[0])]

        validCorrespondences = {}
        # check epipolar constraint for each point
        for i, value in enumerate(pointCorrespondences):
            validCorrespondences[i] = []
            for j in range(len(value) - 1):
                for k in range(j + 1, len(value)):
                    F = fundamentalMatrices[value[j][1]][value[k][1]]
                    if F is None:
                        continue
                    distance = np.abs(self.getEpipolarDistance(F, value[j][0], value[k][0]))
                    if distance < 0.1:
                        validCorrespondences[i].append(((value[j], value[k]), distance))

        for i, validCorrespondence in validCorrespondences.items():
            if len(validCorrespondence) == 0:
                continue
            averagePoint = np.zeros((4,1), dtype=np.float32)
            total_error = 0
            for correspondence in validCorrespondence:
                # correspondence = ((((x1, y1), camera1), ((x2, y2), camera2)), inverse_error)
                # sorry :(
                error = 1.0 / correspondence[1]
                total_error += error
                homogenousPoint = cv2.triangulatePoints(
                    projectionMatrices[correspondence[0][0][1]], 
                    projectionMatrices[correspondence[0][1][1]], 
                    np.array(correspondence[0][0][0], dtype=np.float32), 
                    np.array(correspondence[0][1][0], dtype=np.float32))
                # weighted average with respect to the error
                homogenousPoint /= homogenousPoint[3]
                averagePoint += homogenousPoint * error
            averagePoint = averagePoint / total_error
            calculatedDartPositions.append(averagePoint)

        return calculatedDartPositions