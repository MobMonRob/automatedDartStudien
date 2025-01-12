namespace backend.Models;

public class Vector3 (double x, double y, double z)
{
    public double x { get; set; }
    public double y { get; set; }
    public double z { get; set; }

    public override string ToString()
    {
        return "(" + x + ", " + y + ", " + z + ")";
    }
}