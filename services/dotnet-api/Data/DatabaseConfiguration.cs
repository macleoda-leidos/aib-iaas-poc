using Microsoft.EntityFrameworkCore;
using IAAS.Api.Models;

namespace IAAS.Api.Data;

public static class DatabaseConfiguration
{
    public static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        // Performance indexes
        modelBuilder.Entity<Application>().HasIndex(a => a.Status);
        modelBuilder.Entity<Application>().HasIndex(a => a.ReferenceNumber).IsUnique();
        modelBuilder.Entity<Application>().HasIndex(a => a.CreatedAt);
        
        modelBuilder.Entity<AuditEvent>().HasIndex(a => a.ApplicationId);
        modelBuilder.Entity<AuditEvent>().HasIndex(a => a.Timestamp);
        modelBuilder.Entity<AuditEvent>().HasIndex(a => a.Action);
        
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(r => r.Name).IsUnique();
        
        modelBuilder.Entity<Organisation>().HasIndex(o => o.Type);
        modelBuilder.Entity<Organisation>().HasIndex(o => o.Status);
    }

    public static void ConfigureSoftDelete(ModelBuilder modelBuilder)
    {
        // Global query filters for soft delete
        modelBuilder.Entity<Application>().HasQueryFilter(a => !a.IsDeleted);
    }

    public static void ConfigureConcurrency(ModelBuilder modelBuilder)
    {
        // Optimistic concurrency on Application
        modelBuilder.Entity<Application>()
            .Property(a => a.RowVersion)
            .IsRowVersion();
    }
}
