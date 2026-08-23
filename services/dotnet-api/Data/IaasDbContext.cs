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
        // Map to existing Neon PostgreSQL schema (lowercase tables, snake_case columns)
        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("roles");
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.Name).HasColumnName("name");
            e.Property(r => r.DisplayName).HasColumnName("display_name");
            e.Property(r => r.Description).HasColumnName("description");
            e.Property(r => r.Level).HasColumnName("level");
            e.HasIndex(r => r.Name).IsUnique();
        });

        modelBuilder.Entity<Organisation>(e =>
        {
            e.ToTable("organisations");
            e.Property(o => o.Id).HasColumnName("id");
            e.Property(o => o.Name).HasColumnName("name");
            e.Property(o => o.Type).HasColumnName("type");
            e.Property(o => o.Status).HasColumnName("status");
        });

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.Property(u => u.Id).HasColumnName("id");
            e.Property(u => u.Email).HasColumnName("email");
            e.Property(u => u.FirstName).HasColumnName("first_name");
            e.Property(u => u.LastName).HasColumnName("last_name");
            e.Property(u => u.RoleId).HasColumnName("role_id");
            e.Property(u => u.Status).HasColumnName("status");
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Application>(e =>
        {
            e.ToTable("applications");
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.ReferenceNumber).HasColumnName("reference_number");
            e.Property(a => a.Status).HasColumnName("status");
            e.Property(a => a.AssignedTo).HasColumnName("assigned_to");
            e.Property(a => a.SubmittedAt).HasColumnName("submitted_at");
            e.Property(a => a.CreatedAt).HasColumnName("created_at");
            e.Property(a => a.UpdatedAt).HasColumnName("updated_at");
            e.Ignore(a => a.IsDeleted);
            e.Ignore(a => a.RowVersion);
            e.HasIndex(a => a.ReferenceNumber).IsUnique();
        });

        modelBuilder.Entity<Applicant>(e =>
        {
            e.ToTable("applicants");
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.ApplicationId).HasColumnName("application_id");
            e.Property(a => a.Title).HasColumnName("title");
            e.Property(a => a.FirstName).HasColumnName("first_name");
            e.Property(a => a.LastName).HasColumnName("last_name");
            e.Property(a => a.DateOfBirth).HasColumnName("date_of_birth");
            e.Property(a => a.NiNumber).HasColumnName("ni_number");
            e.Property(a => a.MaritalStatus).HasColumnName("marital_status");
            e.Property(a => a.Dependants).HasColumnName("dependants");
            e.Property(a => a.Employment).HasColumnName("employment");
            e.Property(a => a.Email).HasColumnName("email");
            e.Property(a => a.Phone).HasColumnName("phone");
        });

        modelBuilder.Entity<Debt>(e =>
        {
            e.ToTable("debts");
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.ApplicationId).HasColumnName("application_id");
            e.Property(d => d.Creditor).HasColumnName("creditor");
            e.Property(d => d.Type).HasColumnName("type");
            e.Property(d => d.Amount).HasColumnName("amount");
            e.Property(d => d.MonthlyPayment).HasColumnName("monthly_payment");
        });

        modelBuilder.Entity<Asset>(e =>
        {
            e.ToTable("assets");
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.ApplicationId).HasColumnName("application_id");
            e.Property(a => a.Type).HasColumnName("type");
            e.Property(a => a.Description).HasColumnName("description");
            e.Property(a => a.Value).HasColumnName("value");
            e.Property(a => a.Outstanding).HasColumnName("outstanding");
            e.Property(a => a.IsEssential).HasColumnName("is_essential");
        });

        modelBuilder.Entity<Recommendation>(e =>
        {
            e.ToTable("recommendations");
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.ApplicationId).HasColumnName("application_id");
            e.Property(r => r.Product).HasColumnName("product");
            e.Property(r => r.Confidence).HasColumnName("confidence");
            e.Property(r => r.ConfidencePct).HasColumnName("confidence_pct");
            e.Property(r => r.EngineVersion).HasColumnName("engine_version");
            e.Property(r => r.GeneratedAt).HasColumnName("generated_at");
        });

        modelBuilder.Entity<AuditEvent>(e =>
        {
            e.ToTable("audit_events");
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.ApplicationId).HasColumnName("application_id");
            e.Property(a => a.Action).HasColumnName("action");
            e.Property(a => a.ActorName).HasColumnName("actor_name");
            e.Property(a => a.ActorType).HasColumnName("actor_type");
            e.Property(a => a.Details).HasColumnName("details");
            e.Property(a => a.Timestamp).HasColumnName("timestamp");
        });
    }
}
