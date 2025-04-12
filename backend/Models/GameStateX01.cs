namespace backend.Models;

public class GameStateX01 : GameState
{
    public string? inVariant { get; set; }
    public string? outVariant { get; set; }
    
    public new const int DartsPerTurn = 3;
    
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
        sets.Add(0);
        lastDarts.Add([]);
    }
    
    public override string ToString()
    {
        var lastDartsString = new List<string>();
        foreach (var lastDart in lastDarts)
        {
            var lastDartString = new List<string>();
            foreach (var dart in lastDart)
            {
                lastDartString.Add(dart.ToString());
            }
            lastDartsString.Add(string.Join(",", lastDartString));
        }
        return "GameStateX01{" +
               ", players=" + string.Join(",", players) +
               ", points=" + string.Join(",", points) +
               ", averages=" + string.Join(",", averages) +
               ", dartsThrown=" + string.Join(",", dartsThrown) +
               ", sets=" + string.Join(",", sets) +
               ", lastDarts=" + string.Join(",", lastDartsString) +
               ", bust=" + bust +
               ", currentPlayer=" + currentPlayer +
               ", start=" + start +
               ", end=" + end +
               ", cameraStatus=" + string.Join(",", cameraStatus) +
               '}';
    }
    
    public override GameState DeepCopy()
    {
        var copy = new GameStateX01();
        Copy(copy);
        
        copy.inVariant = this.inVariant;
        copy.outVariant = this.outVariant;
        copy.initialPoints = this.initialPoints;
        
        return copy;
    }
}