using MediatR;
namespace IAAS.Api.Features.Payments;

public record InitiatePaymentCommand(string ApplicationId, decimal Amount) : IRequest<PaymentDto>;
public record PaymentDto(string Id, string ApplicationId, decimal Amount, string Status, string Currency, DateTime CreatedAt);
public class InitiatePaymentHandler : IRequestHandler<InitiatePaymentCommand, PaymentDto>
{
    public Task<PaymentDto> Handle(InitiatePaymentCommand r, CancellationToken ct) =>
        Task.FromResult(new PaymentDto(Guid.NewGuid().ToString(), r.ApplicationId, r.Amount, "completed", "GBP", DateTime.UtcNow));
}
public static class PaymentEndpointExtensions
{
    public static void MapPaymentEndpoints(this WebApplication app)
    {
        app.MapPost("/api/payments/initiate", async (InitiatePaymentCommand cmd, IMediator mediator) => Results.Ok(new { success = true, data = await mediator.Send(cmd) }));
    }
}
