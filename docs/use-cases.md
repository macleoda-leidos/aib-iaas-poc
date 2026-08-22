# IAAS Use Cases

> **Project:** AiB Initial Application Advice Service (IAAS)
> **Version:** 1.0 | **Date:** 2026-08-19
> **Status:** Baselined for POC delivery

---

## UC-01: Citizen Completes Application

| Field | Value |
|-------|-------|
| Primary Actor | Citizen |
| Secondary Actors | Recommendation Service, Payment Service, Credit Check Service, Integration Orchestrator |
| Preconditions | Citizen has an active ScotAccount or GOV.UK Login; citizen is not currently bankrupt (undischarged) |
| Trigger | Citizen clicks "Start application" on the IAAS portal |
| Priority | Must |

### Main Flow
1. Citizen authenticates via ScotAccount or GOV.UK Login.
2. System creates a new application in DRAFT status and generates a unique reference number (AiB-YYYY-NNNNNN).
3. Citizen enters personal details (full name, DOB, NINO, contact email, phone number).
4. System validates personal details against Zod schema and stores them.
5. Citizen searches for address by postcode and selects from results (or enters manually).
6. System stores address and presents the debts capture screen.
7. Citizen adds debt entries (creditor, type, balance, monthly payment) one by one.
8. System calculates and displays total debt.
9. Citizen enters income sources with frequency and amounts.
10. System normalises all income to monthly equivalents and displays total.
11. Citizen enters expenditure by CFS category.
12. System calculates disposable income (income minus expenditure) and displays summary.
13. Citizen declares assets (property, vehicles, savings, investments).
14. System stores asset data and presents financial summary for review.
15. Citizen confirms financial data or navigates back to amend.
16. Citizen uploads supporting documents (ID, payslips, bank statements).
17. System scans each document for viruses and stores on success.
18. System triggers automated checks: credit check, BASYS, eDEN, DAS, CFT, Moratorium, RoI.
19. System displays check results in plain language.
20. Recommendation engine evaluates all data against product eligibility rules.
21. System displays primary recommendation with confidence score and rationale.
22. Citizen reviews recommendation and alternatives, selects to proceed.
23. System checks fee applicability; if fee required, citizen makes payment.
24. Payment service processes transaction and returns confirmation.
25. Citizen clicks "Submit application" and confirms the declaration.
26. System changes status to SUBMITTED, sends confirmation email, and displays receipt.

### Alternative Flows
- **AF1: Save and Resume** — At any step (3-22), the citizen clicks "Save and come back later". System persists current state and returns to dashboard. On next login, citizen resumes at last incomplete step.
- **AF2: Fee Exemption** — At step 23, if the citizen is on qualifying benefits, the system waives the fee and proceeds directly to step 25.
- **AF3: Adviser-Assisted** — A money adviser performs steps 1-26 on behalf of the citizen, with an additional declaration of authority captured at step 2.
- **AF4: Citizen Selects Alternative Product** — At step 22, the citizen selects an alternative product instead of the primary recommendation. System records the citizen's choice and proceeds.

### Exception Flows
- **EF1: Identity Verification Failure** — At step 1, if authentication fails three times, system locks the attempt for 30 minutes and displays contact details for phone support.
- **EF2: Virus Detected in Upload** — At step 17, if a virus is detected, the file is quarantined, the citizen is notified to upload a clean copy, and the application cannot proceed until a clean document is provided.
- **EF3: System Check Service Unavailable** — At step 18, if a check service is unavailable after retry, the system marks that check as "Unavailable" and allows the application to proceed with a note for case officer manual verification.
- **EF4: Payment Failure** — At step 24, if payment is declined, the citizen is shown the decline reason and offered retry or alternative payment method.

### Post-Conditions
- Application record exists in SUBMITTED status with all captured data, documents, check results, and recommendation.
- Audit trail contains all step completions with timestamps.
- Citizen receives confirmation email with reference number and expected timelines.
- Application appears in the case management work queue for assignment.

### Business Rules
- Total debt must be at least £1,500 for most products (except signposting).
- Citizen must be domiciled in Scotland or have a Scottish connection.
- Application drafts expire after 90 days of inactivity.
- Maximum 20 documents per application, each under 10MB.

---

## UC-02: Identity Verification via ScotAccount

| Field | Value |
|-------|-------|
| Primary Actor | Citizen |
| Secondary Actors | ScotAccount Identity Provider, IAAS Authentication Service |
| Preconditions | Citizen has a ScotAccount with verified identity (Level 2+) |
| Trigger | Citizen clicks "Sign in with ScotAccount" on the IAAS login page |
| Priority | Must |

