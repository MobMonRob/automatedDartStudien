namespace backend.Models;

public abstract class GameState
{
    public GameMode gameType { get; set; }
    public List<Player> players = [];
    public List<int> points = [];
    public List<int> averages = [];
    public List<int> dartsThrown = [];
    public List<List<DartPosition>> lastDarts = [];
    public bool bust { get; set; } = false;
    public int currentPlayer { get; set; } = 0;
    public DateTime start { get; set; } = DateTime.Now;
    public DateTime? end { get; set; }

    public void AddPlayer(Player player)
    {
        players.Add(player);
        points.Add(0);
        averages.Add(0);
        dartsThrown.Add(0);
        lastDarts.Add([]);
    }
    
    public int MoveToNextPlayer()
    {
        currentPlayer = (currentPlayer + 1) % players.Count;
        return currentPlayer;
    }
}