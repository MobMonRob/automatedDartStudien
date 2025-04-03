using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class DbThrow(string? id, string? playerId, string? gameId, DateTime? time, List<DartPosition> throws)
{
    public DbThrow() : this(null, null, null, null, new List<DartPosition>())
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
    
    public List<DartPosition> throws { get; set; } = throws;
    
    public List<CorrectedPosition> correctedThrows { get; set; } = [];
}

public class CorrectedPosition
{
    public int index { get; set; }
    public DartPosition? position { get; set; }
    public int? reason { get; set; }
}