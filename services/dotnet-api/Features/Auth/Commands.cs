using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using IAAS.Api.Data;

namespace IAAS.Api.Features.Auth;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult?>;
public record LoginResult(string Token, UserInfo User);
public record UserInfo(string Id, string Email, string FirstName, string LastName, string Role);

public class LoginHandler : IRequestHandler<LoginCommand, LoginResult?>
{
    private readonly IaasDbContext _db;
    public LoginHandler(IaasDbContext db) => _db = db;

    public async Task<LoginResult?> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == request.Email, ct);
        if (user is null) return null;

        // NOTE (.NET parity gap): the password is not yet verified here. Closing
        // this needs BCrypt.Net to check the bcrypt hash the Node seed writes, and
        // the EF User model has no PasswordHash column — both are blocked in the
        // current build environment (NuGet unreachable; see docs/dotnet-auth-parity.md).
        // The token signing below, however, is now at parity with the Node service.

        // Signed HS256 with the injected JWT_SECRET (no longer a committed key),
        // and the same issuer/audience/claim shape as @aib-iaas/auth so a token is
        // interchangeable between the two services.
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.GetSecret()));
        var token = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: JwtConfig.Issuer, audience: JwtConfig.Audience,
            claims: new[]
            {
                new Claim("userId", user.Id),
                new Claim("email", user.Email),
                new Claim("role", user.Role.Name),
                new Claim("roleLevel", user.Role.Level.ToString()),
            },
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)));

        return new LoginResult(token, new UserInfo(user.Id, user.Email, user.FirstName, user.LastName, user.Role.Name));
    }
}

public static class AuthEndpointExtensions
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginCommand cmd, IMediator mediator) =>
        {
            var result = await mediator.Send(cmd);
            return result is null
                ? Results.Json(new { success = false, error = new { code = "INVALID_CREDENTIALS" } }, statusCode: 401)
                : Results.Ok(new { success = true, data = result });
        });
    }
}
