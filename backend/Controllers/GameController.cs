using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/game")]
public class GameController(GameStateService gameStateService, PlayersController playersController)
{
    [HttpPost("start-game")]
    public void StartGame(GameMode gameMode, List<string> playerIds, int? xo1InitialPoints = 501)
    {
        List<Player> players = playerIds.Select(id => playersController.GetPlayer(id).Result).ToList();
        gameStateService.StartGame(gameMode, players, xo1InitialPoints);
    }
}