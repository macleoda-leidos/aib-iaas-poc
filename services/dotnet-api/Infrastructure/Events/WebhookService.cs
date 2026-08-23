namespace IAAS.Api.Infrastructure.Events;

public interface IWebhookService
{
    Task FireAsync(string eventType, object payload);
}

public class WebhookService : IWebhookService
{
    private readonly ILogger<WebhookService> _logger;
    private readonly HttpClient _httpClient;

    // Registered webhook URLs (in production: from database)
    private static readonly Dictionary<string, List<string>> RegisteredWebhooks = new()
    {
        ["application.submitted"] = new() { "https://example.com/webhook/iaas" },
        ["application.approved"] = new() { "https://example.com/webhook/iaas" },
        ["application.rejected"] = new() { "https://example.com/webhook/iaas" },
    };

    public WebhookService(ILogger<WebhookService> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("webhooks");
    }

    public async Task FireAsync(string eventType, object payload)
    {
        if (!RegisteredWebhooks.TryGetValue(eventType, out var urls)) return;

        foreach (var url in urls)
        {
            try
            {
                _logger.LogInformation("Firing webhook {Event} to {Url}", eventType, url);
                // In production: actual HTTP POST with signature verification
                // await _httpClient.PostAsJsonAsync(url, new { eventType, payload, timestamp = DateTime.UtcNow });
                _logger.LogInformation("Webhook delivered successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Webhook delivery failed for {Url}", url);
            }
        }
    }
}
