namespace backend.Models;

public class GameStateCricket : GameState
{
    public bool includeBullseye { get; set; } = false;
    public int[][] hitMatrix { get; set; } = [];
    public bool[][] closedFields { get; set; } = [];
    
    public GameStateCricket()
    {
        gameType = GameMode.Cricket;
    }
}