namespace backend.Models;

public class TrackingData
{
    public string camera_id { get; set; } = "";
    public string? timestamp { get; set; }
    public List<Vector2> positions { get; set; } 

    public override string ToString()
    {
        return $"TrackingData(camera_id: {camera_id}, timestamp: {timestamp}, positions: {String.Join(", ", positions)})";
    }
}