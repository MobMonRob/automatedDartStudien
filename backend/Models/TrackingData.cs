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
    
    public List<Vector2> GetNewPositions(List<Vector2> old)
    {
        List<Vector2> newPositions = [];
        if(positions.Count > old.Count)
        {
            newPositions.AddRange(positions.GetRange(old.Count, positions.Count - old.Count));
        }
        return newPositions;
    }

    private static bool IsSimilarPosition(Vector2 compare, Vector2 other)
    { 
        // todo: make numerical calculation to determine "similarity"
        // right now an arbitrary value is used
        return Math.Abs(compare.x - other.x) < 0.01 && Math.Abs(compare.y - other.y) < 0.01;
    }
}