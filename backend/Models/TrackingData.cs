namespace backend.Models;

public class TrackingData
{
    public bool calibrated { get; set; }
    public bool sorted { get; set; }
    public string? timestamp { get; set; }
    public List<Vector2?>? positions { get; set; } 

    public override string ToString()
    {
        var calibrationCross = this.calibrated ? "\u2713" : "X";
        var sortedCross = this.sorted ? "\u2713" : "X";
        var positionString = positions == null ? "" : string.Join(", ", positions);
        return
            $"{timestamp}: Tracking Data (c: {calibrationCross}, s: {sortedCross}) {positions?.Count} positions: {positionString}";
    }
    
    public List<Vector2> GetNewPositions(List<Vector2?> old)
    {
        if (positions == null || positions.Count == 0) return new List<Vector2>();
        List<Vector2> newPositions = [];
        if(positions.Count > old.Count)
        {
            newPositions.AddRange(positions.GetRange(old.Count, positions.Count - old.Count));
        }
        return newPositions;
    }
}