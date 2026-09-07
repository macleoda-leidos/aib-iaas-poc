namespace IAAS.Api.Domain.Statutory;

/// <summary>
/// Statutory thresholds for Scotland's debt solutions, each carrying the provision it
/// comes from. The C# mirror of <c>packages/statutory/src/thresholds.ts</c>.
/// </summary>
/// <remarks>
/// <para>
/// Every monetary figure in the Bankruptcy (Scotland) Act 2016 is expressed as "£X or
/// such other amount as may be prescribed" — Ministers change them by Scottish statutory
/// instrument, without touching primary legislation. Several have already moved: the MAP
/// debt ceiling became £25,000 in 2021 (SSI 2021/148), and the £1,500 MAP minimum was
/// removed outright in 2023 (SSI 2023/9). So these are configuration with an effective
/// date, not constants, and the citation is part of the data rather than a comment: a
/// caseworker challenged on a figure needs the provision.
/// </para>
/// <para>
/// Why this file exists (GAP-024). The recommendation handler previously held every
/// figure as a bare literal, including <c>if (r.TotalDebt &lt; 1500) return
/// signposting_advice</c> — the MAP minimum that SSI 2023/9 reg. 2 removed on
/// 6 February 2023, with nothing prescribed in its place. So the .NET backend turned a
/// £900 debtor away from every statutory route while the Node backend routed the same
/// applicant to a Debt Payment Programme. Two backends deployed side by side, giving
/// different statutory advice for identical input, and nothing in either codebase
/// recorded that they disagreed.
/// </para>
/// <para>
/// Figures are <b>read</b> from here and never retyped inline. That is the same rule the
/// Node engine follows, and it is the only thing that makes the divergence detectable
/// next time a figure moves.
/// </para>
/// <para>Verified against legislation.gov.uk. Anything unverifiable is absent rather than guessed.</para>
/// </remarks>
public sealed record Threshold<T>(
    T Value,
    /// <summary>The provision this figure comes from, quotable to a caseworker.</summary>
    string Citation,
    /// <summary>Set where the current value differs from the one originally enacted.</summary>
    string? AmendedBy = null,
    /// <summary>ISO date the current value took effect, where known.</summary>
    string? EffectiveFrom = null
);

public static class Thresholds
{
    /// <summary>
    /// Minimum debt for a debtor application for sequestration.
    /// s.2(8)(a): "not less than £3,000 or such sum as may be prescribed".
    /// </summary>
    public static readonly Threshold<decimal> SequestrationMinDebt = new(
        3000m,
        "Bankruptcy (Scotland) Act 2016 s.2(8)(a)"
    );
}

/// <summary>Minimal Asset Process eligibility — s.2(2) and s.2(3).</summary>
public static class Map
{
    public static readonly Threshold<decimal> MaxDebt = new(
        25000m,
        "Bankruptcy (Scotland) Act 2016 s.2(2)(b)(ii)",
        AmendedBy: "SSI 2021/148 reg.4(2)",
        EffectiveFrom: "2021-03-29"
    );

    /// <summary>
    /// There is NO MAP minimum debt. s.2(2)(b)(i) now reads "not less than such amount as
    /// may be prescribed" — SSI 2023/9 reg.2 removed the £1,500 figure and nothing has
    /// been prescribed since.
    /// </summary>
    /// <remarks>
    /// Modelled explicitly as null because "no minimum" is a deliberate policy position
    /// that outside sources still get wrong — a missing member would read as an oversight,
    /// and reintroducing a literal 1500 somewhere is exactly the defect this closes.
    /// </remarks>
    public static readonly Threshold<decimal?> MinDebt = new(
        null,
        "Bankruptcy (Scotland) Act 2016 s.2(2)(b)(i) — no amount currently prescribed",
        AmendedBy: "SSI 2023/9 reg.2",
        EffectiveFrom: "2023-02-06"
    );

    public static readonly Threshold<decimal> MaxTotalAssets = new(
        2000m,
        "Bankruptcy (Scotland) Act 2016 s.2(2)(c)"
    );

    public static readonly Threshold<decimal> MaxSingleAsset = new(
        1000m,
        "Bankruptcy (Scotland) Act 2016 s.2(2)(d)"
    );

    /// <summary>s.2(2)(e) — the one condition with no "or as prescribed" escape.</summary>
    public static readonly Threshold<bool> MustNotOwnLand = new(
        true,
        "Bankruptcy (Scotland) Act 2016 s.2(2)(e)"
    );

    /// <summary>
    /// s.2(3)(b) — note s.2(3), not s.2(2): a vehicle under this value is not counted as
    /// an asset at all, but only where the debtor "reasonably requires the use of a vehicle".
    /// </summary>
    public static readonly Threshold<decimal> VehicleDisregard = new(
        3000m,
        "Bankruptcy (Scotland) Act 2016 s.2(3)(b)"
    );
}

/// <summary>
/// Debt Arrangement Scheme eligibility.
/// </summary>
/// <remarks>
/// Deliberately holds no monetary minimum: reg.21(1) permits a programme for "one or more
/// debts", and the instrument prescribes no debt floor. The often-repeated "£5,000 and at
/// least two debts" has no basis in the regulations — asserting it would wrongly turn
/// people away.
/// </remarks>
public static class Das
{
    public static readonly Threshold<int> MinDebts = new(
        1,
        "Debt Arrangement Scheme (Scotland) Regulations 2011 reg.21(1)"
    );
}

/// <summary>Debtor contribution order — ss.90, 91.</summary>
public static class Dco
{
    /// <summary>s.91(2)(a). A default, not a cap: (2)(b) and (2)(c) allow shorter and longer.</summary>
    public static readonly Threshold<int> DefaultPeriodMonths = new(
        48,
        "Bankruptcy (Scotland) Act 2016 s.91(2)(a)"
    );
}
