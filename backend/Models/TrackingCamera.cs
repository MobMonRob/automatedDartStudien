namespace backend.Models;

public class TrackingCamera
{
    public string? id { get; set; }
    public (double x, double y, double z) position3d { get; set; }
    public (double x, double y, double z) rotation3d { get; set; }
}