namespace IAAS.Api.Infrastructure.Security;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip auth for public endpoints.
        //
        // NOTE: this middleware is not currently registered in Program.cs. The prefix
        // was "/health", but every endpoint in this service is mounted under "/api/" —
        // so registering it as written would have returned 401 to Render's health check
        // at /api/health and failed the deploy. Corrected here rather than left as a
        // trap for whoever wires it up. Readiness is included for the same reason: an
        // external prober cannot present an API key.
        var path = context.Request.Path.Value ?? "";
        if (path == "/" || path.StartsWith("/api/health") || path.StartsWith("/swagger") || path == "/api/smoke-test")
        {
            await _next(context);
            return;
        }

        // Check for API key (service-to-service)
        if (context.Request.Headers.TryGetValue(ApiKeyHeader, out var apiKey))
        {
            var validKeys = new[] { "iaas-basys-integration-key", "iaas-eden-sync-key", "iaas-reporting-key" };
            if (validKeys.Contains(apiKey.ToString()))
            {
                context.Items["AuthMethod"] = "ApiKey";
                await _next(context);
                return;
            }
        }

        // Fall through to JWT/Bearer auth (handled elsewhere) or allow for POC
        await _next(context);
    }
}
