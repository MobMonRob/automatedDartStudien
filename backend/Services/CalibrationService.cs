using backend.Models;
using Vector2 = backend.Models.Vector2;

namespace backend.Services;

public class CalibrationService(TrackerService trackerService, GameStateConnectionService gameStateConnectionService)
{
    private List<Vector2> _positions = [];
    private GameStateCalibrating _gameState = new GameStateCalibrating();
    
    private int _calibrationIndex;
    
    public bool running { get; set; } = false;
    
    public void StartCalibration(List<Vector2>? positions = null)
    {
        _calibrationIndex = 0;
        _gameState = new GameStateCalibrating();
        if (positions == null || positions.Count != 4)
        {
            _positions = [
                new Vector2(0.199569, 0.59232),
                new Vector2(-0.934412, 0.006765),
                new Vector2(-0.199569, -0.59232),
                new Vector2(0.886588, -0.295183),
            ];
            // default positions as fallback
        }
        else
        {
            _positions = positions;
        }

        _gameState = new GameStateCalibrating
        {
            calibrationState = GameStateCalibrating.CalibrationState.WaitingForEmptyBoard,
            currentPosition = _positions[_calibrationIndex],
            calibrationCount = _positions.Count,
            calibrationIndex = _calibrationIndex,
        };
        
        running = true;

        _ = trackerService.StartCalibration(_positions);
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    public void StopCalibration()
    {
        running = false;
        _ = trackerService.StopCalibration();
    }
    
    public void UpdateCameras(List<CalibrationCamera> cameras)
    {
        _gameState.cameras = cameras;
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    public void HandleEmptyBoard()
    {
        if (_gameState.calibrationState == GameStateCalibrating.CalibrationState.WaitingForEmptyBoard)
        {
            _gameState.calibrationState = GameStateCalibrating.CalibrationState.WaitingForUserConfirmation;
        }
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    public void HandleUserConfirmation()
    {
        if (_gameState.calibrationState == GameStateCalibrating.CalibrationState.WaitingForUserConfirmation)
        {
            _gameState.calibrationState = GameStateCalibrating.CalibrationState.WaitingForDart;
            _ = trackerService.NextCalibrationPoint();
        }
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    public void HandleDonePosition()
    {
        if (_gameState.calibrationState == GameStateCalibrating.CalibrationState.WaitingForDart)
        {
            _gameState.calibrationState = GameStateCalibrating.CalibrationState.WaitingForEmptyBoard;
            _calibrationIndex++;
            if (_calibrationIndex < _positions.Count)
            {
                _gameState.currentPosition = _positions[_calibrationIndex];
                _gameState.calibrationIndex = _calibrationIndex;
            }
        }
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    public void HandleFinishedCalibration()
    {
        running = false;
        _gameState.calibrationState = GameStateCalibrating.CalibrationState.Finished;
        gameStateConnectionService.sendGamestateToClients(_gameState);
    }
    
    
}