### Main Flow
1. Citizen navigates to IAAS portal and clicks "Sign in with ScotAccount".
2. System generates an OIDC authorisation request and redirects to ScotAccount IdP.
3. Citizen authenticates at ScotAccount (username/password + any MFA configured there).
4. ScotAccount validates credentials and presents consent screen for IAAS data sharing.
5. Citizen grants consent.
6. ScotAccount redirects back to IAAS with an authorisation code.
7. IAAS backend exchanges the code for access and ID tokens.
8. System extracts identity claims (name, DOB, email, identity assurance level).
9. System checks if a local user record exists for the ScotAccount subject ID.
10. If no record exists, system creates a new user record with Citizen role.
11. System creates a session (JWT) with 30-minute idle timeout and redirects to dashboard.
12. Citizen sees their personalised dashboard with any existing applications.

### Alternative Flows
- **AF1: Existing User** — At step 9, if the user record already exists, system updates last login timestamp and proceeds to step 11.
- **AF2: GOV.UK Login** — Citizen selects GOV.UK Login instead. Flow is identical but uses the GOV.UK OIDC provider with different claim mappings.
- **AF3: Account Linking** — At step 9, if the citizen previously registered via a different IdP, system detects the match by email and offers to link accounts.

### Exception Flows
- **EF1: ScotAccount Unavailable** — At step 2, if ScotAccount is unreachable, system displays a service unavailability message with retry guidance and phone contact option.
- **EF2: Consent Denied** — At step 5, if the citizen denies consent, ScotAccount redirects back with an error. System displays a message explaining that consent is required to proceed.
- **EF3: Token Exchange Failure** — At step 7, if the code exchange fails (expired, replayed), system logs the error and asks the citizen to try again.
- **EF4: Identity Assurance Too Low** — At step 8, if the identity assurance level is below Level 2, system informs the citizen they need to upgrade their ScotAccount verification before using IAAS.

### Post-Conditions
- Citizen has an active session with a valid JWT.
- User record exists in IAAS database linked to ScotAccount subject ID.
- Audit log records: login event, IdP used, timestamp, IP address.

### Business Rules
- Identity assurance Level 2 or above is required for insolvency applications.
- Sessions idle-timeout after 30 minutes (citizen) or 15 minutes (staff).
- Failed login attempts are rate-limited at the IdP level; IAAS logs all outcomes.
- Consent scope includes: openid, profile, email (minimum required claims).

---

## UC-03: System Generates Product Recommendation

| Field | Value |
|-------|-------|
| Primary Actor | Recommendation Service (automated) |
| Secondary Actors | Citizen, Credit Check Service, Integration Orchestrator |
| Preconditions | Application has completed all data capture steps (personal details, financial assessment, documents) and system checks have returned |
| Trigger | All system checks complete successfully (or marked unavailable) and the application reaches the recommendation step |
| Priority | Must |

### Main Flow
1. API Gateway sends recommendation request to Recommendation Service with application ID.
2. Recommendation Service retrieves full application data: financial summary, system check results, and demographic information.
3. Service loads the current active ruleset (versioned, with effective date).
4. Service evaluates eligibility criteria for each of the 7 products in sequence: Moratorium, DAS (DPP), MAP, PTD, Sequestration, DPP (variation), Signposting Advice.
5. For each eligible product, service calculates a suitability score based on weighted factors (debt level, disposable income, asset profile, existing arrangements).
6. Service ranks eligible products by suitability score.
7. Service selects the highest-scoring product as the primary recommendation.
8. Service generates a plain-language rationale explaining the top 3 contributing factors.
9. Service returns: primary recommendation, confidence percentage, rationale text, and ranked alternatives.
10. API Gateway stores the recommendation against the application.
11. Citizen is presented with the recommendation, rationale, and alternatives on the portal.

### Alternative Flows
- **AF1: Single Eligible Product** — At step 6, if only one product is eligible, it becomes the primary recommendation with no alternatives shown (confidence typically >90%).
- **AF2: No Eligible Product** — At step 4, if no products meet eligibility criteria, the system recommends "Signposting Advice" with guidance to seek specialist help.
- **AF3: Equal Scoring** — At step 6, if two products score identically, the system applies a tiebreaker hierarchy (statutory > voluntary > signposting) and notes the close match in the rationale.

### Exception Flows
- **EF1: Missing Data** — At step 2, if required financial data is incomplete, the service returns an error and the citizen is directed back to complete missing steps.
- **EF2: Rule Engine Failure** — At step 4, if the rules engine encounters an unhandled scenario, the service logs the error, returns a "manual review required" status, and the application is flagged for case officer assessment.
- **EF3: Stale System Checks** — At step 2, if system checks are older than 24 hours, the service triggers a refresh before proceeding.

