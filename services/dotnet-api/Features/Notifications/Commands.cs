using MediatR;
namespace IAAS.Api.Features.Notifications;

public record SendNotificationCommand(string Recipient, string Channel, string Template, string? Subject = null) : IRequest<NotificationDto>;
public record NotificationDto(string Id, string Recipient, string Channel, string Status, DateTime SentAt);
public class SendNotificationHandler : IRequestHandler<SendNotificationCommand, NotificationDto>
{
    public Task<NotificationDto> Handle(SendNotificationCommand r, CancellationToken ct) =>
        Task.FromResult(new NotificationDto(Guid.NewGuid().ToString(), r.Recipient, r.Channel, "delivered", DateTime.UtcNow));
}
public static class NotificationEndpointExtensions
{
    public static void MapNotificationEndpoints(this WebApplication app)
    {
        app.MapPost("/api/notifications/send", async (SendNotificationCommand cmd, IMediator mediator) => Results.Ok(new { success = true, data = await mediator.Send(cmd) }));
    }
}
