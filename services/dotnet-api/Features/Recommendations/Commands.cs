using MediatR;
using IAAS.Api.Domain.Statutory;

namespace IAAS.Api.Features.Recommendations;

/// <summary>One upstream system's answer about an existing case.</summary>
/// <remarks>
/// Previously this whole concept was a single <c>bool ExistingCaseFound</c>, so any hit
/// in any register produced signposting — including a case closed years ago. The Node
/// engine has always distinguished "a case exists" from "a case is still running", which
/// is the distinction that decides whether the applicant can be offered a product at all.
/// <see cref="RecommendationRules.IsLiveCaseStatus"/> is the port of that test.
/// </remarks>
public record ExistingCase(string System, bool Found, string? CaseStatus = null);

public record GenerateRecommendationCommand(
    decimal TotalDebt,
    int NumberOfCreditors,
    decimal MonthlyIncome,
    decimal MonthlyExpenditure,
    string EmploymentStatus,
    bool HasAssets,
    decimal TotalAssetValue,
    // Retained so existing callers keep working. A bare `true` is treated as a live case
    // of unknown provenance, which is the safe reading: it signposts to an adviser rather
    // than recommending a second statutory product to someone already inside one.
    bool ExistingCaseFound = false,
    bool HasMoratorium = false,
    ExistingCase[]? ExistingCases = null
) : IRequest<RecommendationResult>;

public record RecommendationFactor(string Factor, string Value, string Impact);

public record RecommendationResult(
    string RecommendedProduct,
    string Confidence,
    int ConfidencePct,
    string[] Reasoning,
    string[] AlternativeProducts,
    RecommendationFactor[] Factors
);

/// <summary>
/// The Scottish debt-product rules, ported from
/// <c>services/recommendation-service/src/engine/rules.ts</c>.
/// </summary>
/// <remarks>
/// <para>
/// This is deliberately a duplicate implementation rather than a call to the Node
/// service: two independent backends is the point of having a .NET one, and coupling it
/// over HTTP to the service it is an alternative to would defeat that. What must not
/// diverge is the *outcome*, which is why the figures come from
/// <see cref="Thresholds"/> and why <c>tests/dotnet</c> and the Node engine suite both
/// read the same case table at <c>tests/fixtures/recommendation-cases.json</c>. A table
/// both suites consume makes parity a property; two hand-written test files would drift.
/// </para>
/// <para>
/// What was wrong before (GAP-024), in the order it mattered:
/// </para>
/// <list type="number">
/// <item><description>
/// A <c>TotalDebt &lt; 1500</c> floor returning signposting. SSI 2023/9 reg. 2 removed
/// the £1,500 MAP minimum on 6 February 2023 and nothing was prescribed in its place;
/// DAS never had a monetary minimum at all (reg. 21(1) permits a programme for "one or
/// more debts"). A £900 debtor was turned away from every statutory route.
/// </description></item>
/// <item><description>
/// PTD was evaluated before MAP, so a debtor with minimal assets and no ability to pay
/// was routed to a trust deed rather than to the cheaper, simpler process they qualified
/// for. MAP is the more specific test and must come first.
/// </description></item>
/// <item><description>
/// DAS required <c>disposable &gt; 100</c>. A £1–£100 surplus then matched no branch at
/// all — too much for MAP (which caps at 50) and not enough for DAS — so those applicants
/// fell to the generic default and were told their case "does not clearly match standard
/// product criteria" while sitting squarely inside DAS range.
/// </description></item>
/// <item><description>
/// Any existing case produced signposting, live or long closed. See
/// <see cref="ExistingCase"/>.
/// </description></item>
/// </list>
/// </remarks>
public static class RecommendationRules
{
    /// <summary>
    /// Words an upstream system uses to mean "this case is still running".
    /// </summary>
    /// <remarks>
    /// Matched by substring and case-insensitively, because these come from six different
    /// upstream systems and none of them is under our control — the DAS mock contract
    /// declares <c>application_in_progress</c>, while eDEN and BASYS each have their own
    /// vocabulary. Over-matching is the safe direction: the consequence is signposting
    /// someone to an adviser who confirms there is no live case, rather than recommending
    /// a duplicate insolvency route to someone already in one.
    /// </remarks>
    private static readonly string[] LiveCaseMarkers =
    {
        "active", "open", "current", "live", "in progress", "in_progress", "ongoing", "pending",
    };

    public static bool IsLiveCaseStatus(string? caseStatus)
    {
        if (string.IsNullOrWhiteSpace(caseStatus)) return false;
        var normalised = caseStatus.ToLowerInvariant();
        return LiveCaseMarkers.Any(marker => normalised.Contains(marker));
    }

