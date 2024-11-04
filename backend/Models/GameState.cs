namespace backend.Models;

public abstract class GameState
{
    protected GameMode gameType { get; set; }
    protected List<Player> players = [];
    protected List<int> points = [];
    protected List<int> averages = [];
    protected List<int> darts = [];
    protected bool bust { get; set; } = false;
    protected int currentPlayer { get; set; } = 0;
    
    public void AddPlayer(Player player)
    {
        players.Add(player);
        points.Add(0);
        averages.Add(0);
        darts.Add(0);
    }
    
    public int IncrementPlayer()
    {
        currentPlayer = (currentPlayer + 1) % players.Count();
        return currentPlayer;
    }
}