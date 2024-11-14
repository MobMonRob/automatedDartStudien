using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class PlayersController(MongoDbService mongoDbService) : ControllerBase
{
    private readonly IMongoCollection<Player> _playerCollection = mongoDbService.Database.GetCollection<Player>("players");

    [HttpGet]
    public async Task<IEnumerable<Player>> GetPlayers()
    {
        return await _playerCollection.Find(FilterDefinition<Player>.Empty).ToListAsync();
    }
    
    [HttpGet("{id}")]
    public async Task<Player> GetPlayer(string id)
    {
        return await _playerCollection.Find(player => player.id == id).FirstOrDefaultAsync();
    }
    
    [HttpPost]
    public async Task<Player> CreatePlayer(Player player)
    {
        await _playerCollection.InsertOneAsync(player);
        return player;
    }
    
    [HttpDelete("{id}")]
    public async Task DeletePlayer(string id)
    {
        await _playerCollection.DeleteOneAsync(player => player.id == id);
    }
}