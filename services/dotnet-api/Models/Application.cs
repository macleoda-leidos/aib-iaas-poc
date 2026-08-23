namespace IAAS.Api.Models;

public class Application
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ReferenceNumber { get; set; } = "";
    public string Status { get; set; } = "draft";
    public string? AssignedTo { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Applicant? Applicant { get; set; }
    public List<Debt> Debts { get; set; } = new();
    public List<Asset> Assets { get; set; } = new();
    public Recommendation? Recommendation { get; set; }
}

public class Applicant
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ApplicationId { get; set; } = "";
    public string? Title { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateTime? DateOfBirth { get; set; }
    public string? NiNumber { get; set; }
    public string? MaritalStatus { get; set; }
    public int Dependants { get; set; }
    public string? Employment { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public Application Application { get; set; } = null!;
}

public class Debt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ApplicationId { get; set; } = "";
    public string Creditor { get; set; } = "";
    public string Type { get; set; } = "";
    public decimal Amount { get; set; }
    public decimal MonthlyPayment { get; set; }

    public Application Application { get; set; } = null!;
}

public class Asset
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ApplicationId { get; set; } = "";
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Value { get; set; }
    public decimal Outstanding { get; set; }
    public bool IsEssential { get; set; }

    public Application Application { get; set; } = null!;
}

public class Recommendation
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ApplicationId { get; set; } = "";
    public string Product { get; set; } = "";
    public string Confidence { get; set; } = "medium";
    public int ConfidencePct { get; set; }
    public string EngineVersion { get; set; } = "Rules v2.3";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
}

public class AuditEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? ApplicationId { get; set; }
    public string Action { get; set; } = "";
    public string? ActorName { get; set; }
    public string ActorType { get; set; } = "system";
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string RoleId { get; set; } = "";
    public string Status { get; set; } = "active";
    public Role Role { get; set; } = null!;
}

public class Role
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Description { get; set; }
    public int Level { get; set; }
}

public class Organisation
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Status { get; set; } = "active";
}
