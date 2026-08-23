using Microsoft.EntityFrameworkCore;
using IAAS.Api.Data;
using IAAS.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<IaasDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=iaas.db"));

// CORS
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("https://macleoda-leidos.github.io", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

// Ensure database created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IaasDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors();

// Map endpoints
app.MapGet("/", () => new
{
    Service = "AiB IAAS API (.NET 9)",
    Version = "0.1.0",
    Runtime = ".NET 9.0",
    Status = "operational",
    Endpoints = new { Health = "/api/health", Applications = "/api/applications", Auth = "/api/auth/login", Recommend = "/api/recommend" },
    Documentation = "https://macleoda-leidos.github.io/aib-iaas-poc/architecture/"
});

app.MapGet("/api/health", () => new
{
    Status = "healthy",
    Service = "iaas-dotnet-api",
    Version = "0.1.0",
    Runtime = $".NET {Environment.Version}",
    Timestamp = DateTime.UtcNow
});

app.MapApplicationEndpoints();
app.MapAuthEndpoints();
app.MapRecommendEndpoints();

app.Run();
