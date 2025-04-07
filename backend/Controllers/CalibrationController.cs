using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/calibration")]
public class CalibrationController(CalibrationService calibrationService): ControllerBase
{
    [HttpPost("start")]
    public Task StartCalibration([FromBody] List<Vector2>? actualPositions)
    {
        calibrationService.StartCalibration(positions: actualPositions);
        return Task.CompletedTask;
    }
    
    [HttpPost("stop")]
    public Task StopCalibration()
    {
        calibrationService.StopCalibration();
        return Task.CompletedTask;
    }
    
    [HttpPost("confirm")]
    public Task ConfirmCalibration()
    {
        calibrationService.HandleUserConfirmation();
        return Task.CompletedTask;
    }
    
    [HttpPatch("tracker/cameras")]
    public Task UpdateTrackerCameras([FromBody] List<CalibrationCamera> cameras)
    {
        calibrationService.UpdateCameras(cameras);
        return Task.CompletedTask;
    }
    
    [HttpPost("tracker/board_empty")]
    public Task BoardEmpty()
    {
        calibrationService.HandleEmptyBoard();
        return Task.CompletedTask;
    }
    
    [HttpPost("tracker/position_done")]
    public Task RoundDone()
    {
        calibrationService.HandleDonePosition();
        return Task.CompletedTask;
    }
    
    [HttpPost("tracker/finished")]
    public Task Finished()
    {
        calibrationService.HandleFinishedCalibration();
        return Task.CompletedTask;
    }
}