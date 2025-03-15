using backend.Models;

namespace backend.Services;

public class DartPositionService(GameStateService gameStateService)
{
    private List<Vector2> positions = [];

    public async Task HandleTrackingData(TrackingData data)
    {
        Console.WriteLine("Handling tracking data: " + data);

        var distinctPositions = data.GetNewPositions(positions);
        positions = data.positions;
        
        if (data.positions.Count == 0)
        {
            gameStateService.HandleEmptyBoard();
            return;
        }

        if (distinctPositions.Count == 0) return;
        
        foreach (var position in distinctPositions)
        {
            DartPosition dartPosition = GetDartPosition(position);
            dartPosition.position = position;
            await gameStateService.HandleDartPosition(dartPosition);
        }
    }
    
    private DartPosition GetDartPosition(Vector2 position)
    {
        var distance = Math.Sqrt(position.x * position.x + position.y * position.y);
        
        // Dart is outside the board
        if (distance > 1) return new DartPosition(0, false, false);

        if (distance < 31.8 * 0.5 / 170f)
        {
            // Bulls eye
            return new DartPosition(25, distance < 12.7 * 0.5 / 170f, false);
        }
        
        bool doubleField = (distance > 162f / 170f);
        bool tripleField = distance is > 99f / 170f and < 107f / 170f;

        double angleRad = Math.Atan2(position.y, position.x);
        double sector = Math.Floor((angleRad) / (Math.PI / 10));
        byte points = GetPointsForSector(sector);
        
        return new DartPosition(
            points: points,
            doubleField: doubleField,
            tripleField: tripleField
        );
    }
    
    private byte GetPointsForSector(double sector)
    {
        switch (sector)
        {
            case -10: return 8;
            case -9: return 16;
            case -8: return 7;
            case -7: return 19;
            case -6: return 3;
            case -5: return 17;
            case -4: return 2;
            case -3: return 15;
            case -2: return 10;
            case -1: return 6;
            case 0: return 13;
            case 1: return 4;
            case 2: return 18;
            case 3: return 1;
            case 4: return 20;
            case 5: return 5;
            case 6: return 12;
            case 7: return 9;
            case 8: return 14;
            case 9: return 11;
            case 10: return 8;
            default: return 0;
        }
    }
}