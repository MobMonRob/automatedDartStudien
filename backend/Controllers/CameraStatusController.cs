using backend.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/camera-status")]
public class CameraStatusController(GameStateService _gameStateService)
{
    [HttpPost()]
    public async Task postCameraData(List<bool> data)
    {
        await _gameStateService.HandleCameraStatusUpdate(data);
    }
}