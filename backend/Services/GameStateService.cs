using backend.Models;

namespace backend.Services;

public class GameStateService(GameStateConnectionService gameStateConnectionService, GameState gameState)
{
    private GameState _gameState = gameState;
    private readonly GameStateConnectionService _gameStateConnectionService = gameStateConnectionService;
    private bool gameIsRunning = false;
    private bool throwIsOver = false;
    private List<DartPosition> currentThrow = [];
    private List<bool> hasThrownDouble = [];

    public GameStateService(GameStateConnectionService gameStateConnectionService) : this(gameStateConnectionService, new GameStateX01()) {}

    public void StartGame(GameMode gameMode, List<Player> players, int? xo1InitialPoints)
    {
        Console.WriteLine("Starting game with mode: " + gameMode);
        switch (gameMode)
        {
            case GameMode.X01:
                _gameState = new GameStateX01();
                ((GameStateX01) _gameState).initialPoints = xo1InitialPoints ?? 501;
                players.ForEach(player => ((GameStateX01) _gameState).AddPlayer(player));
                hasThrownDouble = new List<bool>(players.Count);
                break;
            case GameMode.Cricket:
                _gameState = new GameStateCricket();
                players.ForEach(player => _gameState.AddPlayer(player));
                break;
        }
        gameIsRunning = true;
        _gameStateConnectionService.sendGamestateToClients(_gameState);
    }

    public async Task HandleDartPositions(List<DartPosition> dartPositions)
    {
        Console.WriteLine("Received dart positions: ");
        dartPositions.ForEach(dp => Console.Write(dp.ToString() + ", "));
        Console.WriteLine();
        
        if (!gameIsRunning) return;

        if(throwIsOver)
        {
            if(dartPositions.Count != 0) return;
            currentThrow = [];
            throwIsOver = false;
            _gameState.MoveToNextPlayer();
        }

        switch (_gameState)
        {
            case GameStateX01 gameStateX01:
                HandleGameLogicX01(gameStateX01, dartPositions);
                break;
            case GameStateCricket gameStateCricket:
                throw new NotImplementedException();
                break;
        }
        
        await _gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    private void HandleGameLogicX01(GameStateX01 gameState, List<DartPosition> dartPositions)
    {
        // compare incoming dart positions with last dart positions
        var newDarts = dartPositions.Except(currentThrow).ToList();
        if (newDarts.Count == 0) return;
        
        gameState.bust = false;
        
        int points = gameState.points[gameState.currentPlayer];
        int dartsThrown = gameState.dartsThrown[gameState.currentPlayer];
        List<DartPosition> lastDarts = gameState.lastDarts[gameState.currentPlayer];
        int average = gameState.averages[gameState.currentPlayer];
        
        foreach (var dartPosition in newDarts)
        {
            if (dartPosition.tripleField)
            {
                points -= dartPosition.points * 3;
            }
            else if (dartPosition.doubleField)
            {
                hasThrownDouble[gameState.currentPlayer] = true;
                points -= dartPosition.points * 2;
            }
            else
            {
                points -= dartPosition.points;
            }
            
            if(gameState.inVariant == "Double In" && !hasThrownDouble[gameState.currentPlayer])
            {
                points = 0;
            }
            
            dartsThrown++;
            lastDarts.Add(dartPosition);
            average = (average * (dartsThrown - 1) + dartPosition.points) / dartsThrown;
        }
        
        gameState.points[gameState.currentPlayer] = points;
        gameState.dartsThrown[gameState.currentPlayer] = dartsThrown;
        gameState.lastDarts[gameState.currentPlayer] = lastDarts;
        gameState.averages[gameState.currentPlayer] = average * GameStateX01.DartsPerTurn;
        
        if (points == 0)
        {
            if(gameState.outVariant == "Double Out" && !lastDarts.Last().doubleField)
            {
                HandleBust(gameState, lastDarts);
            }
            gameState.end = DateTime.Now;
            gameIsRunning = false;
        }
        else if (points < 0)
        {
            HandleBust(gameState, lastDarts);
        }
        else if (lastDarts.Count >= GameStateX01.DartsPerTurn)
        {
            throwIsOver = true;
        }
    }
    
    private void HandleBust(GameStateX01 gameState, List<DartPosition> lastDarts)
    {
        gameState.bust = true;
        int points = gameState.points[gameState.currentPlayer];
        foreach (var dartPosition in lastDarts)
        {
            if (dartPosition.tripleField)
            {
                points += dartPosition.points * 3;
            }
            else if (dartPosition.doubleField)
            {
                points += dartPosition.points * 2;
            }
            else
            {
                points += dartPosition.points;
            }
        }
        gameState.points[gameState.currentPlayer] = points;
        throwIsOver = true;
    }
    
    public GameState GetGameState()
    {
        return _gameState;
    }
}