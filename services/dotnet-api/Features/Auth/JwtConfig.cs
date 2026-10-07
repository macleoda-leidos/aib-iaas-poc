namespace IAAS.Api.Features.Auth;

/// <summary>
/// Token-signing configuration for the .NET API, kept deliberately identical to
/// the Node service's @aib-iaas/auth so a token minted by either is verifiable by
/// the other: same HS256 secret (the injected JWT_SECRET), same issuer and
/// audience, same dev-fallback secret. render.yaml wires JWT_SECRET (sync:false)
/// onto both iaas-api and iaas-dotnet-api for exactly this reason.
/// </summary>
public static class JwtConfig
{
    public const string Issuer = "aib-iaas";
    public const string Audience = "aib-iaas-api";

    // Must match @aib-iaas/auth DEV_JWT_SECRET so dev/test tokens cross-verify.
    private const string DevSecret = "dev-only-insecure-secret-aib-iaas-poc";

    /// <summary>
    /// The HS256 signing secret. Throws in Production when JWT_SECRET is unset —
    /// mirrors the Node getJwtSecret(), so a misconfigured deploy fails loudly
    /// instead of signing with a secret published in source.
    /// </summary>
    public static string GetSecret()
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrEmpty(secret)) return secret;

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "JWT_SECRET must be set in production — refusing to sign tokens with the public dev secret.");
        }
        return DevSecret;
    }
}