### Post-Conditions
- Recommendation record stored with: product, confidence score, rule version, input data hash, timestamp.
- Audit trail records the full recommendation event for regulatory compliance.
- Citizen can view and act upon the recommendation.

### Business Rules
- Minimum debt of £1,500 for DAS/MAP/PTD; minimum £3,000 for sequestration.
- Disposable income > £0 required for DAS/DPP; no surplus needed for MAP/Sequestration.
- Active moratorium restricts eligible products to those compatible with the protection period.
- Confidence scores below 60% trigger automatic case officer review regardless of citizen action.
- Rule versions are immutable once effective; changes create new versions.

---

## UC-04: Case Officer Reviews Application

| Field | Value |
|-------|-------|
| Primary Actor | Case Officer |
| Secondary Actors | Citizen, Senior Officer, System (notifications) |
| Preconditions | Application is in SUBMITTED status and has been assigned to the case officer's work queue |
| Trigger | Case officer selects an application from their queue or receives a notification of new assignment |
| Priority | Must |

### Main Flow
1. Case officer logs into the admin portal and navigates to their work queue.
2. System displays assigned applications sorted by SLA urgency (nearest deadline first).
3. Case officer selects an application to review.
4. System displays the complete application: personal details, address, financial summary, documents, system check results, and recommendation.
5. Case officer reviews each section, checking for completeness, consistency, and plausibility.
6. Case officer opens and reviews uploaded documents against declared information.
7. Case officer reviews system check results for any flags or matches.
8. Case officer reviews the recommendation and rationale, assessing whether it is appropriate.
9. Case officer is satisfied and clicks "Approve".
10. System changes status to APPROVED, records the officer's decision with timestamp.
11. System sends notification to the citizen confirming approval.
12. System triggers downstream updates (e.g., BASYS record creation for sequestration).

### Alternative Flows
- **AF1: Request More Information** — At step 5-8, if the officer identifies a gap, they click "Request more info", specify what is needed, and set a deadline. Status changes to AWAITING_INFO. Citizen is notified.
- **AF2: Reject Application** — At step 9, if the officer determines ineligibility, they click "Reject", select reason code(s), add notes. Status changes to REJECTED. Citizen is notified with reasons.
- **AF3: Override Recommendation** — At step 8, if the officer disagrees with the system recommendation, they click "Override", select a different product, provide justification. Override is flagged for senior officer countersignature.
- **AF4: Escalate to Senior Officer** — At any step, if the case is complex or high-value, the officer clicks "Escalate". The application moves to the senior officer queue with the case officer's notes.

### Exception Flows
- **EF1: SLA Breach Imminent** — If the application is within 24 hours of SLA breach, system displays a warning banner and sends alert to team leader.
- **EF2: Document Unreadable** — At step 6, if a document cannot be opened, officer reports a technical issue. System logs the fault and creates a support ticket.
- **EF3: System Check Data Stale** — At step 7, if checks are older than 7 days, officer can request a re-run of specific checks.

### Post-Conditions
- Application status is updated to APPROVED, REJECTED, or AWAITING_INFO.
- Decision is recorded in audit trail with: officer ID, timestamp, decision, and any notes.
- Citizen is notified of the outcome via their preferred channel.
- If approved, downstream system integrations are triggered.

### Business Rules
- Applications must be reviewed within 10 working days of submission (SLA).
- Recommendation overrides require senior officer countersignature within 2 working days.
- Officers cannot review applications from the same household or known contacts (conflict of interest check).
- All decisions must have an associated reason (approval: implicit product confirmation; rejection: mandatory reason codes).

---

## UC-05: Cross-System Debtor Search

| Field | Value |
|-------|-------|
| Primary Actor | Case Officer |
| Secondary Actors | BASYS, eDEN, DAS Register, CFT Register, Moratorium Register, Register of Insolvencies |
| Preconditions | User has search permission (Case Officer, Senior Officer, or Operations Manager role) |
| Trigger | User enters search criteria and clicks "Search" in the unified search interface |
| Priority | Must |

### Main Flow
1. Case officer navigates to the cross-system search page.
2. Officer enters search criteria: surname (required), plus optional first name, date of birth, postcode, or reference number.
3. System validates that at least surname is provided and no more than 100 characters per field.
4. System dispatches parallel search requests to all 6 connected systems via the Integration Orchestrator.
5. Each system returns results (or empty) within a 10-second timeout.
6. Integration Orchestrator aggregates results, deduplicates by confidence-weighted matching, and ranks by match score.
7. System displays results grouped by source system, with match confidence percentage and key identifiers (name, DOB, reference, status).
8. Officer clicks on a result to expand inline detail (case type, status, dates, assigned office).
9. Officer identifies the relevant record and links it to their current case (if applicable).
10. System logs the search event and any record access in the audit trail.

