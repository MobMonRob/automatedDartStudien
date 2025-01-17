import cv2
import numpy as np

object_points = np.array([
    [0.0, 0.0, 0.0],   
    [1.0, 0.0, 0.0],   
    [1.0, 1.0, 0.0],   
], dtype=np.float32)


image_points = np.array([
    [200.0, 200.0],   
    [400.0, 200.0],   
    [400.0, 400.0],  
], dtype=np.float32)

focal_length = 1000
center = (320, 240)

camera_matrix = np.array([
    [focal_length, 0, center[0]],
    [0, focal_length, center[1]],
    [0, 0, 1]
], dtype=np.float32)

dist_coeffs = np.zeros((4, 1))

success, rotation_vector, translation_vector = cv2.solvePnP(object_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_SQPNP)

if success:
    print("Rotation Vector:")
    print(rotation_vector)
    
    print("Translation Vector:")
    print(translation_vector)

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    print("Rotation Matrix:")
    print(rotation_matrix)

else:
    print("PnP solution was not successful.")
