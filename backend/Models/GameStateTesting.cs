namespace backend.Models;

public class GameStateTesting : GameState
{
    const int DartsPerTurn = 3;
    public GameStateTesting()
    {
        gameType = GameMode.Testing;
    }
}