namespace backend.Models;

public abstract class GameState
{
    public GameMode gameType { get; set; }
    public List<Player> players = [];
    public List<int> points = [];
    public List<int> averages = [];
    public List<int> darts = [];
    public bool bust { get; set; } = false;
    public int currentPlayer { get; set; } = 0;
    
    public void AddPlayer(Player player)
    {
        players.Add(player);
        points.Add(0);
        averages.Add(0);
        darts.Add(0);
    }
    
    public int MoveToNextPlayer()
    {
        currentPlayer = (currentPlayer + 1) % players.Count;
        return currentPlayer;
    }
}