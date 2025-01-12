using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/tracking-data")]
public class TrackingDataController(DartPositionService dartPositionService)
{
    [HttpPost]
    public void PostTrackingData(TrackingData trackingData)
    {
        dartPositionService.HandleTrackingData(trackingData);
    }
}