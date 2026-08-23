using MediatR;
using IAAS.Api.Data;
using IAAS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IAAS.Api.Features.Organisations;

public record ListOrganisationsQuery(string? Type = null, string? Status = null) : IRequest<List<Organisation>>;

public class ListOrganisationsHandler : IRequestHandler<ListOrganisationsQuery, List<Organisation>>
{
    private readonly IaasDbContext _db;
    public ListOrganisationsHandler(IaasDbContext db) => _db = db;

    public async Task<List<Organisation>> Handle(ListOrganisationsQuery request, CancellationToken ct)
    {
        var query = _db.Organisations.AsQueryable();
        if (!string.IsNullOrEmpty(request.Type)) query = query.Where(o => o.Type == request.Type);
        if (!string.IsNullOrEmpty(request.Status)) query = query.Where(o => o.Status == request.Status);
        return await query.OrderBy(o => o.Name).ToListAsync(ct);
    }
}

public static class OrganisationEndpointExtensions
{
    public static void MapOrganisationEndpoints(this WebApplication app)
    {
        app.MapGet("/api/organisations", async (IMediator mediator, string? type = null, string? status = null) =>
        {
            var result = await mediator.Send(new ListOrganisationsQuery(type, status));
            return Results.Ok(new { success = true, data = result, meta = new { totalCount = result.Count } });
        });
    }
}
