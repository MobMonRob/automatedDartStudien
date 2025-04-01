using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class DbThrow(string? id, string? playerId, string? gameId, DateTime? time, List<ThrowElement> throws)
{
    public DbThrow() : this(null, null, null, null, new List<ThrowElement>())
    { }
    [BsonId]
    [BsonElement("_id"), BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; } = id;

    [BsonElement("playerId"), BsonRepresentation(BsonType.ObjectId)]
    public string? playerId { get; set; } = playerId;
    
    [BsonElement("gameId"), BsonRepresentation(BsonType.ObjectId)]
    public string? gameId { get; set; } = gameId;
    
    [BsonElement("time"), BsonRepresentation(BsonType.DateTime)]
    public DateTime? time { get; set; } = time;
    
    public List<ThrowElement> throws { get; set; } = throws;
    
    public List<List<DartPosition>> correctedThrows { get; set; } = [];
}

public class ThrowElement
{
    public int points { get; set; }
    public Vector2? position { get; set; }
    public bool doubleField { get; set; }
    public bool tripleField { get; set; }
}