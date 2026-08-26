using Microsoft.EntityFrameworkCore;
using IAAS.Api.Data;
using IAAS.Api.Features.Applications;
using IAAS.Api.Features.Auth;
using IAAS.Api.Features.Audit;
using IAAS.Api.Features.Organisations;
using IAAS.Api.Features.Recommendations;
using IAAS.Api.Features.Users;
using IAAS.Api.Features.Integrations;
using IAAS.Api.Features.Documents;
using IAAS.Api.Features.Payments;
using IAAS.Api.Features.CreditCheck;
using IAAS.Api.Features.Notifications;

var builder = WebApplication.CreateBuilder(args);

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Database — PostgreSQL when DATABASE_URL or Host= connection string is present, otherwise SQLite
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// Convert postgresql:// URI to ADO.NET format for Npgsql
if (connectionString?.StartsWith("postgresql://") == true || connectionString?.StartsWith("postgres://") == true)
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
}

// Decide the store BEFORE registering it, so the DI container is only ever given
// one that works. Registering PostgreSQL and then discovering at first use that it
// is unreachable leaves no way back: the registration is fixed once the container
// is built, so every request would keep failing against it.
//
// This is why the probe exists at all. An unreachable database used to take the
// whole service down — EnsureCreated() threw during startup, nothing caught it, and
// the process exited before the health endpoint was even mapped. On a hosted free
// tier that reads as "the API is down" with no clue why. A demo backend answering
// from SQLite beats one that will not start.
var usingPostgres = false;

if (connectionString?.Contains("Host=") == true)
{
    // Short timeout: this runs on the startup path, and a hung connection attempt
    // would trade a crash for an equally useless boot that never completes.
    var probe = new Npgsql.NpgsqlConnectionStringBuilder(connectionString) { Timeout = 10 }.ToString();
    try
    {
        using var connection = new Npgsql.NpgsqlConnection(probe);
        connection.Open();
        usingPostgres = true;
        connectionString = probe;
    }
    catch (Exception ex)
    {
        // Logged rather than swallowed: silently serving different data from a
        // different store would be worse than either failure mode.
        Console.WriteLine($"[IAAS.Api] PostgreSQL unreachable, using SQLite instead: {ex.Message}");
    }
}

if (usingPostgres)
{
    builder.Services.AddDbContext<IaasDbContext>(options => options.UseNpgsql(connectionString));
}
else
{
    builder.Services.AddDbContext<IaasDbContext>(options => options.UseSqlite("Data Source=iaas.db"));
}

// CORS
//
// WithExposedHeaders matters for the same reason it did on the Node service:
// browsers withhold every response header from script bar seven safelisted ones,
// so without naming these the frontend reads null for each and cannot show real
// API usage. That is exactly what produced a "Rate limited — 0 / 0" banner against
// a healthy API.
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("https://macleoda-leidos.github.io", "http://localhost:3000")
          .AllowAnyHeader().AllowAnyMethod().AllowCredentials()
          .WithExposedHeaders("RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "RateLimit-Policy")));

var app = builder.Build();

// Ensure DB created + seed. The store was probed above, so this is expected to
// succeed; it is still guarded because schema creation can fail for reasons the
// connection probe cannot see (permissions on a managed instance, a read-only
// volume). Serving stale-but-present data beats refusing to start.
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IaasDbContext>();
    db.Database.EnsureCreated();
    await SeedData.Initialize(db);
    Console.WriteLine($"[IAAS.Api] Database ready ({(usingPostgres ? "PostgreSQL" : "SQLite")})");
}
catch (Exception ex)
{
    Console.WriteLine($"[IAAS.Api] Database init failed, continuing so /api/health stays reachable: {ex.Message}");
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
app.MapDocumentEndpoints();
app.MapPaymentEndpoints();
app.MapCreditCheckEndpoints();
app.MapNotificationEndpoints();

app.Run();
