using System.Text.Json;
using System.Text.Json.Serialization;
using IAAS.Api.Features.Recommendations;
using IAAS.Api.Domain.Statutory;
using Xunit;

namespace IAAS.Api.Tests;

/// <summary>
/// The .NET half of the cross-backend parity check.
/// </summary>
/// <remarks>
/// <para>
/// <c>tests/fixtures/recommendation-cases.json</c> is read by this suite and by
/// <c>services/recommendation-service/src/__tests__/engineParity.test.ts</c>. Two backends
/// serve the same API surface; until this table existed they gave different statutory
/// advice for identical input and nothing detected it (GAP-024).
/// </para>
/// <para>
/// The table is deliberately shared rather than duplicated. Two independently written test
/// files would drift, which is precisely how the divergence arose — so the check is:
/// change one expectation in the JSON and <b>both</b> suites go red.
/// </para>
/// </remarks>
public class RecommendationParityTests
{
    private sealed record ExpectedOutcome(
        [property: JsonPropertyName("product")] string Product,
        [property: JsonPropertyName("confidence")] string? Confidence,
        [property: JsonPropertyName("alternatives")] string[]? Alternatives
    );

    private sealed record CaseInput(
        [property: JsonPropertyName("totalDebt")] decimal TotalDebt,
        [property: JsonPropertyName("numberOfCreditors")] int NumberOfCreditors,
        [property: JsonPropertyName("monthlyIncome")] decimal MonthlyIncome,
        [property: JsonPropertyName("monthlyExpenditure")] decimal MonthlyExpenditure,
        [property: JsonPropertyName("employmentStatus")] string EmploymentStatus,
        [property: JsonPropertyName("hasAssets")] bool HasAssets,
        [property: JsonPropertyName("totalAssetValue")] decimal TotalAssetValue,
        [property: JsonPropertyName("hasMoratorium")] bool HasMoratorium,
        [property: JsonPropertyName("existingCases")] ExistingCaseJson[]? ExistingCases
    );

    private sealed record ExistingCaseJson(
        [property: JsonPropertyName("system")] string System,
        [property: JsonPropertyName("found")] bool Found,
        [property: JsonPropertyName("caseStatus")] string? CaseStatus
    );

    private sealed record TestCase(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("why")] string? Why,
        [property: JsonPropertyName("input")] CaseInput Input,
        [property: JsonPropertyName("expect")] ExpectedOutcome Expect
    );

    private sealed record Fixture(
        [property: JsonPropertyName("cases")] TestCase[] Cases
    );

    private static readonly TestCase[] Cases = LoadCases();

    private static TestCase[] LoadCases()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "fixtures", "recommendation-cases.json");
        var fixture = JsonSerializer.Deserialize<Fixture>(File.ReadAllText(path))
            ?? throw new InvalidOperationException($"Could not read the shared case table at {path}");
        return fixture.Cases;
    }

    private static GenerateRecommendationCommand ToCommand(CaseInput i) => new(
        TotalDebt: i.TotalDebt,
        NumberOfCreditors: i.NumberOfCreditors,
        MonthlyIncome: i.MonthlyIncome,
        MonthlyExpenditure: i.MonthlyExpenditure,
        EmploymentStatus: i.EmploymentStatus,
        HasAssets: i.HasAssets,
        TotalAssetValue: i.TotalAssetValue,
        // Left false: the structured array below is the input under test. Leaving both set
        // would make it impossible to tell which one the engine honoured.
        ExistingCaseFound: false,
        HasMoratorium: i.HasMoratorium,
        ExistingCases: i.ExistingCases
            ?.Select(c => new ExistingCase(c.System, c.Found, c.CaseStatus))
            .ToArray()
    );

    public static TheoryData<string> CaseNames()
    {
        var data = new TheoryData<string>();
        foreach (var c in Cases) data.Add(c.Name);
        return data;
    }

    [Fact]
    public void TheSharedTableLoadsAndIsNotEmpty()
    {
        // A fixture that failed to load would make every theory below silently absent, and
        // the suite would report green over nothing. Same guard as the Node side.
        Assert.True(Cases.Length >= 20, $"expected at least 20 shared cases, found {Cases.Length}");
    }

    [Theory]
    [MemberData(nameof(CaseNames))]
    public void MatchesTheSharedCase(string name)
    {
        var c = Cases.Single(x => x.Name == name);
        var result = RecommendationRules.Evaluate(ToCommand(c.Input));

        Assert.Equal(c.Expect.Product, result.RecommendedProduct);

        if (c.Expect.Confidence is not null)
        {
            Assert.Equal(c.Expect.Confidence, result.Confidence);
        }

        if (c.Expect.Alternatives is not null)
        {
            Assert.Equal(c.Expect.Alternatives, result.AlternativeProducts);
        }
    }

    [Fact]
    public void NeverReturnsAProductOutsideTheKnownSet()
    {
        // A typo in a product id renders as a blank panel in the journey rather than an
        // error, so it would reach a demo before anyone noticed.
        var known = new HashSet<string>
        {
            "debt_arrangement_scheme", "minimal_asset_process", "protected_trust_deed",
            "bankruptcy", "moratorium", "debt_payment_programme", "signposting_advice",
        };

        foreach (var c in Cases)
        {
            var result = RecommendationRules.Evaluate(ToCommand(c.Input));
            Assert.True(known.Contains(result.RecommendedProduct), $"{c.Name}: {result.RecommendedProduct}");
            foreach (var alt in result.AlternativeProducts)
            {
                Assert.True(known.Contains(alt), $"{c.Name} alternative: {alt}");
            }
        }
    }

    [Fact]
    public void AlwaysGivesReasoningAndSixFactors()
    {
        // Matches the Node engine's own contract. A statutory recommendation with no stated
        // basis cannot be challenged, which is the point of publishing the reasoning; six
        // factors because that is what the shared response shape promises the frontend.
        foreach (var c in Cases)
        {
            var result = RecommendationRules.Evaluate(ToCommand(c.Input));
            Assert.NotEmpty(result.Reasoning);
            Assert.Equal(6, result.Factors.Length);
        }
    }

    [Fact]
    public void NeverListsTheRecommendedProductAsItsOwnAlternative()
    {
        foreach (var c in Cases)
        {
            var result = RecommendationRules.Evaluate(ToCommand(c.Input));
            Assert.DoesNotContain(result.RecommendedProduct, result.AlternativeProducts);
        }
    }
}

