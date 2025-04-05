using System.Text;
using System.Text.Json;
using backend.Models;

namespace backend.Services;

public class TrackerService
{
    private string _trackerAddress = "192.168.178.69:5000";
    
    public async Task StartCalibration(List<Vector2> actualPositions)
    {
        var client = new HttpClient();
        var url = $"http://{_trackerAddress}/calibrate/start";
        var content = new StringContent(JsonSerializer.Serialize(actualPositions), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to start calibration");
        }
        
        // tracker: ist das board leer? -> an /tracker/board_empty senden und clean frame setzen
        // danach disablen bis /next command
    }
    
    public async Task NextCalibrationPoint()
    {
        var client = new HttpClient();
        var url = $"http://{_trackerAddress}/calibrate/next";
        var response = await client.PostAsync(url, null);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to get next calibration point");
        }
        // tracker: enablen, dart tracken, cameras aktualisieren, bis alles durch halt -> /tracker/position_done senden und auf empty board warten
    }
    
    public async Task StopCalibration()
    {
        var client = new HttpClient();
        var url = $"http://{_trackerAddress}/calibrate/stop";
        var response = await client.PostAsync(url, null);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to stop calibration");
        }
    }
}