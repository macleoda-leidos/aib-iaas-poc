using MediatR;

namespace IAAS.Api.Features.Recommendations;

public record GenerateRecommendationCommand(decimal TotalDebt, int NumberOfCreditors, decimal MonthlyIncome, decimal MonthlyExpenditure, string EmploymentStatus, bool HasAssets, decimal TotalAssetValue, bool ExistingCaseFound = false, bool HasMoratorium = false) : IRequest<RecommendationResult>;

public record RecommendationResult(string RecommendedProduct, string Confidence, int ConfidencePct, string[] Reasoning, string[] AlternativeProducts);

public class GenerateRecommendationHandler : IRequestHandler<GenerateRecommendationCommand, RecommendationResult>
{
    public Task<RecommendationResult> Handle(GenerateRecommendationCommand r, CancellationToken ct)
    {
        // Scottish debt product rules engine
        if (r.ExistingCaseFound) return Task.FromResult(new RecommendationResult("signposting_advice", "high", 95, new[] { "Existing active case found" }, new[] { "DAS", "MAP" }));
        if (r.HasMoratorium) return Task.FromResult(new RecommendationResult("moratorium", "high", 92, new[] { "Active moratorium" }, new[] { "DAS" }));
        if (r.TotalDebt < 1500) return Task.FromResult(new RecommendationResult("signposting_advice", "high", 90, new[] { "Debt below £1,500" }, new[] { "DPP" }));

        var disposable = r.MonthlyIncome - r.MonthlyExpenditure;
        if (r.TotalDebt <= 5000 && disposable >= r.TotalDebt / 48m) return Task.FromResult(new RecommendationResult("debt_payment_programme", "high", 88, new[] { "Repayable in 48 months" }, new[] { "DAS" }));
        if (r.TotalDebt >= 5000 && r.TotalDebt <= 25000 && disposable > 100) return Task.FromResult(new RecommendationResult("debt_arrangement_scheme", "high", 94, new[] { "Debt in DAS range", "Disposable income supports repayment" }, new[] { "PTD", "Sequestration" }));
        if (r.TotalAssetValue > 5000 && r.TotalDebt > 5000) return Task.FromResult(new RecommendationResult("protected_trust_deed", "medium", 68, new[] { "Significant assets" }, new[] { "DAS", "Sequestration" }));
        if (r.TotalDebt <= 25000 && r.TotalAssetValue < 2000 && disposable < 50) return Task.FromResult(new RecommendationResult("minimal_asset_process", "high", 91, new[] { "Low income", "Minimal assets" }, new[] { "Sequestration" }));
        if (r.TotalDebt > 25000 || (r.TotalDebt > 10000 && disposable <= 0)) return Task.FromResult(new RecommendationResult("bankruptcy", "medium", 72, new[] { "Debt exceeds thresholds" }, new[] { "PTD", "MAP" }));

        return Task.FromResult(new RecommendationResult("signposting_advice", "low", 45, new[] { "Seek professional advice" }, new[] { "DAS", "MAP", "PTD" }));
    }
}

public static class RecommendEndpointExtensions
{
    public static void MapRecommendEndpoints(this WebApplication app)
    {
        app.MapPost("/api/recommend", async (GenerateRecommendationCommand cmd, IMediator mediator) =>
        {
            var result = await mediator.Send(cmd);
            return Results.Ok(new { success = true, data = result });
        });
    }
}
