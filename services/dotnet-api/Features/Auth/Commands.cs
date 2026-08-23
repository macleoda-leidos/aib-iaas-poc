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

        // POC: accept any password
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("iaas-poc-secret-key-minimum-32-chars!"));
        var token = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer: "iaas-api", audience: "iaas-web",
            claims: new[] { new Claim("sub", user.Id), new Claim("email", user.Email), new Claim("role", user.Role.Name) },
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
