using backend.Models;

namespace backend.Services;

public class GameStateService
{
    private GameState _gameState;

    public GameStateService()
    {
        _gameState = new GameStateX01();
    }

    public GameStateService(GameState gameState)
    {
        _gameState = gameState;
    }
    
    public void StartGame(GameMode gameMode, List<Player> players, int? xo1InitialPoints)
    {
        Console.WriteLine("Starting game with mode: " + gameMode);
        switch (gameMode)
        {
            case GameMode.X01:
                _gameState = new GameStateX01();
                ((GameStateX01) _gameState).initialPoints = xo1InitialPoints ?? 501;
                break;
            case GameMode.Cricket:
                _gameState = new GameStateCricket();
                break;
        }
        players.ForEach(player => _gameState.AddPlayer(player));
    }

    public void HandleDartPositions(List<DartPosition> dartPositions)
    {
        // Game Logic
    }

    
}