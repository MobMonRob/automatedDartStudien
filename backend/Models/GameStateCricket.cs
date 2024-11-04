namespace backend.Models;

public class GameStateCricket : GameState
{
    private bool includeBullseye { get; set; } = false;
    private int[][] hitMatrix { get; set; } = [];
    private bool[][] closedFields { get; set; } = [];
    
    public GameStateCricket()
    {
        gameType = GameMode.Cricket;
    }
}