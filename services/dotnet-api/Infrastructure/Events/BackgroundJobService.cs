namespace IAAS.Api.Infrastructure.Events;

public interface IBackgroundJobService
{
    void Enqueue(string jobType, object payload);
}

public class BackgroundJobService : IBackgroundJobService
{
    private readonly ILogger<BackgroundJobService> _logger;
    
    public BackgroundJobService(ILogger<BackgroundJobService> logger) => _logger = logger;

    public void Enqueue(string jobType, object payload)
    {
        _logger.LogInformation("Job queued: {JobType}", jobType);
        // In production: use Hangfire or Azure Service Bus
        // BackgroundJob.Enqueue(() => ProcessJob(jobType, payload));
        
        // For POC: process immediately (synchronous)
        Task.Run(() => ProcessJobAsync(jobType, payload));
    }

    private async Task ProcessJobAsync(string jobType, object payload)
    {
        await Task.Delay(100); // Simulate async processing
        _logger.LogInformation("Job completed: {JobType}", jobType);
    }
}
