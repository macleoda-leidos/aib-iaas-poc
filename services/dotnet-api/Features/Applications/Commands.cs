using MediatR;
using IAAS.Api.Data;
using IAAS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IAAS.Api.Features.Applications;

// ─── Commands ───────────────────────────────

public record CreateApplicationCommand : IRequest<ApplicationDto>;

public class CreateApplicationHandler : IRequestHandler<CreateApplicationCommand, ApplicationDto>
{
    private readonly IaasDbContext _db;
    public CreateApplicationHandler(IaasDbContext db) => _db = db;

    public async Task<ApplicationDto> Handle(CreateApplicationCommand request, CancellationToken ct)
    {
        var count = await _db.Applications.CountAsync(ct);
        var app = new Application
        {
            ReferenceNumber = $"IAAS-2026-{(count + 1).ToString().PadLeft(5, '0')}",
            Status = "draft"
        };
        _db.Applications.Add(app);
        await _db.SaveChangesAsync(ct);
        return new ApplicationDto(app.Id, app.ReferenceNumber, app.Status, app.CreatedAt);
    }
}

public record UpdateStatusCommand(string Id, string Status, string? Notes = null) : IRequest<ApplicationDto?>;

public class UpdateStatusHandler : IRequestHandler<UpdateStatusCommand, ApplicationDto?>
{
    private readonly IaasDbContext _db;
    public UpdateStatusHandler(IaasDbContext db) => _db = db;

    public async Task<ApplicationDto?> Handle(UpdateStatusCommand request, CancellationToken ct)
    {
        var app = await _db.Applications.FindAsync(new object[] { request.Id }, ct);
        if (app is null) return null;
        app.Status = request.Status;
        app.UpdatedAt = DateTime.UtcNow;
        if (request.Status == "submitted") app.SubmittedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new ApplicationDto(app.Id, app.ReferenceNumber, app.Status, app.UpdatedAt);
    }
}

// ─── Queries ────────────────────────────────

public record ListApplicationsQuery(int Page = 1, int PageSize = 20, string? Status = null) : IRequest<PagedResult<ApplicationDto>>;

public class ListApplicationsHandler : IRequestHandler<ListApplicationsQuery, PagedResult<ApplicationDto>>
{
    private readonly IaasDbContext _db;
    public ListApplicationsHandler(IaasDbContext db) => _db = db;

    public async Task<PagedResult<ApplicationDto>> Handle(ListApplicationsQuery request, CancellationToken ct)
    {
        var query = _db.Applications.AsQueryable();
        if (!string.IsNullOrEmpty(request.Status)) query = query.Where(a => a.Status == request.Status);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(a => new ApplicationDto(a.Id, a.ReferenceNumber, a.Status, a.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<ApplicationDto>(items, total, request.Page, request.PageSize);
    }
}

public record GetApplicationQuery(string Id) : IRequest<ApplicationDetailDto?>;

public class GetApplicationHandler : IRequestHandler<GetApplicationQuery, ApplicationDetailDto?>
{
    private readonly IaasDbContext _db;
    public GetApplicationHandler(IaasDbContext db) => _db = db;

    public async Task<ApplicationDetailDto?> Handle(GetApplicationQuery request, CancellationToken ct)
    {
        var app = await _db.Applications.Include(a => a.Applicant).Include(a => a.Debts).Include(a => a.Assets).Include(a => a.Recommendation)
            .FirstOrDefaultAsync(a => a.Id == request.Id || a.ReferenceNumber == request.Id, ct);
        if (app is null) return null;
        return new ApplicationDetailDto(app);
    }
}

// ─── DTOs ───────────────────────────────────

public record ApplicationDto(string Id, string ReferenceNumber, string Status, DateTime CreatedAt);
public record PagedResult<T>(List<T> Data, int TotalCount, int Page, int PageSize);
public record ApplicationDetailDto(Application App);

// ─── Endpoint Mapping ───────────────────────

public static class ApplicationEndpointExtensions
{
    public static void MapApplicationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/applications");

        group.MapGet("/", async (IMediator mediator, int page = 1, int pageSize = 20, string? status = null) =>
        {
            var result = await mediator.Send(new ListApplicationsQuery(page, pageSize, status));
            return Results.Ok(new { success = true, data = result.Data, meta = new { result.Page, result.PageSize, result.TotalCount } });
        });

        group.MapGet("/{id}", async (string id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetApplicationQuery(id));
            return result is null ? Results.NotFound(new { success = false }) : Results.Ok(new { success = true, data = result });
        });

        group.MapPost("/", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new CreateApplicationCommand());
            return Results.Created($"/api/applications/{result.Id}", new { success = true, data = result });
        });

        group.MapPatch("/{id}/status", async (string id, StatusUpdate update, IMediator mediator) =>
        {
            var result = await mediator.Send(new UpdateStatusCommand(id, update.Status, update.Notes));
            return result is null ? Results.NotFound() : Results.Ok(new { success = true, data = result });
        });
    }
}

public record StatusUpdate(string Status, string? Notes = null);