### Alternative Flows
- **AF1: No Results Found** — At step 6, if no systems return matches, display "No records found" with guidance on broadening search criteria.
- **AF2: Partial System Failure** — At step 5, if one or more systems timeout, display available results with a banner indicating which systems were unreachable, and offer a "Retry unavailable systems" button.
- **AF3: Reference Number Search** — At step 2, if the officer enters only a reference number, system queries only the system matching that reference format (e.g., AiB-xxxx goes to BASYS).

### Exception Flows
- **EF1: All Systems Unavailable** — At step 5, if all systems fail, display an error message recommending the officer try again later or contact IT support.
- **EF2: Excessive Results** — At step 6, if more than 200 results are returned, display the top 50 by confidence with a message to refine search criteria.
- **EF3: Unauthorised Access Attempt** — At step 1, if a user without search permission accesses the page, system returns 403 and logs the attempt.

### Post-Conditions
- Search results are displayed to the user (not persisted beyond the session).
- Audit trail records: user ID, search terms, systems queried, number of results, any records accessed in detail.

### Business Rules
- Fuzzy matching uses Soundex and Levenshtein distance for name variations; threshold configurable (default: 70% match).
- Search results must not display full NINO or sensitive data in the list view (masked: ***1234).
- Users may only access detailed records for systems they are authorised for (role-based system access).
- Bulk searches (>10 per hour by one user) trigger a security alert for review.

---

## UC-06: Digital Mailroom Processes Court Decree

| Field | Value |
|-------|-------|
| Primary Actor | Digital Mailroom System (automated) |
| Secondary Actors | Mailroom Operator, Case Officer, OCR Service, NER Service |
| Preconditions | Physical post has been received and batch-scanned into the system |
| Trigger | Scanned document image arrives in the mailroom processing queue |
| Priority | Could |

### Main Flow
1. Mailroom operator feeds physical post through the batch scanner.
2. Scanner produces high-resolution images (300 DPI minimum) and submits to the processing queue.
3. OCR service processes each image, extracting text with confidence scoring per word.
4. System evaluates overall OCR confidence; if above 95%, proceeds automatically.
5. NER (Named Entity Recognition) service identifies key entities: court name, decree date, debtor name, case reference, monetary amounts.
6. Classification service analyses extracted text and entities to determine document type; identifies this as a "Court Decree".
7. System searches for a matching case using extracted debtor name and case reference.
8. System links the document to the matching case.
9. System creates a high-priority task on the case: "Court Decree Received — action within 2 working days".
10. Case officer is notified of the new task.
11. Document is stored as searchable PDF in the case document repository.

### Alternative Flows
- **AF1: Low OCR Confidence** — At step 4, if confidence is below 95%, the document is routed to the mailroom operator for manual text verification and correction.
- **AF2: Classification Uncertain** — At step 6, if classification confidence is below 85%, the document enters a manual triage queue for operator categorisation.
- **AF3: No Case Match** — At step 7, if no case match is found, the document is placed in an "Unmatched" queue for manual linking by a mailroom operator.
- **AF4: Non-Court Document** — At step 6, if classified as a different type (creditor claim, debtor letter), routing rules appropriate to that type are applied instead.

### Exception Flows
- **EF1: Scanner Failure** — At step 2, if the scanner produces corrupt images, operator is alerted to re-scan the batch.
- **EF2: OCR Service Unavailable** — At step 3, if OCR is unavailable, documents queue with automatic retry every 15 minutes.
- **EF3: Duplicate Document** — At step 8, if the system detects a document with matching content already linked to the case, it flags as potential duplicate for operator review.

### Post-Conditions
- Court decree is stored as searchable PDF linked to the correct case.
- High-priority task exists on the case with statutory deadline.
- Audit trail records the full processing chain: scan time, OCR time, classification, routing.
- Case officer has been notified.

### Business Rules
- Court decrees carry statutory deadlines; the system must create tasks reflecting the required response timeframe.
- Documents must be retained for 7 years minimum per AiB retention policy.
- All OCR'd text is classified as OFFICIAL-SENSITIVE and encrypted at rest.
- Manual overrides of automatic classification/routing are logged for quality assurance.

---

## UC-07: Policy Officer Tests Rule Change (Policy Simulation)

