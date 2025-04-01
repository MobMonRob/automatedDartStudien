using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using backend.Models;

namespace backend.Services;

public class GameStateConnectionService
{
    private readonly List<WebSocket> _sockets = [];
    private GameState recentGameState;

    private async Task SendToAllClients(byte[] buffer)
    {
        foreach (var s in _sockets)
        {
            if (s.State == WebSocketState.Open)
            {
                await s.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
    }
    
    private async Task HandleIncomingData(byte[] buffer)
    {
        var jsonString = Encoding.UTF8.GetString(buffer);
        Console.WriteLine(jsonString);
    }
    
    public async Task HandleWebSocketConnection(WebSocket socket)
    {
        Console.WriteLine("New connection");
        _sockets.Add(socket);
        
        var jsonString = JsonSerializer.Serialize(recentGameState);
        var gsBuffer = Encoding.UTF8.GetBytes(jsonString);
        await socket.SendAsync(gsBuffer, WebSocketMessageType.Text, true, CancellationToken.None);
        
        var buffer = new byte[1024 * 2];
        while (socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                if (result.CloseStatus != null)
                    await socket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription,
                        CancellationToken.None);
                break;
            }
            
            await HandleIncomingData(buffer);
        }
        _sockets.Remove(socket);
    }

    public async Task sendGamestateToClients(GameState gameState)
    {
        recentGameState = gameState;
        var jsonString = JsonSerializer.Serialize(gameState);
        var buffer = Encoding.UTF8.GetBytes(jsonString);
        Console.WriteLine(jsonString);
        await SendToAllClients(buffer);
    }
}