using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/tracking-data")]
public class TrackingDataController(DartPositionService dartPositionService)
{
    [HttpPost]
    public async Task PostTrackingData(TrackingData trackingData)
    {
        await dartPositionService.HandleTrackingData(trackingData);
    }
}