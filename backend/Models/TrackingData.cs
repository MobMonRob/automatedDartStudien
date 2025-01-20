namespace backend.Models;

public class TrackingData
{
    public bool calibrated { get; set; } = true ;
    public string? timestamp { get; set; }
    public List<Vector2> positions { get; set; } 

    public override string ToString()
    {
        return
            $"TrackingData(calibrated: {calibrated}, timestamp: {timestamp}, positions: {String.Join(", ", positions)})";
    }
}