using backend.Models;

namespace backend.Services;

public class GameStateService(GameStateConnectionService gameStateConnectionService, GameState gameState)
{
    private GameState _gameState = gameState;
    private readonly GameStateConnectionService _gameStateConnectionService = gameStateConnectionService;
    private bool gameIsRunning = false;
    private bool throwIsOver = false;
    private List<bool> hasThrownDouble = [];
    
    private const int REQUIRED_EMPTY_BOARD_FRAMES = 5;
    private int emptyBoardFrames = 0;

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
                players.ForEach(_ => hasThrownDouble.Add(false));
                break;
            case GameMode.Cricket:
                _gameState = new GameStateCricket();
                players.ForEach(player => _gameState.AddPlayer(player));
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(gameMode), gameMode, null);
        }
        gameIsRunning = true;
        _gameStateConnectionService.sendGamestateToClients(_gameState);
    }

    public async Task HandleDartPosition(DartPosition dartPosition)
    {
        Console.WriteLine("Received dart position: " + dartPosition);
                
        if (!gameIsRunning) return;

        switch (_gameState)
        {
            case GameStateX01 gameStateX01:
                HandleGameLogicX01(gameStateX01, dartPosition);
                break;
            case GameStateCricket gameStateCricket:
                throw new NotImplementedException();
                break;
        }
        
        await _gameStateConnectionService.sendGamestateToClients(_gameState);
    }

    public void HandleEmptyBoard()
    {
        emptyBoardFrames++;
        if (!throwIsOver || !gameIsRunning || emptyBoardFrames < REQUIRED_EMPTY_BOARD_FRAMES) return;

        throwIsOver = false;
        hasThrownDouble[_gameState.currentPlayer] = false;
        _gameState.MoveToNextPlayer();
        _gameState.bust = false;
        
        _gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    private void HandleGameLogicX01(GameStateX01 gameState, DartPosition dartPosition)
    {
        emptyBoardFrames = 0;
        if(throwIsOver) return;
        
        int points = gameState.points[gameState.currentPlayer];
        int dartsThrown = gameState.dartsThrown[gameState.currentPlayer];
        List<DartPosition> lastDarts = gameState.lastDarts[gameState.currentPlayer];
        double average = gameState.averages[gameState.currentPlayer];
        
        points -= dartPosition.getPositionValue();
        
        if(gameState.inVariant == "Double In" && !hasThrownDouble[gameState.currentPlayer])
        {
            points = 0;
        }
        
        dartsThrown++;
        lastDarts.Add(dartPosition);
        average = (average * (dartsThrown - 1) + dartPosition.points) / dartsThrown;
        
        gameState.points[gameState.currentPlayer] = points;
        gameState.dartsThrown[gameState.currentPlayer] = dartsThrown;
        gameState.lastDarts[gameState.currentPlayer] = lastDarts;
        gameState.averages[gameState.currentPlayer] = average;
        
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
            points += dartPosition.getPositionValue();
        }
        gameState.points[gameState.currentPlayer] = points;
        throwIsOver = true;
    }
    
    public GameState GetGameState()
    {
        return _gameState;
    }
    
    public async Task SubmitDart(DartPosition dartPosition)
    {
        if (!gameIsRunning) return;
        await HandleDartPosition(dartPosition);
    }

    public async Task UndoLastDart()
    {
        if (!gameIsRunning) return;
        
        var currentThrow = _gameState.lastDarts[_gameState.currentPlayer];
        if (currentThrow.Count == 0)
        {
            _gameState.MoveToPreviousPlayer();
            currentThrow = _gameState.lastDarts[_gameState.currentPlayer];
        }
        if(currentThrow.Count == 0) return;
        _gameState.points[_gameState.currentPlayer] += currentThrow.Last().getPositionValue();
        _gameState.dartsThrown[_gameState.currentPlayer]--;
        _gameState.averages[_gameState.currentPlayer] = _gameState.averages[_gameState.currentPlayer] * _gameState.dartsThrown[_gameState.currentPlayer] / (_gameState.dartsThrown[_gameState.currentPlayer] + 1);
        currentThrow.RemoveAt(currentThrow.Count - 1);
        
        throwIsOver = false;
        _gameState.lastDarts[_gameState.currentPlayer] = currentThrow;
        await _gameStateConnectionService.sendGamestateToClients(_gameState);
    }
}