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

    // Calculate whether this instance's positions are similar enough to the other's to be determined as equal
    public bool HasSimilarPositions(List<Vector2> other)
    {
        if (this.positions.Count != other.Count) return false;
        for (var i = 0; i < this.positions.Count; ++i)
        {
            if (!IsSimilarPosition(this.positions[i], other[i])) return false;
        }
        return true;
    }

    private static bool IsSimilarPosition(Vector2 compare, Vector2 other)
    { 
        // todo: make numerical calculation to determine "similarity"
        // right now an arbitrary value is used
        return Math.Abs(compare.x - other.x) < 0.005 && Math.Abs(compare.y - other.y) < 0.005;
    }
    
    
}