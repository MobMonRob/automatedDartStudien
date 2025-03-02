using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class Player(string? id, string? name)
{
    public Player() : this(null, null)
    { }
    
    [BsonId]
    [BsonElement("_id"), BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; } = id;

    [BsonElement("name"), BsonRepresentation(BsonType.String)]
    public string? name { get; set; } = name;
}