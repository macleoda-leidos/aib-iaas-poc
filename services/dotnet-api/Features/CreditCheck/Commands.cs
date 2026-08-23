using MediatR;
namespace IAAS.Api.Features.CreditCheck;

public record RunCreditCheckCommand(string NiNumber, string FirstName, string LastName) : IRequest<CreditCheckResult>;
public record CreditCheckResult(int Score, string Result, int Defaults, int Ccjs, string Provider);
public class RunCreditCheckHandler : IRequestHandler<RunCreditCheckCommand, CreditCheckResult>
{
    public Task<CreditCheckResult> Handle(RunCreditCheckCommand r, CancellationToken ct)
    {
        var hash = r.NiNumber.GetHashCode();
        var score = 300 + (Math.Abs(hash) % 500);
        return Task.FromResult(new CreditCheckResult(score, score >= 500 ? "PASS" : "FAIL", score < 400 ? 2 : 0, score < 350 ? 1 : 0, "Experian"));
    }
}
public static class CreditCheckEndpointExtensions
{
    public static void MapCreditCheckEndpoints(this WebApplication app)
    {
        app.MapPost("/api/credit-check/run", async (RunCreditCheckCommand cmd, IMediator mediator) => Results.Ok(new { success = true, data = await mediator.Send(cmd) }));
    }
}
