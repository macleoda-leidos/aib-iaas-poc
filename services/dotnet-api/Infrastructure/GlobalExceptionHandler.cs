using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;

namespace IAAS.Api.Infrastructure;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        var (statusCode, errorCode) = exception switch
        {
            ValidationException => (400, "VALIDATION_ERROR"),
            UnauthorizedAccessException => (401, "UNAUTHORIZED"),
            KeyNotFoundException => (404, "NOT_FOUND"),
            _ => (500, "INTERNAL_ERROR")
        };
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new { success = false, error = new { code = errorCode, message = exception.Message } }, ct);
        return true;
    }
}
