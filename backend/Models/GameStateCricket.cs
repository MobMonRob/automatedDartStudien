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
    
    public override GameState DeepCopy()
    {
        var copy = new GameStateCricket();
        Copy(copy);
        
        copy.includeBullseye = this.includeBullseye;
        copy.hitMatrix = new int[hitMatrix.Length][];
        for (int i = 0; i < hitMatrix.Length; i++)
        {
            copy.hitMatrix[i] = new int[hitMatrix[i].Length];
            Array.Copy(hitMatrix[i], copy.hitMatrix[i], hitMatrix[i].Length);
        }
        copy.closedFields = new bool[closedFields.Length][];
        for (int i = 0; i < closedFields.Length; i++)
        {
            copy.closedFields[i] = new bool[closedFields[i].Length];
            Array.Copy(closedFields[i], copy.closedFields[i], closedFields[i].Length);
        }
        return copy;
    }
}