/// <summary>
/// The specific regressions GAP-024 was, asserted directly rather than only through the
/// shared table.
/// </summary>
/// <remarks>
/// The table proves the two engines agree. These prove the three withdrawn behaviours are
/// gone by name, so if someone reintroduces one the failure says what it was rather than
/// just "case 6 expected X got Y".
/// </remarks>
public class WithdrawnRuleTests
{
    private static GenerateRecommendationCommand Base(decimal debt, decimal income, decimal expenditure, decimal assets = 0) =>
        new(debt, 3, income, expenditure, "employed", assets > 0, assets);

    [Theory]
    [InlineData(500)]
    [InlineData(900)]
    [InlineData(1499)]
    public void ThereIsNoFifteenHundredPoundFloor(decimal debt)
    {
        // SSI 2023/9 reg.2 removed the £1,500 MAP minimum on 6 February 2023 and prescribed
        // nothing in its place; DAS never had a monetary minimum (reg.21(1) permits a
        // programme for "one or more debts"). The withdrawn branch returned
        // signposting_advice for every one of these.
        var result = RecommendationRules.Evaluate(Base(debt, 2000, 1700));
        Assert.NotEqual("signposting_advice", result.RecommendedProduct);
        Assert.Equal("debt_payment_programme", result.RecommendedProduct);
    }

    [Fact]
    public void MapIsEvaluatedBeforeProtectedTrustDeed()
    {
        // Minimal assets and almost no ability to pay is the MAP test. With PTD first, this
        // applicant was sent to a trust deed — a more expensive, more intrusive process
        // they did not need.
        var result = RecommendationRules.Evaluate(Base(debt: 8000, income: 900, expenditure: 880, assets: 500));
        Assert.Equal("minimal_asset_process", result.RecommendedProduct);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(50)]
    [InlineData(99)]
    [InlineData(100)]
    public void ASurplusBelowOneHundredStillReachesDas(decimal surplus)
    {
        // The old gate was `disposable > 100`, which left a £1–£100 surplus matching no
        // branch: too much for MAP (which caps at 50) and not enough for DAS. The applicant
        // was told their case "does not clearly match standard product criteria" while
        // sitting squarely inside DAS range.
        //
        // Assets are £3,000 deliberately, to isolate the DAS branch. Below £2,000 the MAP
        // branch correctly claims these applicants first — it is evaluated earlier and is
        // the better route for someone with £1/month spare and nothing to realise. Above
        // £5,000 the trust-deed deferral applies. Between the two, DAS is the branch under
        // test, and the one the withdrawn gate excluded.
        var result = RecommendationRules.Evaluate(Base(debt: 12000, income: 1500, expenditure: 1500 - surplus, assets: 3000));
        Assert.Equal("debt_arrangement_scheme", result.RecommendedProduct);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(50)]
    [InlineData(99)]
    [InlineData(100)]
    public void ASurplusBelowOneHundredIsNeverTurnedAway(decimal surplus)
    {
        // The general form of the same defect, and the one that matters to the applicant:
        // whatever their asset position, a debtor inside the statutory debt range with
        // *some* ability to pay must be offered a route rather than the generic default.
        foreach (var assets in new decimal[] { 0, 1500, 3000, 6000, 20000 })
        {
            var result = RecommendationRules.Evaluate(Base(debt: 12000, income: 1500, expenditure: 1500 - surplus, assets: assets));
            Assert.NotEqual("signposting_advice", result.RecommendedProduct);
        }
    }

