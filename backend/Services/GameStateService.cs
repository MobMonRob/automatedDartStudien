using backend.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

namespace backend.Services;

public class GameStateService(
    GameStateConnectionService gameStateConnectionService, 
    MongoDbService mongoDbService,
    CalibrationService calibrationService)
{
    private GameState _gameState = new GameStateX01();
    private readonly IMongoCollection<DbThrow> _throwCollection = mongoDbService.Database.GetCollection<DbThrow>("throws");
    private readonly IMongoCollection<DbTestThrows> _testCollection = mongoDbService.Database.GetCollection<DbTestThrows>("test_throws");
    
    private bool gameIsRunning = false;
    private bool throwIsOver = false;
    private List<bool> hasThrownDouble = [];
    
    List<DartPosition> undoneDarts = [];
    
    List<CorrectedPosition> correctedDarts = [];
    
    private const int REQUIRED_EMPTY_BOARD_FRAMES = 5;
    private int emptyBoardFrames = 0;
    
    private const bool PERFORMANCE_MODE = false;
    private const int REQUIRED_INDEX_DATA = 3;

    private List<int> throwsOnIndex = new();
    
    private GameState newGameState = new GameStateX01();

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
            case GameMode.Testing:
                _gameState = new GameStateTesting();
                players.ForEach(player =>  _gameState.AddPlayer(player));
                break;
            case GameMode.Calibrating:
                throw new InvalidOperationException("You cannot start a game of calibration!");
            default:
                throw new ArgumentOutOfRangeException(nameof(gameMode), gameMode, null);
        }
        throwsOnIndex = new List<int>(new int[GameState.DartsPerTurn]);
        gameIsRunning = true;
        newGameState = (GameState) _gameState.DeepCopy();
        gameStateConnectionService.sendGamestateToClients(newGameState);
    }
    
    private void EvaluateGameStateX01(List<DartPosition> darts)
    {
        gameIsRunning = true;
        newGameState.bust = false;
        
        var x01GameState = (GameStateX01) newGameState;

        var currentPlayer = x01GameState.currentPlayer;
        
        x01GameState.lastDarts[currentPlayer] = darts;
        x01GameState.averages[currentPlayer] = _gameState.averages[currentPlayer];
        x01GameState.points[currentPlayer] = _gameState.points[currentPlayer];
        x01GameState.dartsThrown[currentPlayer] = _gameState.dartsThrown[currentPlayer];
        x01GameState.sets[currentPlayer] = _gameState.sets[currentPlayer];
        
        foreach (var position in darts)
        {
            x01GameState.points[currentPlayer] -= position.getPositionValue();
            x01GameState.dartsThrown[currentPlayer]++;
        }
        
        if(x01GameState.inVariant == "Double In" && !hasThrownDouble[currentPlayer])
        {
            x01GameState.points[currentPlayer] = _gameState.points[currentPlayer];
        }

        if (x01GameState.points[currentPlayer] == 0)
        {
            // Win
            if(x01GameState.outVariant == "Double Out" && !x01GameState.lastDarts[currentPlayer].Last().doubleField)
            {
                HandleBust(x01GameState, darts);
            }
            x01GameState.end = DateTime.Now;
            throwIsOver = true;
            gameIsRunning = false;
        }
        else if (x01GameState.points[currentPlayer] < 0 || x01GameState.points[currentPlayer] == 1)
        {
            // Bust
            HandleBust(x01GameState, darts);
        }
        else if (x01GameState.lastDarts[currentPlayer].Count >= GameState.DartsPerTurn)
        {
            // End of turn
            throwIsOver = true;
        }
    }
    

    public async Task HandleDartPosition(DartPosition dartPosition, int? index = null)
    {
        Console.WriteLine("Received dart position: " + dartPosition);

        if (!gameIsRunning) return;

        if (index != null && !PERFORMANCE_MODE)
        {
            int indexValue = index.Value;
            throwsOnIndex[indexValue]++;
            if (throwsOnIndex[indexValue] < REQUIRED_INDEX_DATA)
            {
                return;
            }
        }
        
        if (index != null && (index >= GameState.DartsPerTurn 
                              || index != newGameState.lastDarts[newGameState.currentPlayer].Count)) return;
        
        switch (newGameState)
        {
            case GameStateX01 gameStateX01:
                HandleGameLogicX01(gameStateX01, dartPosition, index);
                break;
            case GameStateCricket gameStateCricket:
                throw new NotImplementedException();
                break;
            case GameStateTesting gameStateTesting:
                HandleTestModeThrow(gameStateTesting, dartPosition);
                break;
        }
        
        await gameStateConnectionService.sendGamestateToClients(newGameState);
    }
    
    public void HandleTestModeThrow(GameStateTesting gameState, DartPosition dartPosition)
    {
        emptyBoardFrames = 0;
        if(throwIsOver) return;
        
        List<DartPosition> lastDarts = gameState.lastDarts[gameState.currentPlayer];
        
        lastDarts.Add(dartPosition);
        
        gameState.lastDarts[gameState.currentPlayer] = lastDarts;
        
        if (lastDarts.Count >= GameStateX01.DartsPerTurn)
        {
            throwIsOver = true;
        }
    }

    public void HandleEmptyBoard()
    {
        emptyBoardFrames++;
        if (!throwIsOver || emptyBoardFrames < REQUIRED_EMPTY_BOARD_FRAMES) return;

        SendThrowsToDb();
        
        throwIsOver = false;
        if(!gameIsRunning) return;
        
        undoneDarts.Clear();
        correctedDarts.Clear();
        correctedDarts.Clear();

        var currentPlayer = newGameState.currentPlayer;
        
        if (newGameState is GameStateX01 x01)
        {
            var setValue = 0;
            foreach (var dartPosition in x01.lastDarts[newGameState.currentPlayer])
            {
                setValue += dartPosition.getPositionValue();
            }
            
            newGameState.averages[currentPlayer] = (newGameState.averages[currentPlayer] * newGameState.sets[currentPlayer] + setValue) / (newGameState.sets[currentPlayer] + 1);
        }
        
        newGameState.sets[currentPlayer]++;
        
        newGameState.MoveToNextPlayer();
        newGameState.bust = false;
        
        _gameState = newGameState.DeepCopy();
        
        throwsOnIndex = new List<int>(new int[GameState.DartsPerTurn]);
        
        gameStateConnectionService.sendGamestateToClients(newGameState);
    }
    
    private void HandleGameLogicX01(GameStateX01 gameState, DartPosition dartPosition, int? index = null)
    {
        emptyBoardFrames = 0;
        if(throwIsOver) return;
        
        if (index != null && (index >= GameState.DartsPerTurn 
                              || index != newGameState.lastDarts[_gameState.currentPlayer].Count)) return;
        
        List<DartPosition> lastDarts = newGameState.lastDarts[gameState.currentPlayer];
        
        if (index != null && index < lastDarts.Count - 1)
        {
            if (index > GameState.DartsPerTurn) return;
            lastDarts[index.Value] = dartPosition;
        }
        else
        {
            lastDarts.Add(dartPosition);
        }
        
        EvaluateGameStateX01(lastDarts);
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
    
    private readonly SemaphoreSlim _replaceDartSemaphore = new SemaphoreSlim(1, 1);

    private readonly Tuple<DartPosition, int?>?[] _dartsToBeReplaced = new Tuple<DartPosition, int?>?[GameState.DartsPerTurn];

    public async Task ReplaceDart(int index, DartPosition position, int? reason = null)
    {
        if (index >= GameState.DartsPerTurn) return;
        _dartsToBeReplaced[index] = new Tuple<DartPosition, int?>(position, reason);
        ReplaceDart(index);
    }
    
    private async Task ReplaceDart(int index)
    {
        // Make sure the method is not called in parallel to prevent race conditions
        await _replaceDartSemaphore.WaitAsync();
        try 
        {
            if(index >= GameState.DartsPerTurn) return;
            for (int i = index; i < _dartsToBeReplaced.Length; i++)
            {
                var currentThrow = newGameState.lastDarts[newGameState.currentPlayer];
                
                // If it's more than the next open index, we can skip it
                if(index > currentThrow.Count) return;
                
                // If the dart is null, we can skip it
                if(_dartsToBeReplaced[index] == null) continue;
                
                var position = _dartsToBeReplaced[index].Item1;
                var reason = _dartsToBeReplaced[index].Item2;
                
                DartPosition? replacedPosition = null;
                
                // If the index is the next open index, we can add the dart
                if (index == currentThrow.Count)
                {
                    currentThrow.Add(position);
                    if(index == GameState.DartsPerTurn - 1)
                    {
                        throwIsOver = true;
                    }
                }
                else
                {
                    replacedPosition = currentThrow[index];

                    // If replacement is the same as the current position, do nothing
                    if (position.getPositionValue() == replacedPosition.getPositionValue() && position.points == replacedPosition.points) return;

                    currentThrow[index] = position;
                }
                
                correctedDarts.Add(new CorrectedPosition()
                {
                    index = index,
                    position = replacedPosition,
                    reason = reason
                });
                
                newGameState.lastDarts[newGameState.currentPlayer] = currentThrow;

                if (newGameState is GameStateX01 gameStateX01)
                {
                    EvaluateGameStateX01(currentThrow);
                }
                
                // Reset the dart to be replaced
                _dartsToBeReplaced[index] = null;
            }

            await gameStateConnectionService.sendGamestateToClients(newGameState);
        }
        finally
        {
            _replaceDartSemaphore.Release();
        }
    }

    public async Task HandleCameraStatusUpdate(List<bool> data)
    {
        var oldData = newGameState.cameraStatus;
        if (oldData.SequenceEqual(data)) return;
        Console.WriteLine("Camera status changed: " + string.Join(", ", data));
        newGameState.cameraStatus = data;
        await gameStateConnectionService.sendGamestateToClients(newGameState);
    }

    private async Task SendThrowsToDb()
    {
        var dartPositions = newGameState.lastDarts[newGameState.currentPlayer];

        if (newGameState is GameStateTesting)
        {
            var dbTestThrow = new DbTestThrows
            {
                id = null,
                time = DateTime.Now,
                throws = dartPositions,
                correctedThrows = correctedDarts
            };
            await _testCollection.InsertOneAsync(dbTestThrow);
        }
        else
        {
            var dbThrow = new DbThrow
            {
                playerId = newGameState.players[newGameState.currentPlayer].id,
                time = DateTime.Now,
                throws = dartPositions,
                correctedThrows = correctedDarts
            };
            await _throwCollection.InsertOneAsync(dbThrow);
            
            hasThrownDouble[newGameState.currentPlayer] = false;
        }
    }

    private class DbTestThrows
    {
        [BsonId]
        [BsonElement("_id"), BsonRepresentation(BsonType.ObjectId)]
        public string? id { get; set; } = null;

        public List<DartPosition> throws { get; set; } = [];
        [BsonElement("time"), BsonRepresentation(BsonType.DateTime)]
        public DateTime time { get; set; }

        public List<CorrectedPosition> correctedThrows { get; set; } = [];
    }
}

