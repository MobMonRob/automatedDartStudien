using backend.Models;

namespace backend.Services;

public class DartPositionService
{
    private List<TrackingCamera> cameras = [];
    
    private Dictionary<string, List<Vector2>> dartPositions = new();
    
    private bool isCalibrated = false;
    
    private GameState gameState = new GameStateX01();

    public void CalibrateCameras()
    {
        Console.WriteLine("Calibrating cameras");
        isCalibrated = false;
        cameras = [];
        
        foreach(var entry in dartPositions)
        {
            // Todo: Calculate the 3D position of the camera 
            var position3d = new Vector3(0.0, 0.0, 0.0);
            
            // Todo: Calculate the 3D rotation of the camera 
            var rotation3d = new Vector3(0.0, 0.0, 0.0);
            
            var camera = new TrackingCamera
            {
                id = entry.Key,
                position3d = position3d,
                rotation3d = rotation3d
            };

            cameras.Add(camera);
        }
        
        isCalibrated = true;
    }
    
    public void HandleTrackingData(TrackingData data)
    {
        Console.WriteLine("Handling tracking data:  " + data);
        
        // Overwrite the dart positions for the camera
        dartPositions[data.camera_id] = [];
        foreach (var position in data.positions)
        {
            dartPositions[data.camera_id].Add(position);
        }
        
        if(!isCalibrated) return;
        
        // Calculate the new GameState
    }
}