namespace IAAS.Api.Data;

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}

public static class SoftDeleteExtensions
{
    public static IQueryable<T> ExcludeDeleted<T>(this IQueryable<T> query) where T : class, ISoftDeletable
        => query.Where(e => !e.IsDeleted);
}
