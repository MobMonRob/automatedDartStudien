namespace backend.Models;

public class GameStateX01 : GameState
{
    public string? inVariant { get; set; }
    public string? outVariant { get; set; }
    
    public int initialPoints { get; set; }
    
    public GameStateX01()
    {
        gameType = GameMode.X01;
    }
    
    public override void AddPlayer(Player player)
    {
        players.Add(player);
        points.Add(initialPoints);
        averages.Add(0);
        dartsThrown.Add(0);
        lastDarts.Add([]);
    }
}