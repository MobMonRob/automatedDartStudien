namespace backend.Models;

public class Vector2(double x, double y)
{
    public double x { get; set; } = x;
    public double y { get; set; } = y;

    public override string ToString()
    {
        return "(" + x + ", " + y + ")";
    }
}