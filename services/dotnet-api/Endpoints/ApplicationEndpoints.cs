using Microsoft.EntityFrameworkCore;
using IAAS.Api.Data;
using IAAS.Api.Models;

namespace IAAS.Api.Endpoints;

public static class ApplicationEndpoints
{
    public static void MapApplicationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/applications");

        group.MapGet("/", async (IaasDbContext db, int page = 1, int pageSize = 20) =>
        {
            var total = await db.Applications.CountAsync();
            var apps = await db.Applications
                .Include(a => a.Applicant)
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Results.Ok(new { success = true, data = apps, meta = new { page, pageSize, totalCount = total } });
        });

        group.MapGet("/{id}", async (string id, IaasDbContext db) =>
        {
            var app = await db.Applications
                .Include(a => a.Applicant)
                .Include(a => a.Debts)
                .Include(a => a.Assets)
                .Include(a => a.Recommendation)
                .FirstOrDefaultAsync(a => a.Id == id || a.ReferenceNumber == id);

            return app is null
                ? Results.NotFound(new { success = false, error = new { code = "NOT_FOUND" } })
                : Results.Ok(new { success = true, data = app });
        });

        group.MapPost("/", async (IaasDbContext db) =>
        {
            var count = await db.Applications.CountAsync();
            var application = new Application
            {
                ReferenceNumber = $"IAAS-2026-{(count + 1).ToString().PadLeft(5, '0')}",
                Status = "draft"
            };
            db.Applications.Add(application);
            await db.SaveChangesAsync();

            return Results.Created($"/api/applications/{application.Id}",
                new { success = true, data = new { application.Id, application.ReferenceNumber, application.Status, application.CreatedAt } });
        });

        group.MapPatch("/{id}/status", async (string id, StatusUpdate update, IaasDbContext db) =>
        {
            var app = await db.Applications.FindAsync(id);
            if (app is null) return Results.NotFound();
            app.Status = update.Status;
            app.UpdatedAt = DateTime.UtcNow;
            if (update.Status == "submitted") app.SubmittedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(new { success = true, data = new { app.Id, app.Status, app.UpdatedAt } });
        });
    }
}

public record StatusUpdate(string Status, string? Notes = null);
