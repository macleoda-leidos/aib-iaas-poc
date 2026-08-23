using Microsoft.EntityFrameworkCore;
using IAAS.Api.Data;
using IAAS.Api.Features.Applications;
using IAAS.Api.Features.Auth;
using IAAS.Api.Features.Audit;
using IAAS.Api.Features.Organisations;
using IAAS.Api.Features.Recommendations;
using IAAS.Api.Features.Users;
using IAAS.Api.Features.Integrations;

var builder = WebApplication.CreateBuilder(args);

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Database — SQLite for dev, PostgreSQL for production
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (builder.Environment.IsProduction() && connectionString?.Contains("Host=") == true)
{
    builder.Services.AddDbContext<IaasDbContext>(options => options.UseNpgsql(connectionString));
}
else
{
    builder.Services.AddDbContext<IaasDbContext>(options => options.UseSqlite(connectionString ?? "Data Source=iaas.db"));
}

// CORS
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("https://macleoda-leidos.github.io", "http://localhost:3000")
          .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

// Ensure DB created + seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IaasDbContext>();
    db.Database.EnsureCreated();
    await SeedData.Initialize(db);
}

app.UseCors();

// Root
app.MapGet("/", () => new
{
    Service = "AiB IAAS API (.NET 9)",
    Version = "1.0.0",
    Architecture = "CQS with MediatR",
    Runtime = $".NET {Environment.Version}",
    Database = app.Environment.IsProduction() ? "PostgreSQL" : "SQLite",
    Status = "operational",
    Endpoints = new
    {
        Health = "/api/health",
        Applications = "/api/applications",
        Auth = "/api/auth/login",
        Audit = "/api/audit/events",
        Organisations = "/api/organisations",
        Users = "/api/users",
        Roles = "/api/roles",
        Recommend = "/api/recommend",
        Integrations = "/api/integrations/check-all",
        CreditCheck = "/api/credit-check",
        Payments = "/api/payments",
        Notifications = "/api/notifications",
        SmokeTest = "/api/smoke-test"
    }
});

app.MapGet("/api/health", () => new { Status = "healthy", Service = "iaas-dotnet-api", Version = "1.0.0", Architecture = "CQS + MediatR", Runtime = $".NET {Environment.Version}", Timestamp = DateTime.UtcNow });
app.MapGet("/api/smoke-test", (IaasDbContext db) => new { Success = true, Database = "connected", Counts = new { Applications = db.Applications.Count(), Users = db.Users.Count(), Organisations = db.Organisations.Count(), Roles = db.Roles.Count(), AuditEvents = db.AuditEvents.Count() } });

// Feature endpoints (CQS)
app.MapApplicationEndpoints();
app.MapAuthEndpoints();
app.MapAuditEndpoints();
app.MapOrganisationEndpoints();
app.MapUserEndpoints();
app.MapRecommendEndpoints();
app.MapIntegrationEndpoints();

app.Run();
