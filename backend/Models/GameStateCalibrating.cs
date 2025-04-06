namespace backend.Models;

public class GameStateCalibrating : GameState
{
    public Vector2 currentPosition { get; set; } = new Vector2(0, 0);
    public CalibrationState calibrationState { get; set; } = CalibrationState.WaitingForEmptyBoard;
    public List<CalibrationCamera> cameras { get; set; } = new();
    public int calibrationIndex { get; set; } = 0;
    public int calibrationCount { get; set; } = 0;
    
    public GameStateCalibrating()
    {
        gameType = GameMode.Calibrating;
    }
    
    public enum CalibrationState
    {
        WaitingForEmptyBoard,
        WaitingForUserConfirmation,
        WaitingForDart,
        Finished,
    }
}