    /// <summary>
    /// Confidence as a percentage, derived from the band rather than chosen per branch.
    /// </summary>
    /// <remarks>
    /// The previous handler carried a distinct percentage on every branch — 95, 92, 90,
    /// 88, 94, 68, 91, 72, 45. None of them came from anywhere. The Node engine reports a
    /// band and no percentage, so a figure implying two significant figures of certainty
    /// about a statutory recommendation is exactly the kind of invented precision this
    /// change is removing. The field is kept because callers read it; its value is now
    /// derived and honest about its granularity.
    /// </remarks>
    private static int Pct(string confidence) => confidence switch
    {
        "high" => 90,
        "medium" => 70,
        _ => 45,
    };

    private static RecommendationResult Result(
        string product,
        string confidence,
        IEnumerable<string> reasoning,
        IEnumerable<string> alternatives,
        List<RecommendationFactor> factors
    ) => new(product, confidence, Pct(confidence), reasoning.ToArray(), alternatives.ToArray(), factors.ToArray());

    /// <summary>Money as the reasoning strings render it — "£12,500", matching toLocaleString('en-GB').</summary>
    private static string Money(decimal amount) => "£" + amount.ToString("#,##0");

    public static RecommendationResult Evaluate(GenerateRecommendationCommand r)
    {
        var disposableIncome = r.MonthlyIncome - r.MonthlyExpenditure;
        var reasoning = new List<string>();

        // Cases arrive either as the structured array or as the legacy bool. A bare
        // `true` carries no status, so it is treated as live — see ExistingCase.
        var existingCases = r.ExistingCases
            ?? (r.ExistingCaseFound ? new[] { new ExistingCase("unspecified", true, "active") } : Array.Empty<ExistingCase>());

        var existingCaseFound = existingCases.Any(c => c.Found);

        var factors = new List<RecommendationFactor>
        {
            new("Total Debt", Money(r.TotalDebt),
                r.TotalDebt > Map.MaxDebt.Value ? "negative" : r.TotalDebt < 5000 ? "positive" : "neutral"),
            new("Disposable Income", $"£{disposableIncome:0}/month",
                disposableIncome > 200 ? "positive" : disposableIncome > 0 ? "neutral" : "negative"),
            new("Number of Creditors", r.NumberOfCreditors.ToString(),
                r.NumberOfCreditors > 5 ? "negative" : "neutral"),
            new("Employment Status", r.EmploymentStatus,
                r.EmploymentStatus is "employed" or "self_employed" ? "positive" : "negative"),
            new("Assets", r.HasAssets ? Money(r.TotalAssetValue) : "None significant",
                r.TotalAssetValue > 10000 ? "neutral" : "positive"),
            new("Existing Cases", existingCaseFound ? "Case found" : "None found",
                existingCaseFound ? "negative" : "positive"),
        };

        // ===== Live existing case =====
        var activeCase = existingCases.FirstOrDefault(c => c.Found && IsLiveCaseStatus(c.CaseStatus));
        if (activeCase is not null)
        {
            reasoning.Add($"Active case found in {activeCase.System}");
            reasoning.Add("Applicant should be signposted to existing case handler");
            return Result("signposting_advice", "high", reasoning, Array.Empty<string>(), factors);
        }

        // ===== Moratorium =====
        if (r.HasMoratorium)
        {
            reasoning.Add("Active moratorium in place - breathing space protection active");
            reasoning.Add("Debtor has time to seek advice and consider options");
            return Result("moratorium", "high", reasoning,
                new[] { "debt_arrangement_scheme", "signposting_advice" }, factors);
        }

        // ON THE REMOVED £1,500 FLOOR
        //
        // There was a "debt below £1,500 — not eligible for anything" branch here. No such
        // minimum exists: SSI 2023/9 reg.2 removed the £1,500 MAP minimum on 6 February
        // 2023 and nothing was prescribed in its place, so s.2(2)(b)(i) reads "not less
        // than such amount as may be prescribed" with no amount currently prescribed. DAS
        // never had a monetary minimum. This is a live error rather than a stale one —
        // third-party summaries still quote £1,500.

        var monthsToRepay = disposableIncome > 0 ? r.TotalDebt / disposableIncome : decimal.MaxValue;

        // ===== Low debt repayable within the default contribution period =====
        if (r.TotalDebt <= 5000 && monthsToRepay <= Dco.DefaultPeriodMonths.Value)
        {
            reasoning.Add($"Total debt of {Money(r.TotalDebt)} within Debt Payment Programme range");
            reasoning.Add($"Can repay in approximately {Math.Ceiling(monthsToRepay)} months");
            reasoning.Add("Disposable income sufficient for structured repayment");
            return Result("debt_payment_programme", "high", reasoning,
                new[] { "debt_arrangement_scheme" }, factors);
        }

        // ===== Minimal assets, cannot afford payments — MAP =====
        //
        // Evaluated before DAS, and before PTD, because it is the more specific test:
        // minimal assets AND almost no ability to pay. This ordering is the second half of
        // GAP-024 — with PTD first, a debtor with £1,800 of assets and no surplus was
        // routed to a trust deed instead of the process they actually qualified for.
        if (r.TotalDebt <= Map.MaxDebt.Value
            && disposableIncome <= 50
            && r.TotalAssetValue < Map.MaxTotalAssets.Value)
        {
            reasoning.Add("Debtor has minimal assets and limited ability to pay");
            reasoning.Add($"Total debt of {Money(r.TotalDebt)} with disposable income of £{disposableIncome:0}/month");
            reasoning.Add("Minimal Asset Process (MAP) provides route to debt relief without significant cost");
            return Result("minimal_asset_process", "high", reasoning, new[] { "bankruptcy" }, factors);
        }

        // ===== Medium debt, can afford payments — DAS =====
        //
        // The gate is `disposableIncome > 0`, not > 100. A DPP under DAS requires only that
        // the debtor can offer something to creditors, so anyone in the statutory debt
        // range with a surplus is eligible — the size of that surplus is a matter of
        // confidence, not eligibility.
        //
        // The asset carve-out defers to the trust deed branch below: with substantial
        // assets and only a token surplus, realising the assets is the realistic route and
        // a DPP would run implausibly long. Note `> 5000` rather than `>=`: it mirrors the
        // trust deed branch's own debt gate exactly, so debt of precisely £5,000 is never
        // deferred to a branch that would then decline it and drop through to signposting.
        var deferToTrustDeed = disposableIncome <= 100 && r.TotalAssetValue > 5000 && r.TotalDebt > 5000;
        if (r.TotalDebt >= 5000
            && r.TotalDebt <= Map.MaxDebt.Value
            && disposableIncome > 0
            && !deferToTrustDeed)
        {
            reasoning.Add($"Total debt of {Money(r.TotalDebt)} falls within DAS eligibility");
            reasoning.Add($"Disposable income of £{disposableIncome:0}/month allows structured repayment");
            reasoning.Add("Debt Arrangement Scheme provides statutory protection from creditors");

            if (disposableIncome <= 100)
            {
                reasoning.Add("Low disposable income means an extended programme — money adviser should confirm affordability");
            }

            var confidence = disposableIncome > 200 ? "high" : disposableIncome > 100 ? "medium" : "low";
            var alternatives = monthsToRepay > 48
                ? new[] { "protected_trust_deed" }
                : new[] { "debt_payment_programme" };

            return Result("debt_arrangement_scheme", confidence, reasoning, alternatives, factors);
        }

        // ===== Higher debt with significant assets — Protected Trust Deed =====
        //
        // Keyed on the asset VALUE alone. HasAssets is a separate self-declared flag and
        // nothing keeps the two consistent, so requiring both meant a debtor declaring
        // £50,000 of assets with the flag unset skipped PTD and bankruptcy and landed on
        // generic signposting.
        if (r.TotalDebt > 5000 && r.TotalAssetValue > 5000)
        {
            reasoning.Add($"Total debt of {Money(r.TotalDebt)} with assets valued at {Money(r.TotalAssetValue)}");
            reasoning.Add("Protected Trust Deed may be appropriate given asset position");
            reasoning.Add("Allows structured repayment over a trustee-agreed period with asset realisation");
            return Result("protected_trust_deed", "medium", reasoning,
                new[] { "bankruptcy", "debt_arrangement_scheme" }, factors);
        }

        // ===== High debt or complex — Bankruptcy/Sequestration =====
        //
        // The no-surplus arm starts at £3,000, the statutory minimum for a debtor
        // application under s.2(8), rather than £10,000. A debtor with no disposable income
        // cannot fund any repayment programme, so above that minimum sequestration is the
        // applicable route. Starting at £10,000 stranded £3,000–£10,000 no-surplus debtors
        // whose assets were too high for MAP on the signposting default.
        if (r.TotalDebt > Map.MaxDebt.Value
            || (r.TotalDebt >= Thresholds.SequestrationMinDebt.Value && disposableIncome <= 0))
        {
            reasoning.Add($"Total debt of {Money(r.TotalDebt)} exceeds thresholds for simpler solutions");
            reasoning.Add("Formal sequestration (bankruptcy) may be the most appropriate route");
            reasoning.Add("Provides comprehensive debt relief but with significant consequences");
            return Result("bankruptcy", "medium", reasoning,
                new[] { "protected_trust_deed", "minimal_asset_process" }, factors);
        }

        // ===== Default — signposting =====
        reasoning.Add("Case does not clearly match standard product criteria");
        reasoning.Add("Professional money advice recommended to explore all options");
        return Result("signposting_advice", "low", reasoning,
            new[] { "debt_arrangement_scheme", "debt_payment_programme" }, factors);
    }
}

public class GenerateRecommendationHandler : IRequestHandler<GenerateRecommendationCommand, RecommendationResult>
{
    public Task<RecommendationResult> Handle(GenerateRecommendationCommand r, CancellationToken ct)
        => Task.FromResult(RecommendationRules.Evaluate(r));
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
