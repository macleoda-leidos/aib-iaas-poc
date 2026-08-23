using Microsoft.EntityFrameworkCore;
using IAAS.Api.Models;

namespace IAAS.Api.Data;

public class IaasDbContext : DbContext
{
    public IaasDbContext(DbContextOptions<IaasDbContext> options) : base(options) { }

    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Applicant> Applicants => Set<Applicant>();
    public DbSet<Debt> Debts => Set<Debt>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Recommendation> Recommendations => Set<Recommendation>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Organisation> Organisations => Set<Organisation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Application>().HasIndex(a => a.ReferenceNumber).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(r => r.Name).IsUnique();
    }
}
