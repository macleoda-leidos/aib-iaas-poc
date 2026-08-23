# EF Core Migration Strategy

## Current State
- Using `db.Database.EnsureCreated()` (creates schema but no migration history)
- SQLite for local development
- PostgreSQL for production (via appsettings.Production.json)

## Migration Commands

```bash
# Create initial migration
dotnet ef migrations add InitialCreate

# Apply migrations
dotnet ef database update

# Generate SQL script (for DBA review)
dotnet ef migrations script -o migration.sql
```

## Soft Delete Pattern
All entities implement ISoftDeletable:
- IsDeleted flag (default: false)
- DeletedAt timestamp (nullable)
- Global query filter excludes soft-deleted records
- Can be overridden with IgnoreQueryFilters()

## Concurrency
Application entity has a RowVersion/ConcurrencyToken:
- EF Core throws DbUpdateConcurrencyException on conflict
- Client must refresh and retry

## Indexes
Key performance indexes defined in OnModelCreating:
- Applications: status, reference_number, created_at
- Users: email (unique)
- AuditEvents: application_id, timestamp
- Organisations: type, status
