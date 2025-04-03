using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/game")]
public class GameController(GameStateService gameStateService, PlayersController playersController)
{
    [HttpPost("start-game")]
    public async Task StartGame([FromBody] StartGameRequest startGameRequest)
    {
        GameMode gameMode = (GameMode)startGameRequest.gameMode;
        List<string> playerIds = startGameRequest.playerIds;
        List<Player> players = [];
        foreach(var playerId in playerIds)
        {
            players.Add(await playersController.GetPlayer(playerId));
        }
        //List<Player> players = [new Player("id1", "Player 1"), new Player("id2", "Player 2")];
        int? x01InitialPoints = startGameRequest.x01InitialPoints;
        gameStateService.StartGame(gameMode, players, x01InitialPoints);
    }
    
    [HttpPost("miss")]
    public async Task Miss()
    {
        await gameStateService.SubmitDart(new DartPosition(0, false, false));
    }
    
    [HttpPost("submit-dart")]
    public async Task SubmitDart([FromBody] DartPosition dartPosition)
    {
        await gameStateService.SubmitDart(dartPosition);
    }
    
    [HttpPost("undo-dart")]
    public async Task UndoDart()
    {
        await gameStateService.UndoLastDart();
    }
    
        
    [HttpPost("replace-dart")]
    public async Task ReplaceDart([FromBody] ReplaceDartRequest replaceDartRequest)
    {
        await gameStateService.ReplaceDart(replaceDartRequest.replace_index, replaceDartRequest.replace_with, replaceDartRequest.reason);
    }
    
    public class StartGameRequest
    {
        public int gameMode { get; set; }
        public List<string> playerIds { get; set; }
        public int? x01InitialPoints { get; set; }
    }
    
    public class ReplaceDartRequest
    {
        public int replace_index { get; set; }
        public DartPosition replace_with { get; set; }
        
        public int? reason { get; set; }
    }
}