using MediatR;
using IAAS.Api.Data;
using IAAS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IAAS.Api.Features.Users;

public record ListUsersQuery(string? Role = null, string? Status = null) : IRequest<List<User>>;

public class ListUsersHandler : IRequestHandler<ListUsersQuery, List<User>>
{
    private readonly IaasDbContext _db;
    public ListUsersHandler(IaasDbContext db) => _db = db;

    public async Task<List<User>> Handle(ListUsersQuery request, CancellationToken ct)
    {
        var query = _db.Users.Include(u => u.Role).AsQueryable();
        if (!string.IsNullOrEmpty(request.Role)) query = query.Where(u => u.Role.Name == request.Role);
        if (!string.IsNullOrEmpty(request.Status)) query = query.Where(u => u.Status == request.Status);
        return await query.ToListAsync(ct);
    }
}

public record ListRolesQuery : IRequest<List<Role>>;

public class ListRolesHandler : IRequestHandler<ListRolesQuery, List<Role>>
{
    private readonly IaasDbContext _db;
    public ListRolesHandler(IaasDbContext db) => _db = db;
    public async Task<List<Role>> Handle(ListRolesQuery request, CancellationToken ct) => await _db.Roles.OrderByDescending(r => r.Level).ToListAsync(ct);
}

public static class UserEndpointExtensions
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        app.MapGet("/api/users", async (IMediator mediator, string? role = null, string? status = null) =>
        {
            var result = await mediator.Send(new ListUsersQuery(role, status));
            return Results.Ok(new { success = true, data = result, meta = new { totalCount = result.Count } });
        });

        app.MapGet("/api/roles", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new ListRolesQuery());
            return Results.Ok(new { success = true, data = result });
        });
    }
}
