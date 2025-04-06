using backend.Controllers;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddSingleton<DartPositionService>();
builder.Services.AddSingleton<GameStateService>();
builder.Services.AddSingleton<GameStateConnectionService>();
builder.Services.AddSingleton<PlayersController>();
builder.Services.AddSingleton<CalibrationService>();
builder.Services.AddSingleton<TrackerService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();
app.MapControllers();
app.UseWebSockets();

app.MapGet("/gamestate", async (HttpContext context, GameStateConnectionService gsService) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        await gsService.HandleWebSocketConnection(webSocket);
    }
    else
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Expected a WebSocket request");
    }
});

app.Run();
