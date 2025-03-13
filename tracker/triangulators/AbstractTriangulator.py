from abc import ABC, abstractmethod
import numpy as np

class AbstractTriangulator(ABC):

    cameras = []

    def __init__(self, cameras):
        super().__init__()
        self.cameras = cameras

    def getFundamentalMatrix(self, camera1, camera2):
        K1 = camera1.camera_matrix
        K2 = camera2.camera_matrix
        R1 = camera1.rotation_matrix
        R2 = camera2.rotation_matrix
        t1 = camera1.translation
        t2 = camera2.translation

        R = R2 @ R1.T # relative rotation
        t = t2 - R @ t1 # relative translation

        t_skew = np.array([
            [0, -t[2, 0], t[1, 0]],
            [t[2, 0], 0, -t[0, 0]],
            [-t[1, 0], t[0, 0], 0]
        ])
        E = t_skew @ R

        F = np.linalg.inv(K2).T @ E @ np.linalg.inv(K1)
        if np.linalg.norm(F) != 0:
            F /= np.linalg.norm(F)
        return F
    
    def getEpipolarDistance(self, F, x1, x2):
            # get distance of x2 to epipolar line of x1
            x1 = np.array([x1[0], x1[1], 1], dtype=np.float32)
            x2 = np.array([x2[0], x2[1], 1], dtype=np.float32)
            return x2.T @ F @ x1

    @abstractmethod
    def triangulate(self, points):
        pass