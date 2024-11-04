using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly MongoDbService _mongoDbService;
    
    public PlayersController(MongoDbService mongoDbService)
    {
        _mongoDbService = mongoDbService;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Player>>> GetPlayers()
    {
        return await _mongoDbService.GetPlayers();
    }
}