# Data Model

## Entity Relationship Overview

```
Application (1) ──── (1) DebtorDetails
     │
     ├── (1) ApplicantDetails
     ├── (1..*) Address
     ├── (1) ContactDetails
     ├── (1) DebtSummary ──── (1..*) Debt
     ├── (1) Income
     ├── (1) Expenditure
     ├── (1) HouseholdComposition
     ├── (0..*) Asset
     ├── (0..*) DocumentReference
     ├── (0..1) CreditCheckResult
     ├── (0..*) ExistingCaseCheck
     ├── (0..1) ProductRecommendation
     ├── (0..1) PaymentStatus
     ├── (0..*) StaffNote
     └── (0..*) AuditEvent
```

## Core Entities

### Application
The central entity tracking an IAAS application from creation to completion.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| referenceNumber | string | Human-readable ref (IAAS-YYYY-NNNNN) |
| status | enum | draft → submitted → under_review → recommendation_issued → accepted/rejected |
| createdAt | datetime | Application creation timestamp |
| updatedAt | datetime | Last modification timestamp |
| submittedAt | datetime | When formally submitted |

### DebtorDetails
Personal information about the individual seeking debt advice.

| Field | Type | Validation |
|-------|------|------------|
| title | enum | Mr/Mrs/Ms/Miss/Dr/Prof/Rev |
| firstName | string | 1-100 chars, required |
| lastName | string | 1-100 chars, required |
| dateOfBirth | date | ISO format, must be 16+ |
| nationalInsuranceNumber | string | Pattern: XX999999X |
| maritalStatus | enum | single/married/civil_partnership/divorced/widowed/separated |
| dependants | integer | 0-20 |
| employmentStatus | enum | employed/self_employed/unemployed/retired/student/other |

### Financial Summary
Combined income, expenditure, and debt information.

| Derived Field | Calculation |
|--------------|-------------|
| totalMonthlyIncome | wages + benefits + pension + otherIncome |
| totalMonthlyExpenditure | sum of all expenditure categories |
| disposableIncome | totalMonthlyIncome - totalMonthlyExpenditure |
| debtToIncomeRatio | totalDebt / (totalMonthlyIncome * 12) |
| monthsToRepay | totalDebt / disposableIncome (if > 0) |

### ProductRecommendation
Output of the rules engine.

| Field | Type | Description |
|-------|------|-------------|
| recommendedProduct | enum | The primary recommended AiB product |
| confidence | enum | high/medium/low based on rule match clarity |
| reasoning | string[] | Human-readable explanation of decision |
| alternativeProducts | enum[] | Other potentially suitable products |
| factors | Factor[] | Weighted input factors that influenced decision |

## Data Classification

| Category | Classification | Handling |
|----------|---------------|----------|
| Personal details | OFFICIAL-SENSITIVE | Encrypted at rest, access-controlled |
| Financial data | OFFICIAL-SENSITIVE | Encrypted, audit-logged access |
| NI Number | OFFICIAL-SENSITIVE | Masked in logs, encrypted storage |
| Documents | OFFICIAL-SENSITIVE | Virus-scanned, encrypted S3 |
| Audit events | OFFICIAL | Immutable, retained per policy |
| Recommendations | OFFICIAL | Linked to application |

## POC Data Storage

In the POC, all data is stored in SQLite as JSON documents within the `applications` table. This provides:
- Zero-configuration setup
- Single-file database (easy to backup/reset)
- Full SQL query capability
- Clear migration path to PostgreSQL

The `data` column contains the full application JSON, while indexed columns (`status`, `reference_number`) support efficient querying.
