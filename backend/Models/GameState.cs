namespace backend.Models;

public abstract class GameState
{
    public GameMode gameType { get; set; }
    public List<Player> players { get; set; } = new();
    public List<int> points { get; set; } = new();
    public List<double> averages { get; set; } = new();
    public List<int> dartsThrown { get; set; } = new();
    public List<List<DartPosition>> lastDarts { get; set; } = new();

    public bool bust { get; set; } = false;
    public int currentPlayer { get; set; } = 0;
    public DateTime start { get; set; } = DateTime.Now;
    public DateTime? end { get; set; }
    
    public const int DartsPerTurn = 3;
    
    public List<bool> cameraStatus { get; set; } = new();

    public virtual void AddPlayer(Player player)
    {
        players.Add(player);
        points.Add(0);
        averages.Add(0.0);
        dartsThrown.Add(0);
        lastDarts.Add([]);
    }
    
    public int MoveToNextPlayer()
    {
        currentPlayer = (currentPlayer + 1) % players.Count;
        lastDarts[currentPlayer].Clear();
        return currentPlayer;
    }
    
    public int MoveToPreviousPlayer()
    {
        currentPlayer = (currentPlayer - 1 + players.Count) % players.Count;
        return currentPlayer;
    }

    public object Clone()
    {
        return this.MemberwiseClone();
    }
    
    public override bool Equals(object? obj)
    {
        if (obj == null || GetType() != obj.GetType())
        {
            return false;
        }

        GameState other = (GameState) obj;
        return gameType == other.gameType && players.SequenceEqual(other.players) && points.SequenceEqual(other.points) && averages.SequenceEqual(other.averages) && dartsThrown.SequenceEqual(other.dartsThrown) && lastDarts.SequenceEqual(other.lastDarts) && bust == other.bust && currentPlayer == other.currentPlayer && start == other.start && end == other.end;
    }
    
    public override int GetHashCode()
    {
        return HashCode.Combine(gameType,
            players,
            points,
            averages,
            dartsThrown,
            lastDarts,
            bust,
            currentPlayer);
    }
}