| Field | Value |
|-------|-------|
| Primary Actor | Policy Manager |
| Secondary Actors | Recommendation Service, Rules Engine, Reporting Service |
| Preconditions | Policy manager has "Rules Management" permission; a draft rule change has been prepared |
| Trigger | Policy manager clicks "Simulate" on a draft rule change in the Rules Management Console |
| Priority | Could |

### Main Flow
1. Policy manager navigates to the Rules Management Console.
2. Policy manager selects an existing rule to modify (e.g., "Minimum debt threshold for MAP").
3. System displays the current rule definition with effective date and version number.
4. Policy manager edits the rule parameters (e.g., changes threshold from £1,500 to £1,000).
5. Policy manager clicks "Simulate impact".
6. System prompts for simulation parameters: date range (default: last 6 months), sample size (default: 1,000 most recent applications).
7. Policy manager confirms parameters and initiates simulation.
8. System replays selected historical applications against the modified rule set (in a sandboxed environment).
9. System compares original outcomes with simulated outcomes for each application.
10. System generates an impact report: number of applications affected, breakdown by product change (e.g., "47 applications would change from Signposting to MAP"), demographic breakdown, confidence distribution shift.
11. Policy manager reviews the report.
12. Policy manager decides to proceed (schedule rule for activation) or discard the draft.

### Alternative Flows
- **AF1: No Impact Detected** — At step 10, if zero applications would be affected, system reports "No impact detected" and suggests testing with a broader date range.
- **AF2: Major Impact Warning** — At step 10, if more than 20% of applications are affected, system displays a warning recommending senior policy review before activation.
- **AF3: Schedule for Future Date** — At step 12, if the policy manager proceeds, they set an activation date. The rule becomes "Pending" until that date.

### Exception Flows
- **EF1: Simulation Timeout** — At step 8, if simulation exceeds 5 minutes, system offers to run asynchronously and email results.
- **EF2: Data Quality Issue** — At step 8, if historical applications have missing data that prevents evaluation, those cases are excluded and the count is reported.
- **EF3: Rule Conflict** — At step 4, if the modified rule conflicts with another active rule, system alerts the policy manager to resolve the conflict before simulation.

### Post-Conditions
- Simulation results are stored for 90 days for audit and comparison.
- If rule is scheduled, it enters "Pending" status with activation date.
- Audit trail records: who ran the simulation, parameters, summary results, and decision.

### Business Rules
- Simulations run in a read-only sandbox; no production data is modified.
- Only one rule change may be simulated at a time to avoid interaction effects (unless batch mode is explicitly enabled).
- Activated rules apply only to applications started after the effective date (no retrospective application).
- All rule changes require a second policy officer to approve before activation (four-eyes principle).

---

## UC-08: Staff Sends Correspondence

| Field | Value |
|-------|-------|
| Primary Actor | Case Officer |
| Secondary Actors | Citizen/Adviser, Correspondence Template Service, Notification Service |
| Preconditions | Case officer has an active case assignment; correspondence templates exist for the selected type |
| Trigger | Case officer clicks "Send correspondence" from the case management screen |
| Priority | Should |

### Main Flow
1. Case officer opens the case and clicks "Send correspondence".
2. System displays available correspondence templates filtered by case type and status.
3. Case officer selects a template (e.g., "Request for additional documentation").
4. System renders the template with merge fields populated from case data (applicant name, reference, address, specific details).
5. Case officer reviews the pre-populated letter and edits free-text sections where applicable.
6. Case officer selects delivery channel: email, letter (print), or both.
7. Case officer clicks "Send".
8. System generates the final document (PDF for print, HTML for email).
9. System dispatches via selected channel(s): email sent immediately; print job queued for batch printing.
10. System stores a copy of the correspondence against the case.
11. Case timeline is updated with the correspondence event.
12. If the correspondence requests action from the citizen, a task is created with a response deadline.

### Alternative Flows
- **AF1: Bulk Correspondence** — At step 1, if the officer selects multiple cases, system enters bulk mode where one template is applied to many cases with individual merge data.
- **AF2: Custom Letter (No Template)** — At step 3, if no suitable template exists, officer selects "Custom letter" and types from scratch. Custom letters require senior officer approval before sending.
- **AF3: Citizen Communication Preference** — At step 6, if the citizen has specified a preferred channel, system pre-selects it and warns if the officer selects otherwise.

### Exception Flows
- **EF1: Missing Merge Data** — At step 4, if a required merge field has no data (e.g., missing address), system highlights the gap and blocks sending until resolved.
- **EF2: Email Delivery Failure** — At step 9, if email bounces, system records the failure, alerts the officer, and suggests postal delivery.
- **EF3: Template Error** — At step 4, if template rendering fails due to a syntax error, system displays a technical error and logs for admin resolution.

