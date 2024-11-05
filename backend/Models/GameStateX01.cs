namespace backend.Models;

public class GameStateX01 : GameState
{
    private string? inVariant { get; set; }
    private string? outVariant { get; set; }
    
    public GameStateX01()
    {
        gameType = GameMode.X01;
    }
}