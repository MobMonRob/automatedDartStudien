using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using backend.Models;

namespace backend.Services;

public class GameStateConnectionService
{
    private readonly List<WebSocket> _sockets = [];

    private async Task SendToAllClients(byte[] buffer)
    {
        foreach (var s in _sockets)
        {
            await s.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }
    
    private async Task HandleIncomingData(byte[] buffer)
    {
        var jsonString = Encoding.UTF8.GetString(buffer);
        Console.WriteLine(jsonString);
    }
    
    public async Task HandleWebSocketConnection(WebSocket socket)
    {
        Console.WriteLine("Hallo");
        _sockets.Add(socket);
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
            
            HandleIncomingData(buffer);
            
            // foreach (var s in _sockets)
            // {
            //     await s.SendAsync(buffer[..result.Count], WebSocketMessageType.Text, true, CancellationToken.None);
            // }
        }
        _sockets.Remove(socket);
    }

    public async Task sendGamestateToClients(GameState gameState)
    {
        var jsonString = JsonSerializer.Serialize(gameState);
        var buffer = Encoding.UTF8.GetBytes(jsonString);
        await SendToAllClients(buffer);
    }
    
    
    
}