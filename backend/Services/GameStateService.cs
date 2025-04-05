using backend.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

namespace backend.Services;

public class GameStateService(
    GameStateConnectionService gameStateConnectionService, 
    MongoDbService mongoDbService,
    CalibrationService calibrationService,
    GameState gameState)
{
    private GameState _gameState = gameState;
    private readonly IMongoCollection<DbThrow> _throwCollection = mongoDbService.Database.GetCollection<DbThrow>("throws");
    private readonly IMongoCollection<DbTestThrows> _testCollection = mongoDbService.Database.GetCollection<DbTestThrows>("test_throws");
    
    private bool gameIsRunning = false;
    private bool throwIsOver = false;
    private List<bool> hasThrownDouble = [];
    
    List<DartPosition> undoneDarts = [];
    
    List<CorrectedPosition> correctedDarts = [];
    
    private const int REQUIRED_EMPTY_BOARD_FRAMES = 5;
    private int emptyBoardFrames = 0;

    public GameStateService(
        GameStateConnectionService gameStateConnectionService, 
        MongoDbService mongoDbService,
        CalibrationService calibrationService) 
        : this(
        gameStateConnectionService, 
        mongoDbService, 
        calibrationService,
        new GameStateX01()) {}

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
        gameIsRunning = true;
        gameStateConnectionService.sendGamestateToClients(_gameState);
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
            case GameStateTesting gameStateTesting:
                HandleTestModeThrow(gameStateTesting, dartPosition);
                break;
        }
        
        await gameStateConnectionService.sendGamestateToClients(_gameState);
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
        if (!throwIsOver || !gameIsRunning || emptyBoardFrames < REQUIRED_EMPTY_BOARD_FRAMES) return;

        var dartPositions = _gameState.lastDarts[_gameState.currentPlayer];
        List<CorrectedPosition> throwElements = [];

        if (_gameState is GameStateTesting)
        {
            var dbTestThrow = new DbTestThrows
            {
                id = null,
                time = DateTime.Now,
                throws = dartPositions,
                correctedThrows = correctedDarts
            };
            _testCollection.InsertOne(dbTestThrow);
        }
        else
        {
            var dbThrow = new DbThrow
            {
                playerId = _gameState.players[_gameState.currentPlayer].id,
                time = DateTime.Now,
                throws = dartPositions,
                correctedThrows = correctedDarts
            };
            _throwCollection.InsertOne(dbThrow);
            
            hasThrownDouble[_gameState.currentPlayer] = false;
        }
        
        undoneDarts.Clear();
        correctedDarts.Clear();
        correctedDarts.Clear();
        
        throwIsOver = false;
        _gameState.MoveToNextPlayer();
        _gameState.bust = false;
        
        gameStateConnectionService.sendGamestateToClients(_gameState);
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
        average = (average * (dartsThrown - 1) + dartPosition.getPositionValue()) / dartsThrown;
        
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
            throwIsOver = true;
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

    public async Task ReplaceDart(int index, DartPosition position, int? reason = null)
    {
        var currentThrow = _gameState.lastDarts[_gameState.currentPlayer];
        DartPosition? replacedPosition = null;
        if (index >= currentThrow.Count)
        {
            if(index >= GameStateTesting.DartsPerTurn) return;
            currentThrow.Add(position);
            if(index == GameStateTesting.DartsPerTurn - 1)
            {
                throwIsOver = true;
            }
        }
        else
        {
            replacedPosition = currentThrow[index];
            currentThrow[index] = position;
        }
        
        correctedDarts.Add(new CorrectedPosition()
        {
            index = index,
            position = replacedPosition,
            reason = reason
        });
        
        if(_gameState is not GameStateTesting)
        {
            if (replacedPosition != null)
            {
                _gameState.points[_gameState.currentPlayer] += replacedPosition.getPositionValue();
            }else
            {
                _gameState.dartsThrown[_gameState.currentPlayer]++;
            }
            _gameState.points[_gameState.currentPlayer] -= position.getPositionValue();
            _gameState.averages[_gameState.currentPlayer] = (_gameState.averages[_gameState.currentPlayer] * (_gameState.dartsThrown[_gameState.currentPlayer] - 1) + position.getPositionValue()) / _gameState.dartsThrown[_gameState.currentPlayer];
        }
        
        _gameState.lastDarts[_gameState.currentPlayer] = currentThrow;
        
        await gameStateConnectionService.sendGamestateToClients(_gameState);
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

