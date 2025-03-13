from triangulators.AbstractTriangulator import AbstractTriangulator
import numpy as np
import cv2

class UnsortedTriangulator(AbstractTriangulator):

    def triangulate(self, points):
        calculatedDartPositions = []

        # todo: make work with more than 2 cameras
        if len(self.cameras) != 2:
            print("Error: Only 2 cameras are supported as of now")
            return calculatedDartPositions
        
        projectionMatrices = []
        for camera in self.cameras:
            if not camera.isCameraCalibrated:
                return calculatedDartPositions
            projectionMatrices.append(camera.getProjectionMatrix())
            
        F = self.getFundamentalMatrix(self.cameras[0], self.cameras[1])

        foundCorrespondences = []
        
        if len(points) < 2:
            return calculatedDartPositions

        positions1 = points[0].copy()
        positions2 = points[1].copy()

        # matching points by epipolar constraint
        for point1 in positions1:
            bestFitIndex = -1
            bestFit = ((0,0), np.float32(9999999999999))
            for i, point2 in enumerate(positions2):
                distance = np.abs(self.getEpipolarDistance(F, point1, point2))
                if distance < bestFit[1]:
                    bestFit = (point2, distance)
                    bestFitIndex = i
            if bestFitIndex != -1:
                foundCorrespondences.append(((point1, bestFit[0]), bestFit[1]))
                del positions2[bestFitIndex]
            

        if len(foundCorrespondences) == 0:
            print("No correspondences found")
            return calculatedDartPositions
        
        print(f"All Correspondences: {foundCorrespondences}")

        for i, (correspondence, _) in enumerate(foundCorrespondences):
            homogenousPoint = cv2.triangulatePoints(projectionMatrices[0], projectionMatrices[1], correspondence[0], correspondence[1])
            calculatedDartPositions.append(homogenousPoint / homogenousPoint[3])

        return calculatedDartPositions