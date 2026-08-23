using MediatR;
namespace IAAS.Api.Features.Documents;

public record UploadDocumentCommand(string ApplicationId, string Filename, string Category, long Size) : IRequest<DocumentDto>;
public record DocumentDto(string Id, string ApplicationId, string Filename, string Category, string ScanStatus, DateTime UploadedAt);
public class UploadDocumentHandler : IRequestHandler<UploadDocumentCommand, DocumentDto>
{
    public Task<DocumentDto> Handle(UploadDocumentCommand r, CancellationToken ct) =>
        Task.FromResult(new DocumentDto(Guid.NewGuid().ToString(), r.ApplicationId, r.Filename, r.Category, "clean", DateTime.UtcNow));
}
public static class DocumentEndpointExtensions
{
    public static void MapDocumentEndpoints(this WebApplication app)
    {
        app.MapPost("/api/documents/upload", async (UploadDocumentCommand cmd, IMediator mediator) => Results.Ok(new { success = true, data = await mediator.Send(cmd) }));
    }
}
