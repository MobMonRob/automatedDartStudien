namespace backend.Models;

public class GameStateX01 : GameState
{
    public string? inVariant { get; set; }
    public string? outVariant { get; set; }
    
    public GameStateX01()
    {
        gameType = GameMode.X01;
    }
}