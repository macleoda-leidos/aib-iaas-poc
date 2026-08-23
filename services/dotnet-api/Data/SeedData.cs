using IAAS.Api.Models;

namespace IAAS.Api.Data;

public static class SeedData
{
    public static async Task Initialize(IaasDbContext db)
    {
        if (db.Roles.Any()) return; // Already seeded

        // Roles
        var roles = new[]
        {
            new Role { Id = "role-sysadmin", Name = "system_admin", DisplayName = "System Administrator", Level = 100 },
            new Role { Id = "role-senior", Name = "aib_senior_officer", DisplayName = "AiB Senior Officer", Level = 80 },
            new Role { Id = "role-officer", Name = "aib_officer", DisplayName = "AiB Case Officer", Level = 60 },
            new Role { Id = "role-adviser", Name = "money_adviser", DisplayName = "Money Adviser", Level = 50 },
            new Role { Id = "role-debtor", Name = "debtor", DisplayName = "Debtor", Level = 10 },
        };
        db.Roles.AddRange(roles);

        // Organisations
        db.Organisations.AddRange(
            new Organisation { Name = "Accountant in Bankruptcy", Type = "aib" },
            new Organisation { Name = "Citizens Advice Scotland", Type = "money_adviser" },
            new Organisation { Name = "Royal Bank of Scotland", Type = "creditor" },
            new Organisation { Name = "StepChange Scotland", Type = "money_adviser" },
            new Organisation { Name = "HM Revenue & Customs", Type = "government_agency" }
        );

        // Users
        db.Users.AddRange(
            new User { Email = "admin@aib-poc.example.com", FirstName = "Admin", LastName = "User", RoleId = "role-sysadmin", Status = "active" },
            new User { Email = "demo@example.com", FirstName = "Demo", LastName = "User", RoleId = "role-officer", Status = "active" },
            new User { Email = "adviser@cas.example.org", FirstName = "Karen", LastName = "MacLeod", RoleId = "role-adviser", Status = "active" },
            new User { Email = "john.testerton@example.com", FirstName = "John", LastName = "Testerton", RoleId = "role-debtor", Status = "active" }
        );

        await db.SaveChangesAsync();
    }
}
