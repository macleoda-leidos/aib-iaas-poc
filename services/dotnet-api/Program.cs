using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
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

// Database initialisation, and who is allowed to do it.
//
// On PostgreSQL this service creates NOTHING and seeds NOTHING. The Node package
// @aib-iaas/database owns that schema (packages/database/src/pg-schema.ts) and its
// 16 tables are a superset of the 9 mapped here. EnsureCreated() only acts when a
// database has no tables at all, so whichever service reached an empty database
// first used to decide the schema for good — and if this one won, it created its
// subset WITHOUT columns Node requires (applications.system_checks,
// applications.credit_check, recommendations.reasoning/factors/alternatives — all
// NOT NULL on Node's side — audit_events.actor_id, users.password_hash, and most of
// organisations). Node's CREATE TABLE IF NOT EXISTS would then skip those tables
// and never add the missing columns, so Node would write to columns that did not
// exist. Nothing would have failed loudly; the data would simply have been wrong.
//
// Seeding is skipped for the same reason. Node's dataset is canonical (10 roles, 20
// permissions, 10 organisations, 10 users, 100+ applications across every product
// and status). SeedData here defines only 5 roles and uses DIFFERENT ids
// ('role-system_admin' where Node has 'role-sysadmin'), so running both would leave
// two disjoint role sets and users pointing at neither.
//
// SQLite is the opposite case: nothing else touches that file, so this service is
// the only thing that can create and seed it, and must.
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IaasDbContext>();

    if (usingPostgres)
    {
        // Read-only check, so this service reports a missing schema instead of
        // creating a partial one. HasTablesAsync is EF's own API for "does this
        // database have anything in it" — preferred over raw SQL here because
        // SqlQuery<T> with a scalar type requires the column to be aliased "Value",
        // which is easy to get wrong and would only fail against PostgreSQL.
        // Fully qualified: Microsoft.Extensions.DependencyInjection also defines a
        // GetService extension, and it shadows EF's when both namespaces are in scope.
        var creator = Microsoft.EntityFrameworkCore.Infrastructure.AccessorExtensions
            .GetService<IRelationalDatabaseCreator>(db.Database);
        var schemaExists = await creator.HasTablesAsync();

        Console.WriteLine(schemaExists
            ? "[IAAS.Api] Database ready (PostgreSQL, schema owned by @aib-iaas/database)"
            : "[IAAS.Api] PostgreSQL has no IAAS schema yet — start the Node API once to create it. Requests will fail until then.");
    }
    else
    {
        db.Database.EnsureCreated();
        await SeedData.Initialize(db);
        Console.WriteLine("[IAAS.Api] Database ready (SQLite, schema owned by this service)");
    }
}
catch (Exception ex)
{
    // Guarded so /api/health stays reachable and says so, rather than the container
    // exiting before any endpoint is mapped.
    Console.WriteLine($"[IAAS.Api] Database init check failed, continuing so /api/health stays reachable: {ex.Message}");
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
