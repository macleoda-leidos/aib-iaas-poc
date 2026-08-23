using MediatR;
using IAAS.Api.Data;
using IAAS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IAAS.Api.Features.Audit;

public record CreateAuditEventCommand(string? ApplicationId, string Action, string? ActorName, string ActorType, string? Details) : IRequest<AuditEvent>;

public class CreateAuditEventHandler : IRequestHandler<CreateAuditEventCommand, AuditEvent>
{
    private readonly IaasDbContext _db;
    public CreateAuditEventHandler(IaasDbContext db) => _db = db;

    public async Task<AuditEvent> Handle(CreateAuditEventCommand request, CancellationToken ct)
    {
        var evt = new AuditEvent { ApplicationId = request.ApplicationId, Action = request.Action, ActorName = request.ActorName, ActorType = request.ActorType, Details = request.Details };
        _db.AuditEvents.Add(evt);
        await _db.SaveChangesAsync(ct);
        return evt;
    }
}

public record GetAuditEventsQuery(string? ApplicationId = null, string? Action = null, string? ActorType = null, int Limit = 50) : IRequest<List<AuditEvent>>;

public class GetAuditEventsHandler : IRequestHandler<GetAuditEventsQuery, List<AuditEvent>>
{
    private readonly IaasDbContext _db;
    public GetAuditEventsHandler(IaasDbContext db) => _db = db;

    public async Task<List<AuditEvent>> Handle(GetAuditEventsQuery request, CancellationToken ct)
    {
        var query = _db.AuditEvents.AsQueryable();
        if (!string.IsNullOrEmpty(request.ApplicationId)) query = query.Where(e => e.ApplicationId == request.ApplicationId);
        if (!string.IsNullOrEmpty(request.Action)) query = query.Where(e => e.Action == request.Action);
        if (!string.IsNullOrEmpty(request.ActorType)) query = query.Where(e => e.ActorType == request.ActorType);
        return await query.OrderByDescending(e => e.Timestamp).Take(request.Limit).ToListAsync(ct);
    }
}

public static class AuditEndpointExtensions
{
    public static void MapAuditEndpoints(this WebApplication app)
    {
        app.MapPost("/api/audit/events", async (CreateAuditEventCommand cmd, IMediator mediator) =>
        {
            var result = await mediator.Send(cmd);
            return Results.Created($"/api/audit/events/{result.Id}", new { success = true, data = result });
        });

        app.MapGet("/api/audit/events/{applicationId}", async (string applicationId, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetAuditEventsQuery(ApplicationId: applicationId));
            return Results.Ok(new { success = true, data = result });
        });

        app.MapGet("/api/audit/events", async (IMediator mediator, string? action = null, string? actorType = null, int limit = 50) =>
        {
            var result = await mediator.Send(new GetAuditEventsQuery(Action: action, ActorType: actorType, Limit: limit));
            return Results.Ok(new { success = true, data = result, meta = new { count = result.Count } });
        });
    }
}
