using backend.Models;

namespace backend.Services;

public class DartPositionService(GameStateConnectionService gameStateConnectionService)
{
    private GameState gameState = new GameStateX01();

    public void HandleTrackingData(TrackingData data)
    {
        Console.WriteLine("Handling tracking data:  " + data);
        
        gameStateConnectionService.sendGamestateToClients(gameState);

        // Calculate the new GameState
    }
}