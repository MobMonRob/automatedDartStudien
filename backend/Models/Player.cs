using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class Player
{
    [BsonId]
    [BsonElement("_id"), BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; }
    
    [BsonElement("name"), BsonRepresentation(BsonType.String)]
    public string? name { get; set; }
}