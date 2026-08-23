using MediatR;

namespace IAAS.Api.Infrastructure.Events;

// Domain events fired when case status changes
public record ApplicationSubmittedEvent(string ApplicationId, string ReferenceNumber, DateTime SubmittedAt) : INotification;
public record ApplicationApprovedEvent(string ApplicationId, string ReferenceNumber, string ApprovedBy) : INotification;
public record ApplicationRejectedEvent(string ApplicationId, string ReferenceNumber, string RejectedBy, string Reason) : INotification;
public record CreditCheckCompletedEvent(string ApplicationId, int Score, string Result) : INotification;
public record DocumentUploadedEvent(string ApplicationId, string DocumentId, string Filename) : INotification;

// Handlers that react to domain events
public class ApplicationSubmittedHandler : INotificationHandler<ApplicationSubmittedEvent>
{
    private readonly ILogger<ApplicationSubmittedHandler> _logger;
    public ApplicationSubmittedHandler(ILogger<ApplicationSubmittedHandler> logger) => _logger = logger;

    public Task Handle(ApplicationSubmittedEvent notification, CancellationToken ct)
    {
        _logger.LogInformation("Application {Ref} submitted at {Time}", notification.ReferenceNumber, notification.SubmittedAt);
        // In production: send email via GOV.UK Notify, create audit event, update dashboards
        return Task.CompletedTask;
    }
}

public class ApplicationApprovedHandler : INotificationHandler<ApplicationApprovedEvent>
{
    private readonly ILogger<ApplicationApprovedHandler> _logger;
    public ApplicationApprovedHandler(ILogger<ApplicationApprovedHandler> logger) => _logger = logger;

    public Task Handle(ApplicationApprovedEvent notification, CancellationToken ct)
    {
        _logger.LogInformation("Application {Ref} approved by {Officer}", notification.ReferenceNumber, notification.ApprovedBy);
        // In production: send decision notification, update creditor portal, fire webhook
        return Task.CompletedTask;
    }
}
