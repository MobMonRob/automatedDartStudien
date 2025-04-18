namespace backend.Models;

public class CalibrationCamera
{
    public int id { get; set; } = 0;
    public State state { get; set; } = State.NoDarts;
    public double? evaluation { get; set; }
    
    public enum State
    {
        NoDarts,
        TooManyDarts,
        ConfirmingPosition,
        ConfirmedPosition,
    }
}