namespace IAAS.Api.Endpoints;

public static class RecommendEndpoints
{
    public static void MapRecommendEndpoints(this WebApplication app)
    {
        app.MapPost("/api/recommend", (RecommendRequest request) =>
        {
            var result = CalculateRecommendation(request);
            return Results.Ok(new { success = true, data = result });
        });
    }

    private static RecommendResult CalculateRecommendation(RecommendRequest input)
    {
        // Port of the Node.js rules engine
        if (input.ExistingCaseFound)
            return new("signposting_advice", "high", 95, new[] { "Existing active case found" }, new[] { "DAS", "MAP" });

        if (input.HasMoratorium)
            return new("moratorium", "high", 92, new[] { "Active moratorium" }, new[] { "DAS" });

        if (input.TotalDebt < 1500)
            return new("signposting_advice", "high", 90, new[] { "Debt below £1,500 threshold" }, new[] { "DPP" });

        var disposable = input.MonthlyIncome - input.MonthlyExpenditure;

        if (input.TotalDebt >= 1500 && input.TotalDebt <= 5000 && disposable >= input.TotalDebt / 48m)
            return new("debt_payment_programme", "high", 88, new[] { "Debt repayable within 48 months" }, new[] { "DAS" });

        if (input.TotalDebt >= 5000 && input.TotalDebt <= 25000 && disposable > 100)
            return new("debt_arrangement_scheme", "high", 94, new[] { "Debt in DAS range", "Disposable income supports repayment" }, new[] { "PTD", "Sequestration" });

        if (input.TotalAssetValue > 5000 && input.TotalDebt > 5000)
            return new("protected_trust_deed", "medium", 68, new[] { "Significant assets present" }, new[] { "DAS", "Sequestration" });

        if (input.TotalDebt >= 1500 && input.TotalDebt <= 25000 && input.TotalAssetValue < 2000 && disposable < 50)
            return new("minimal_asset_process", "high", 91, new[] { "Low income", "Minimal assets" }, new[] { "Sequestration" });

        if (input.TotalDebt > 25000 || (input.TotalDebt > 10000 && disposable <= 0))
            return new("bankruptcy", "medium", 72, new[] { "Debt exceeds thresholds" }, new[] { "PTD", "MAP" });

        return new("signposting_advice", "low", 45, new[] { "No clear match — seek professional advice" }, new[] { "DAS", "MAP", "PTD" });
    }
}

public record RecommendRequest(
    decimal TotalDebt, int NumberOfCreditors, decimal MonthlyIncome,
    decimal MonthlyExpenditure, string EmploymentStatus,
    bool HasAssets, decimal TotalAssetValue,
    bool ExistingCaseFound = false, bool HasMoratorium = false);

public record RecommendResult(
    string RecommendedProduct, string Confidence, int ConfidencePct,
    string[] Reasoning, string[] AlternativeProducts);
