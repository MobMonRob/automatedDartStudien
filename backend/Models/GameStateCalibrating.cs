namespace backend.Models;

public class GameStateCalibrating : GameState
{
    public Vector2 currentPosition { get; set; } = new Vector2(0, 0);
    public CalibrationState calibrationState { get; set; } = CalibrationState.WaitingForEmptyBoard;
    public List<CalibrationCamera> cameras { get; set; } = [];
    public int calibrationIndex { get; set; } = 0;
    public int calibrationCount { get; set; } = 0;
    
    public GameStateCalibrating()
    {
        gameType = GameMode.Calibrating;
    }

    public override GameState DeepCopy()
    {
        var copy = new GameStateCalibrating();
        Copy(copy);
        copy.currentPosition = this.currentPosition;
        copy.calibrationState = this.calibrationState;
        copy.cameras = new List<CalibrationCamera>(this.cameras);
        copy.calibrationIndex = this.calibrationIndex;
        copy.calibrationCount = this.calibrationCount;
        return copy;
    }

    public enum CalibrationState
    {
        WaitingForEmptyBoard,
        WaitingForUserConfirmation,
        WaitingForDart,
        Finished,
    }
}