### Post-Conditions
- Correspondence record stored against the case with full content, channel, and timestamp.
- Citizen receives the communication via selected channel.
- Case timeline reflects the event.
- If action required, a response deadline is tracked.

### Business Rules
- All outbound correspondence must include the case reference number and a contact point.
- Print correspondence is batched and posted at end of business day.
- Statutory notices have mandated content that cannot be edited (template sections marked as locked).
- Correspondence is retained for the life of the case plus 7 years.

---

## UC-09: Money Adviser Submits on Behalf of Client

| Field | Value |
|-------|-------|
| Primary Actor | Money Adviser |
| Secondary Actors | Citizen (client), API Gateway, Recommendation Service |
| Preconditions | Money adviser is authenticated with an active organisation membership; client has provided authority to act |
| Trigger | Money adviser clicks "New application on behalf of client" from their dashboard |
| Priority | Must |

### Main Flow
1. Money adviser logs in via their organisation's federated SSO or IAAS credentials.
2. Adviser navigates to dashboard and clicks "New application on behalf of client".
3. System prompts for the client's basic details (name, DOB, contact info) and a declaration of authority.
4. Adviser enters client details and confirms the authority declaration (with date of authority).
5. System creates the application in DRAFT status, linked to both the adviser (submitter) and client (applicant).
6. Adviser completes the application wizard (steps 3-22 from UC-01) entering data obtained from the client.
7. System applies the same validation rules as citizen self-service.
8. At the recommendation step, the adviser reviews the recommendation with professional context.
9. Adviser selects the appropriate product (may differ from primary recommendation if professionally justified).
10. If payment is required and the client is not exempt, adviser records payment (client pays separately, or adviser organisation's account is charged).
11. Adviser submits the application with a secondary declaration confirming accuracy.
12. System records the submission with clear identification of adviser involvement.
13. Confirmation is sent to both the adviser and the client (if client email provided).

### Alternative Flows
- **AF1: Client Completes Partially** — At any step, if the client starts the application themselves and then grants adviser access, the adviser can "Take over" the existing draft.
- **AF2: Client Revokes Authority** — At any point before submission, if the client notifies AiB of authority revocation, the application is frozen until resolved.
- **AF3: Bulk Submission** — The adviser submits multiple applications in one session, each with individual client authority declarations.

### Exception Flows
- **EF1: Authority Declaration Expired** — If the authority date is older than 6 months, system warns the adviser to obtain fresh authority.
- **EF2: Organisation Membership Lapsed** — At step 1, if the adviser's organisation membership has expired, access is denied with guidance to contact their organisation admin.
- **EF3: Duplicate Application** — At step 5, if the system detects an existing application for the same client (by name + DOB), it warns of potential duplication and asks for confirmation.

### Post-Conditions
- Application exists in SUBMITTED status with adviser as submitter and client as applicant.
- Authority declaration is stored as part of the application record.
- Audit trail records all adviser actions distinctly from citizen actions.
- Both adviser and client receive confirmation notifications.

### Business Rules
- Advisers must belong to an FCA-authorised or approved organisation.
- Authority declarations are valid for 6 months from the date signed.
- Applications submitted by advisers are marked for expedited processing (SLA: 5 working days vs 10).
- Advisers can view only applications they or their organisation submitted (not all citizen data).

---

## UC-10: Admin Manages User Roles

| Field | Value |
|-------|-------|
| Primary Actor | Platform Admin |
| Secondary Actors | Target User, Audit Service |
| Preconditions | Admin is authenticated with Platform Admin role |
| Trigger | Admin navigates to User Management and selects a user to modify |
| Priority | Must |

### Main Flow
1. Platform admin logs into the admin portal and navigates to User Management.
2. Admin searches for a user by name, email, or organisation.
3. System displays matching user records with current role(s) and status.
4. Admin selects the target user.
5. System displays the user's full profile: name, email, organisation, current roles, last login, account status.
6. Admin clicks "Edit roles".
7. System displays available roles with descriptions: Citizen, Money Adviser, Case Officer, Senior Officer, Team Leader, Operations Manager, Policy Manager, Security Admin, Platform Admin, Executive.
8. Admin adds or removes roles (multi-select supported).
9. Admin provides a reason for the change (mandatory free text).
10. Admin clicks "Save changes".
11. System validates that the role combination is valid (e.g., no conflicting roles).
12. System updates the user record and applies new permissions immediately.
13. System records the change in the audit trail with: admin ID, user ID, previous roles, new roles, reason, timestamp.
14. If the user has active sessions, their permissions are refreshed on next action (no forced logout).

### Alternative Flows
- **AF1: Deactivate User** — At step 6, admin clicks "Deactivate account" instead. System terminates all active sessions and prevents future login. Account data is retained per policy.
- **AF2: Reactivate User** — Admin finds a deactivated user and clicks "Reactivate". System restores access with previous role configuration.
- **AF3: Create New User** — Admin clicks "Create user", enters details, assigns roles. System sends an invitation email with account setup link.
- **AF4: Bulk Role Assignment** — Admin selects multiple users and applies the same role change to all (e.g., onboarding a team of new case officers).

### Exception Flows
- **EF1: Conflicting Roles** — At step 11, if admin assigns conflicting roles (e.g., Case Officer + Citizen on the same account), system rejects with an explanation.
- **EF2: Last Admin Protection** — At step 8, if admin attempts to remove the Platform Admin role from the last active admin, system blocks the action.
- **EF3: User Not Found** — At step 2, if no results match, system suggests checking spelling or broadening criteria.

### Post-Conditions
- User record is updated with new role assignments.
- Permissions take effect on user's next action.
- Audit trail is complete with full change history.
- Admin receives confirmation of the change.

### Business Rules
- Role changes take effect immediately (no approval workflow for admin actions — admins are trusted).
- A user can hold multiple roles simultaneously (e.g., Case Officer + Team Leader).
- Certain role combinations are prohibited: Citizen cannot be combined with any staff role.
- All role changes are retained in perpetuity for regulatory audit.
- Platform Admin actions are reviewed weekly by Security Admin (quis custodiet ipsos custodes).

---

## UC-11: Security Analyst Investigates Alert

| Field | Value |
|-------|-------|
| Primary Actor | Security Admin |
| Secondary Actors | Audit Service, Target User, Platform Admin |
| Preconditions | A security alert has been raised (automated threshold breach or manual report) |
| Trigger | Security admin receives alert notification or reviews the security dashboard |
| Priority | Should |

### Main Flow
1. Security admin logs into the admin portal and opens the Security Dashboard.
2. Dashboard displays active alerts sorted by severity: critical, high, medium, low.
3. Security admin selects a high-severity alert (e.g., "User X performed 50 debtor searches in 10 minutes").
4. System displays alert details: trigger condition, user involved, timestamp, relevant data points.
5. Security admin clicks "Investigate" to open the investigation workspace.
6. System retrieves the user's recent activity log: searches performed, records accessed, login times, IP addresses.
7. Security admin reviews the activity for patterns (e.g., bulk data harvesting, accessing unrelated cases, unusual hours).
8. Security admin determines the alert is a genuine security concern.
9. Security admin takes action: suspends the user account pending investigation.
10. System immediately terminates the user's active sessions and blocks login.
11. Security admin documents findings in the investigation record.
12. Security admin escalates to the Information Security Officer and/or reports to appropriate authority if data breach suspected.
13. System updates the alert status to "Under Investigation" with assigned owner.

### Alternative Flows
- **AF1: False Positive** — At step 8, if the admin determines the activity is legitimate (e.g., a batch processing job), they mark the alert as "False Positive" with justification. Alert is closed.
- **AF2: Minor Concern** — At step 9, if the issue is low-risk (e.g., user forgot to log out), admin sends a reminder to the user and closes with "Resolved — guidance issued".
- **AF3: Automated Alert Response** — For critical alerts (e.g., 100+ failed logins from one IP), system auto-blocks the IP and notifies the security admin simultaneously.

### Exception Flows
- **EF1: Admin Cannot Suspend Own Account** — At step 9, if the alert concerns the security admin's own account, the action is blocked; another admin must take action.
- **EF2: User Already Deactivated** — At step 9, if the user was already deactivated (e.g., automated lockout), system confirms no further action needed on access control.
- **EF3: Audit Data Unavailable** — At step 6, if audit service is unavailable, system alerts the admin and logs a priority support ticket.

### Post-Conditions
- Alert status is updated (Investigating / Resolved / False Positive).
- If user suspended: account is locked, sessions terminated, and a reactivation workflow is required.
- Investigation record exists with findings, actions taken, and evidence preserved.
- If data breach suspected: notification chain to DPO and ICO is initiated per GDPR/DPA 2018 timelines.

### Business Rules
- Security alerts must be triaged within 1 hour (critical) or 4 hours (high).
- User suspension is immediate and does not require a second approval (time-critical).
- All investigation actions are themselves audited (immutable log).
- Suspended users are notified of the suspension reason within 24 hours (unless law enforcement advises otherwise).
- Alert thresholds are configurable per role (staff have tighter thresholds than citizens).

---

## UC-12: Document Upload with Virus Scanning

| Field | Value |
|-------|-------|
| Primary Actor | Citizen (or Money Adviser) |
| Secondary Actors | Document Service, Virus Scanning Engine, Storage Service |
| Preconditions | User is authenticated and has an application in DRAFT or AWAITING_INFO status |
| Trigger | User clicks "Upload document" on the documents step or in response to an information request |
| Priority | Must |

### Main Flow
1. User navigates to the documents section of their application.
2. System displays the document upload interface with accepted formats (PDF, JPG, PNG, DOCX) and size limit (10MB).
3. User clicks "Choose file" and selects a document from their device.
4. Client-side validation checks file extension and size; if valid, upload begins.
5. System displays a progress bar as the file is transmitted to the Document Service.
6. Document Service receives the file and writes it to a quarantine area (not yet accessible).
7. Document Service submits the file to the Virus Scanning Engine.
8. Virus Scanning Engine analyses the file and returns a result: clean or infected.
9. File is clean: Document Service moves the file from quarantine to permanent storage.
10. Document Service generates a thumbnail (for images) or first-page preview (for PDFs).
11. System creates a document record with metadata: filename, size, type, upload timestamp, uploader, scan result.
12. System runs automatic categorisation (if enabled) to suggest a document type.
13. User sees the document appear in their uploaded list with "Available" status and suggested category.
14. User confirms or changes the category.
15. Audit trail records the upload event.

### Alternative Flows
- **AF1: Multiple File Upload** — At step 3, user selects multiple files (up to 5 at once). System processes each independently with individual progress indicators and scan results.
- **AF2: Mobile Camera Capture** — At step 3, on a mobile device, user selects "Take photo" which opens the camera. Captured image is treated as a JPG upload.
- **AF3: Drag and Drop** — At step 3, user drags files onto the upload zone. Same processing as click-to-upload.
- **AF4: Replace Document** — User uploads a new version of a previously uploaded document. System retains the old version (marked superseded) and the new version becomes active.

### Exception Flows
- **EF1: Virus Detected** — At step 8, if the scan returns "infected", the file remains in quarantine. User is informed: "This file could not be uploaded because it may contain harmful content. Please scan your device and try a different file." The quarantined file is deleted after 24 hours.
- **EF2: File Too Large** — At step 4, client-side validation catches a file exceeding 10MB. Error message is shown immediately without upload attempt.
- **EF3: Invalid Format** — At step 4, if the file extension is not in the allowed list, the upload is blocked with a message listing accepted formats.
- **EF4: Upload Network Failure** — At step 5, if the connection drops mid-upload, system allows retry. Partial uploads are cleaned up automatically.
- **EF5: Scanning Service Unavailable** — At step 7, if the virus scanner is offline, the file remains in quarantine. System retries every 5 minutes for up to 1 hour. If still unavailable, admin is alerted and the file remains quarantined until manual intervention.

### Post-Conditions
- Clean documents are stored encrypted at rest in permanent storage.
- Document record exists with metadata, category, and scan result.
- Quarantined (infected) files are deleted within 24 hours.
- Audit trail records: upload event, scan result, storage location.
- Application document count is updated.

### Business Rules
- Maximum 20 documents per application.
- Accepted formats: PDF, JPG, JPEG, PNG, DOCX only.
- Maximum file size: 10MB per file, 100MB total per application.
- All files must pass virus scanning before being accessible to any user.
- Documents are encrypted at rest (AES-256) and in transit (TLS 1.2+).
- Virus definitions must be updated at least daily.
- Failed scan results are reported in the security dashboard.

---

## Use Case Traceability

| Use Case | Related User Stories | Epic |
|----------|---------------------|------|
| UC-01 | US-007, US-008, US-009, US-010, US-012 | Application Creation |
| UC-02 | US-001, US-002, US-005 | Authentication & Identity |
| UC-03 | US-027, US-028, US-029, US-030 | Recommendation |
| UC-04 | US-037, US-038, US-039, US-040 | Case Management |
| UC-05 | US-041, US-042, US-043, US-044 | Search |
| UC-06 | US-050, US-051, US-052, US-053 | Digital Mailroom |
| UC-07 | US-055, US-056 | Administration |
| UC-08 | US-058 | Administration |
| UC-09 | US-011 | Application Creation |
| UC-10 | US-054 | Administration |
| UC-11 | US-048 | Dashboards & Analytics |
| UC-12 | US-018, US-019, US-020 | Document Management |

---

*Document ends.*
