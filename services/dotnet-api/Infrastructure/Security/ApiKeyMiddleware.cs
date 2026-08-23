namespace IAAS.Api.Infrastructure.Security;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip auth for public endpoints
        var path = context.Request.Path.Value ?? "";
        if (path == "/" || path.StartsWith("/health") || path.StartsWith("/swagger") || path == "/api/smoke-test")
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