    [Fact]
    public void AClosedExistingCaseDoesNotBlockARecommendation()
    {
        // The .NET-only divergence: a single `bool ExistingCaseFound` meant any hit in any
        // register produced signposting, including a case discharged years ago.
        var result = RecommendationRules.Evaluate(new GenerateRecommendationCommand(
            15000, 4, 2000, 1700, "employed", false, 0,
            ExistingCases: new[] { new ExistingCase("basys", true, "discharged") }));

        Assert.Equal("debt_arrangement_scheme", result.RecommendedProduct);
    }

    [Theory]
    [InlineData("active")]
    [InlineData("Open")]
    [InlineData("application_in_progress")]
    [InlineData("Current DPP")]
    [InlineData("ONGOING")]
    [InlineData("pending review")]
    public void ALiveCaseInAnyUpstreamVocabularyProducesSignposting(string status)
    {
        // Six upstream systems, six vocabularies, none under our control. Over-matching is
        // the safe direction: the cost is an adviser confirming there is no live case,
        // versus recommending a duplicate insolvency route to someone already inside one.
        Assert.True(RecommendationRules.IsLiveCaseStatus(status));

        var result = RecommendationRules.Evaluate(new GenerateRecommendationCommand(
            15000, 4, 2000, 1700, "employed", false, 0,
            ExistingCases: new[] { new ExistingCase("das", true, status) }));

        Assert.Equal("signposting_advice", result.RecommendedProduct);
    }

    [Theory]
    [InlineData("discharged")]
    [InlineData("closed")]
    [InlineData("completed")]
    [InlineData(null)]
    [InlineData("")]
    public void AStatusThatIsNotLiveIsNotTreatedAsLive(string? status)
    {
        Assert.False(RecommendationRules.IsLiveCaseStatus(status));
    }

    [Fact]
    public void TheLegacyBooleanIsStillHonouredAsALiveCase()
    {
        // Callers predating the structured array pass `ExistingCaseFound: true` with no
        // status. Reading that as "not live" would silently stop signposting for them, so
        // it fails safe in the other direction.
        var result = RecommendationRules.Evaluate(new GenerateRecommendationCommand(
            15000, 4, 2000, 1700, "employed", false, 0, ExistingCaseFound: true));

        Assert.Equal("signposting_advice", result.RecommendedProduct);
    }
}

/// <summary>
/// That the C# thresholds still say what the Node ones say.
/// </summary>
/// <remarks>
/// Ministers move these figures by Scottish statutory instrument without touching primary
/// legislation, so they are configuration with an effective date. When one moves, both
/// copies must move together — and this is the test that fails if only one does.
/// </remarks>
public class StatutoryThresholdTests
{
    [Fact]
    public void MapCeilingIsTwentyFiveThousandWithItsCitation()
    {
        Assert.Equal(25000m, Map.MaxDebt.Value);
        Assert.Contains("s.2(2)(b)(ii)", Map.MaxDebt.Citation);
        Assert.Equal("SSI 2021/148 reg.4(2)", Map.MaxDebt.AmendedBy);
    }

    [Fact]
    public void MapHasNoMinimumDebt()
    {
        // Modelled explicitly as null because "no minimum" is a deliberate policy position
        // that third-party summaries still get wrong. A non-null value here means someone
        // has reintroduced a floor.
        Assert.Null(Map.MinDebt.Value);
        Assert.Equal("SSI 2023/9 reg.2", Map.MinDebt.AmendedBy);
        Assert.Equal("2023-02-06", Map.MinDebt.EffectiveFrom);
    }

    [Fact]
    public void RemainingThresholdsMatchTheNodePackage()
    {
        Assert.Equal(2000m, Map.MaxTotalAssets.Value);
        Assert.Equal(1000m, Map.MaxSingleAsset.Value);
        Assert.Equal(3000m, Map.VehicleDisregard.Value);
        Assert.Equal(3000m, Thresholds.SequestrationMinDebt.Value);
        Assert.Equal(48, Dco.DefaultPeriodMonths.Value);
        Assert.Equal(1, Das.MinDebts.Value);
    }

    [Fact]
    public void EveryThresholdCarriesACitation()
    {
        // The reason citations are data rather than comments: a caseworker challenged on a
        // figure needs the provision, and an uncited figure cannot be defended or audited.
        foreach (var citation in new[]
        {
            Map.MaxDebt.Citation, Map.MinDebt.Citation, Map.MaxTotalAssets.Citation,
            Map.MaxSingleAsset.Citation, Map.MustNotOwnLand.Citation, Map.VehicleDisregard.Citation,
            Thresholds.SequestrationMinDebt.Citation, Dco.DefaultPeriodMonths.Citation,
            Das.MinDebts.Citation,
        })
        {
            Assert.False(string.IsNullOrWhiteSpace(citation));
        }
    }
}
