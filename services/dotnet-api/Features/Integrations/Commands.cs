using MediatR;

namespace IAAS.Api.Features.Integrations;

public record RunAllChecksCommand(string NiNumber, string FirstName, string LastName) : IRequest<IntegrationResults>;

public record IntegrationResults(List<SystemCheckResult> Results, IntegrationSummary Summary);
public record SystemCheckResult(string System, string Status, bool Found, int ResponseTimeMs);
public record IntegrationSummary(int TotalChecks, int CasesFound, int Errors);

public class RunAllChecksHandler : IRequestHandler<RunAllChecksCommand, IntegrationResults>
{
    public async Task<IntegrationResults> Handle(RunAllChecksCommand request, CancellationToken ct)
    {
        // Mock integration checks (same as Node.js mock-integrations)
        var systems = new[] { "BASYS", "eDEN", "DAS", "CFT", "Moratorium", "RoI" };
        var results = new List<SystemCheckResult>();
        var rng = new Random();

        foreach (var sys in systems)
        {
            await Task.Delay(rng.Next(50, 200), ct); // Simulate latency
            var found = sys == "BASYS" && request.LastName.ToUpper().Contains("SMITH");
            results.Add(new SystemCheckResult(sys, "ok", found, rng.Next(45, 250)));
        }

        var casesFound = results.Count(r => r.Found);
        return new IntegrationResults(results, new IntegrationSummary(systems.Length, casesFound, 0));
    }
}

public static class IntegrationEndpointExtensions
{
    public static void MapIntegrationEndpoints(this WebApplication app)
    {
        app.MapPost("/api/integrations/check-all", async (RunAllChecksCommand cmd, IMediator mediator) =>
        {
            var result = await mediator.Send(cmd);
            return Results.Ok(new { success = true, data = result.Results, summary = result.Summary });
        });
    }
}
