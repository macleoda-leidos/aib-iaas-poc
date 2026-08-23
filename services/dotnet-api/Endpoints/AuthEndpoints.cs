using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using IAAS.Api.Data;

namespace IAAS.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest request, IaasDbContext db) =>
        {
            var user = await db.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user is null)
                return Results.Unauthorized();

            // POC: accept any password for demo
            var token = GenerateToken(user.Id, user.Email, user.Role.Name);

            return Results.Ok(new
            {
                success = true,
                data = new
                {
                    token,
                    user = new { user.Id, user.Email, user.FirstName, user.LastName, role = user.Role.Name }
                }
            });
        });
    }

    private static string GenerateToken(string userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("iaas-poc-secret-key-minimum-32-chars!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: "iaas-api",
            audience: "iaas-web",
            claims: new[] { new Claim("sub", userId), new Claim("email", email), new Claim("role", role) },
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(string Email, string Password);
