using Microsoft.Extensions.ObjectPool;

namespace backend.Models;

public class DartPosition
{
    public byte points { get; set; }
    public bool doubleField { get; set; }
    public bool tripleField { get; set; }
    public Vector2? position { get; set; }

    public DartPosition(byte points, bool doubleField, bool tripleField)
    {
        this.points = points;
        this.doubleField = doubleField;
        this.tripleField = tripleField;
        if(this.points is < 0 or > 20 && this.points != 25)
        {
            Console.WriteLine("Points must be between 0 and 20 or 25");
            this.points = 0;
        }
        if(this.points == 25 && tripleField)
        {
            Console.WriteLine("Bulls eye can't be triple");
            this.tripleField = false;
        }
        if (this.doubleField && this.tripleField)
        {
            Console.WriteLine("Can't hit double and triple at the same time");
            this.tripleField = false;
        }
    } 
    
    public DartPosition(byte points, bool doubleField, bool tripleField, Vector2? position) : this(points, doubleField, tripleField)
    {
        this.position = position;
    }
    
    public int getPositionValue()
    {
        return points * (doubleField ? 2 : 1) * (tripleField ? 3 : 1);
    }
    
    public override string ToString()
    {
        return points + (doubleField ? "D" : "") + (tripleField ? "T" : "");
    }
    
    public override bool Equals(object? obj)
    {
        if (obj == null || GetType() != obj.GetType())
        {
            return false;
        }

        DartPosition other = (DartPosition) obj;
        return points == other.points && doubleField == other.doubleField && tripleField == other.tripleField;
    }
    
    public override int GetHashCode()
    {
        return HashCode.Combine(points, doubleField, tripleField);
    }
}