using backend.Models;
using MongoDB.Driver;

namespace backend.Services;

public class MongoDbService
{
    public MongoDbService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoConnection");
        var mongoUrl = MongoUrl.Create(connectionString);
        var client = new MongoClient(mongoUrl);
        Database = client.GetDatabase(configuration["MongoDatabase"]);
    }
    
    public IMongoDatabase Database { get; }
}