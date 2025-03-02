using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/game")]
public class GameController(GameStateService gameStateService)//, PlayersController playersController)
{
    [HttpPost("start-game")]
    public void StartGame([FromBody] StartGameRequest startGameRequest)
    {
        GameMode gameMode = startGameRequest.gameMode == "X01" ? GameMode.X01 : GameMode.Cricket;
        //List<Player> players = playerIds.Select(id => playersController.GetPlayer(id).Result).ToList();
        List<string> playerIds = startGameRequest.playerIds;
        List<Player> players = [new Player("id1", "Player 1"), new Player("id2", "Player 2")];
        int? x01InitialPoints = startGameRequest.x01InitialPoints;
        gameStateService.StartGame(gameMode, players, x01InitialPoints);
    }
    
    public class StartGameRequest
    {
        public String gameMode { get; set; }
        public List<string> playerIds { get; set; }
        public int? x01InitialPoints { get; set; }
    }
}