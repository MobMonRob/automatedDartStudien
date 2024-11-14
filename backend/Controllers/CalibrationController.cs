using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("/api/calibration")]
public class CalibrationController(DartPositionService dartPositionService)
{
    [HttpPost]
    public void StartCalibration()
    {
        dartPositionService.CalibrateCameras();
    }
}