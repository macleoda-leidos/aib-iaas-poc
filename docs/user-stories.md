# IAAS User Stories

> **Project:** AiB Initial Application Advice Service (IAAS)
> **Version:** 1.0 | **Date:** 2026-08-19
> **Status:** Baselined for POC delivery

---

## Epic 1: Authentication & Identity

### US-001: Citizen Login via ScotAccount
**As a** Citizen **I want** to log in using my ScotAccount credentials **so that** I can access the application service without creating a new account.

**Acceptance Criteria:**
- Given a citizen with a valid ScotAccount, when they click "Sign in with ScotAccount", then they are redirected to the ScotAccount IdP and returned authenticated upon success.
- Given a citizen without a ScotAccount, when they click "Sign in with ScotAccount", then they are offered a link to register.
- Given authentication succeeds, when the citizen is returned to IAAS, then a session token is created with a 30-minute idle timeout.

**Priority:** Must | **Complexity:** L

---

### US-002: GOV.UK Login Integration
**As a** Citizen **I want** to authenticate via GOV.UK One Login **so that** I have an alternative identity verification path accepted across UK government services.

**Acceptance Criteria:**
- Given a citizen selects GOV.UK Login, when they complete authentication at the GOV.UK IdP, then their verified identity attributes (name, DOB) are mapped to the IAAS profile.
- Given the GOV.UK service is unavailable, when a citizen attempts login, then they are shown a clear error message with an alternative route.

**Priority:** Should | **Complexity:** L

---

### US-003: Multi-Factor Authentication for Staff
**As a** Platform Admin **I want** all internal staff accounts to require MFA **so that** we meet security baseline requirements for accessing sensitive debtor data.

**Acceptance Criteria:**
- Given a staff user logs in with username/password, when authentication succeeds, then they are prompted for a second factor (TOTP or push notification).
- Given MFA is not configured on a staff account, when they first log in, then they are forced to enrol before proceeding.
- Given three failed MFA attempts, when the third fails, then the account is locked for 15 minutes.

**Priority:** Must | **Complexity:** M

---

### US-004: Role Assignment on Registration
**As a** Platform Admin **I want** new users to be assigned a default role upon registration **so that** they have appropriate permissions from their first session.

**Acceptance Criteria:**
- Given a citizen registers, when their account is created, then they are assigned the "Citizen" role.
- Given a money adviser is invited by an organisation admin, when they complete registration, then they inherit the "Money Adviser" role scoped to their organisation.
- Given an admin changes a user's role, when the change is saved, then audit trail records who changed what and when.

**Priority:** Must | **Complexity:** M

---

### US-005: Session Timeout and Re-authentication
**As a** Security Admin **I want** sessions to expire after a configurable idle period **so that** unattended terminals do not expose debtor data.

**Acceptance Criteria:**
- Given a user has been idle for 30 minutes (citizen) or 15 minutes (staff), when the timeout fires, then a warning modal appears with a 2-minute countdown.
- Given the countdown expires without interaction, when the session ends, then the user is redirected to the login page with unsaved data preserved in draft.

**Priority:** Must | **Complexity:** S

---

### US-006: Organisation SSO Federation
**As an** Operations Manager **I want** partner organisations (e.g., advice agencies) to federate via SAML/OIDC **so that** their advisers can access IAAS with existing corporate credentials.

**Acceptance Criteria:**
- Given an organisation has configured their IdP metadata, when an adviser from that org attempts login, then IAAS delegates authentication to the corporate IdP.
- Given the federated login succeeds, when the user is returned, then their role and org mapping are resolved from directory attributes.

**Priority:** Could | **Complexity:** XL

---

## Epic 2: Application Creation

### US-007: Start New Application
**As a** Citizen **I want** to start a new insolvency application **so that** I can begin the process of finding an appropriate debt solution.

**Acceptance Criteria:**
- Given a logged-in citizen with no in-progress application, when they click "Start application", then a new application record is created in DRAFT status with a unique reference number.
- Given the application is created, when the wizard loads, then step 1 (Personal Details) is displayed.

**Priority:** Must | **Complexity:** S

---

### US-008: Save Draft and Resume Later
**As a** Citizen **I want** to save my partially completed application and return later **so that** I don't have to complete everything in one session.

**Acceptance Criteria:**
- Given a citizen is on any step of the wizard, when they click "Save and come back later", then all entered data is persisted and a confirmation message is shown.
- Given a citizen logs back in, when they navigate to "My applications", then they see their draft with a "Continue" link that resumes at the last incomplete step.
- Given 90 days have passed since last activity, when the citizen logs in, then the draft is marked as expired with an option to start fresh.

**Priority:** Must | **Complexity:** M

---

### US-009: Capture Personal Details
**As a** Citizen **I want** to enter my name, date of birth, and contact information **so that** AiB can identify me and communicate about my application.

**Acceptance Criteria:**
- Given the citizen is on step 1, when they enter valid personal details, then the data passes Zod schema validation and the Next button becomes active.
- Given the citizen enters an invalid email format, when they attempt to proceed, then inline validation highlights the error.
- Given the citizen has previously saved personal details, when they return to step 1, then fields are pre-populated.

**Priority:** Must | **Complexity:** S

---

### US-010: Capture Address with Postcode Lookup
**As a** Citizen **I want** to search for my address by postcode **so that** I can quickly select my address without manual entry.

**Acceptance Criteria:**
- Given the citizen enters a valid UK postcode, when they click "Find address", then a list of matching addresses is returned from the postcode service.
- Given no addresses match, when the result is empty, then the citizen is offered a manual address entry form.
- Given the citizen selects an address, when confirmed, then it is stored as the current address on the application.

**Priority:** Must | **Complexity:** S

---

### US-011: Adviser Creates Application on Behalf of Client

> 🎯 **TARGET — specification only.** **Not implemented.** `/adviser-workspace` is a static
> interface demonstration; "Submit on Behalf" links to the standard citizen wizard with no client
> details prompt, no declaration of authority and no submitter/applicant distinction on the
> resulting record. Neither acceptance criterion below is met. See UC-09 in `docs/use-cases.md`.

**As a** Money Adviser **I want** to create and progress an application on behalf of my client **so that** I can assist citizens who cannot use the digital service themselves.

**Acceptance Criteria:**
- Given a money adviser is logged in, when they click "New application on behalf of client", then they are prompted to enter the client's details and a declaration of authority is recorded.
- Given the application is submitted, when it reaches case management, then it clearly indicates the adviser as submitter and the citizen as applicant.

**Priority:** Must | **Complexity:** M

---

### US-012: Application Progress Indicator
**As a** Citizen **I want** to see a clear progress indicator across the 9 steps **so that** I understand how much of the application remains.

**Acceptance Criteria:**
- Given the citizen is on any wizard step, when the page renders, then a GOV.UK-style step indicator shows all 9 steps with current, completed, and upcoming states.
- Given the citizen navigates back, when they return to a completed step, then the data is preserved and editable.

**Priority:** Should | **Complexity:** S

---

## Epic 3: Financial Assessment

### US-013: Capture Debts
**As a** Citizen **I want** to list all my debts with creditor names and amounts **so that** the system can assess my total debt burden.

**Acceptance Criteria:**
- Given the citizen is on the debts step, when they add a debt entry, then they can specify creditor name, debt type (dropdown), outstanding balance, and monthly payment.
- Given the citizen has multiple debts, when they add more than one, then debts are listed in a table with a running total.
- Given a debt entry has missing required fields, when the citizen tries to proceed, then validation errors are displayed per field.

**Priority:** Must | **Complexity:** M

---

### US-014: Capture Income
**As a** Citizen **I want** to declare my income sources and amounts **so that** the system can calculate my disposable income.

**Acceptance Criteria:**
- Given the citizen is on the income step, when they enter income, then they can specify source (employment, benefits, pension, other), frequency (weekly/fortnightly/monthly/annually), and gross/net amounts.
- Given multiple income sources, when all are entered, then a normalised monthly total is calculated and displayed.

**Priority:** Must | **Complexity:** M

---

### US-015: Capture Expenditure
**As a** Citizen **I want** to declare my essential and discretionary expenditure **so that** the system can determine what I can afford to repay.

**Acceptance Criteria:**
- Given the citizen is on the expenditure step, when the page loads, then categories are presented using the Common Financial Statement (CFS) format with trigger figures.
- Given expenditure exceeds trigger figures for a category, when the citizen proceeds, then a soft warning is shown (non-blocking).
- Given all expenditure is captured, when calculated, then disposable income = total income minus total expenditure is displayed.

**Priority:** Must | **Complexity:** L

---

### US-016: Capture Assets
**As a** Citizen **I want** to declare my assets (property, vehicles, savings) **so that** the recommendation engine has a full financial picture.

**Acceptance Criteria:**
- Given the citizen is on the assets step, when they declare an asset, then they specify type, description, estimated value, and any secured debt against it.
- Given the citizen owns heritable property, when declared, then the system flags this as relevant to sequestration considerations.

**Priority:** Must | **Complexity:** M

---

### US-017: Financial Summary Review
**As a** Citizen **I want** to see a summary of my financial position before proceeding **so that** I can verify the information is correct.

**Acceptance Criteria:**
- Given all financial steps are complete, when the summary renders, then it displays total debt, total income, total expenditure, disposable income, and total assets.
- Given the citizen spots an error, when they click "Change" next to any section, then they are taken back to the relevant step with data preserved.

**Priority:** Should | **Complexity:** S

---

## Epic 4: Document Management

### US-018: Upload Supporting Documents
**As a** Citizen **I want** to upload documents (payslips, bank statements, ID) **so that** my application has the required evidence attached.

**Acceptance Criteria:**
- Given the citizen is on the documents step, when they select a file, then only PDF, JPG, PNG, and DOCX formats up to 10MB are accepted.
- Given a valid file is selected, when uploaded, then a progress indicator is shown and the file appears in the uploaded list on completion.
- Given the upload fails, when an error occurs, then a retry option is presented with a clear error message.

**Priority:** Must | **Complexity:** M

---

### US-019: Virus Scanning on Upload
**As a** Security Admin **I want** every uploaded file to be scanned for malware **so that** malicious files cannot enter the system.

**Acceptance Criteria:**
- Given a file is uploaded, when it reaches the document service, then it is passed to the virus scanning engine before being persisted.
- Given the scan detects a threat, when flagged, then the file is quarantined, the upload is rejected, and the user is informed.
- Given the scan is clean, when complete, then the file status changes to "Available" and it becomes accessible.

**Priority:** Must | **Complexity:** M

---

### US-020: Document Categorisation
**As a** Case Officer **I want** uploaded documents to be automatically categorised **so that** I can quickly locate specific evidence types during review.

**Acceptance Criteria:**
- Given a document is uploaded, when processed, then the system applies a category (ID, proof of income, proof of debt, bank statement, other).
- Given automatic categorisation confidence is below 70%, when categorised, then the document is flagged for manual review.

**Priority:** Should | **Complexity:** L

---

### US-021: Document Download and Preview
**As a** Case Officer **I want** to preview or download documents attached to an application **so that** I can verify evidence without leaving the portal.

**Acceptance Criteria:**
- Given a case officer opens an application, when they click on a document, then a preview is shown for supported formats (PDF, images).
- Given the format is not previewable, when clicked, then a download is initiated.

**Priority:** Must | **Complexity:** S

---

## Epic 5: System Checks

### US-022: Trigger Credit Check
**As the** System **I want** to perform a credit check against the applicant **so that** the recommendation engine has an accurate picture of registered debts and credit history.

**Acceptance Criteria:**
- Given the application reaches the system checks step, when triggered, then a synthetic credit check request is sent to the credit check service.
- Given the credit check returns, when results are received, then they are stored against the application and summarised for the recommendation engine.
- Given the credit check service is unavailable, when the call fails, then the system retries once and logs the failure.

**Priority:** Must | **Complexity:** M

---

### US-023: BASYS Lookup
**As the** System **I want** to check BASYS for existing bankruptcy records **so that** duplicate or conflicting applications are identified.

**Acceptance Criteria:**
- Given the system checks step is active, when a BASYS lookup is performed, then the system searches by name, DOB, and address.
- Given a match is found, when returned, then the application is flagged with existing case references for case officer review.
- Given no match is found, when returned, then the check is marked as clear.

**Priority:** Must | **Complexity:** M

---

### US-024: DAS Register Check
**As the** System **I want** to check the DAS register for active Debt Payment Programmes **so that** the recommendation considers existing arrangements.

**Acceptance Criteria:**
- Given the system checks step includes DAS, when the lookup is performed, then active DPPs associated with the applicant are returned.
- Given an active DPP exists, when found, then the recommendation engine factors this into product eligibility.

**Priority:** Must | **Complexity:** M

---

### US-025: Aggregate System Check Results
**As a** Citizen **I want** to see the outcome of system checks in plain language **so that** I understand what was found without technical jargon.

**Acceptance Criteria:**
- Given all system checks complete, when results are displayed, then each check shows a status (clear/match found/unavailable) with a one-line plain-English explanation.
- Given a check found a match, when the citizen views it, then they see guidance on what this means for their application.

**Priority:** Should | **Complexity:** S

---

### US-026: CFT and Moratorium Register Checks
**As the** System **I want** to check the CFT register and Moratorium register **so that** existing statutory protections are identified before recommendation.

**Acceptance Criteria:**
- Given the system checks step is active, when CFT and Moratorium lookups run, then results are returned and stored against the application.
- Given an active moratorium exists, when found, then the recommendation engine restricts recommendations to compatible products.

**Priority:** Must | **Complexity:** M

---

## Epic 6: Recommendation

### US-027: Generate Product Recommendation
**As the** System **I want** to generate a product recommendation based on the applicant's financial data and system checks **so that** the citizen receives tailored advice on the most suitable debt solution.

**Acceptance Criteria:**
- Given all data capture and system checks are complete, when the recommendation engine is invoked, then it evaluates eligibility rules for all 7 products (DAS, MAP, PTD, Sequestration, Moratorium, DPP, Signposting Advice).
- Given rules are evaluated, when a primary recommendation is determined, then it is presented with a confidence score (percentage).
- Given multiple products are eligible, when displayed, then a ranked list shows primary and alternative recommendations.

**Priority:** Must | **Complexity:** XL

---

### US-028: Explain Recommendation Rationale
**As a** Citizen **I want** a plain-English explanation of why a product was recommended **so that** I can understand and trust the advice.

**Acceptance Criteria:**
- Given a recommendation is generated, when displayed, then it includes a "Why this recommendation" section with the key factors that drove the decision.
- Given the citizen clicks "More detail", when expanded, then a full breakdown of each factor and its weight is shown.

**Priority:** Must | **Complexity:** M

---

### US-029: View Alternative Products
**As a** Citizen **I want** to see alternative debt solutions I may qualify for **so that** I can make an informed choice.

**Acceptance Criteria:**
- Given a primary recommendation is shown, when alternatives exist, then they are listed with brief descriptions and eligibility status.
- Given the citizen selects an alternative, when chosen, then the application proceeds with that product (with a note that it was citizen-selected over the system recommendation).

**Priority:** Should | **Complexity:** M

---

### US-030: Recommendation Audit Trail
**As a** Senior Officer **I want** every recommendation to be logged with full input data and rule versions **so that** decisions are auditable and defensible.

**Acceptance Criteria:**
- Given a recommendation is generated, when logged, then the audit record includes: rule version, input data hash, output recommendation, confidence score, and timestamp.
- Given a challenge is raised, when an officer reviews, then they can retrieve the exact inputs and rules that produced the recommendation.

**Priority:** Must | **Complexity:** M

---

### US-031: Override Recommendation with Justification
**As a** Case Officer **I want** to override a system recommendation with written justification **so that** professional judgement can prevail when rules produce an inappropriate outcome.

**Acceptance Criteria:**
- Given a case officer disagrees with the recommendation, when they click "Override", then they must select a reason code and provide free-text justification.
- Given an override is saved, when recorded, then it is flagged for senior officer review and the audit trail reflects the override.

**Priority:** Should | **Complexity:** M

---

## Epic 7: Payment & Submission

### US-032: Pay Application Fee
**As a** Citizen **I want** to pay the application fee online **so that** my application can be submitted without visiting an office.

**Acceptance Criteria:**
- Given the application is ready for submission, when a fee is required, then the citizen is directed to the payment step.
- Given payment is initiated, when the citizen completes card details, then the payment service processes the transaction (simulated) and returns success/failure.
- Given payment succeeds, when confirmed, then a receipt reference is stored against the application.

**Priority:** Must | **Complexity:** M

---

### US-033: Fee Exemption Check
**As a** Citizen **I want** the system to check if I qualify for a fee exemption **so that** I don't pay unnecessarily.

**Acceptance Criteria:**
- Given the citizen's financial data indicates they are in receipt of qualifying benefits, when the fee step loads, then the system automatically applies an exemption.
- Given an exemption is applied, when confirmed, then the application proceeds directly to submission without payment.

**Priority:** Should | **Complexity:** S

---

### US-034: Submit Application
**As a** Citizen **I want** to submit my completed application **so that** it enters the AiB review queue.

**Acceptance Criteria:**
- Given all steps are complete and payment (if applicable) is confirmed, when the citizen clicks "Submit application", then the status changes from DRAFT to SUBMITTED.
- Given submission succeeds, when complete, then a confirmation page displays the reference number, expected timeline, and next steps.
- Given submission succeeds, when recorded, then an email/SMS confirmation is sent to the citizen.

**Priority:** Must | **Complexity:** M

---

### US-035: Submission Confirmation and Receipt
**As a** Citizen **I want** to download or print a confirmation receipt **so that** I have a record of my submission.

**Acceptance Criteria:**
- Given the application is submitted, when the confirmation page displays, then a "Download receipt" button generates a PDF with application reference, submission date, and summary.

**Priority:** Should | **Complexity:** S

---

## Epic 8: Case Management

### US-036: Auto-Assign Application to Case Officer
**As an** Operations Manager **I want** submitted applications to be automatically assigned to case officers based on workload **so that** work is distributed fairly and processed promptly.

**Acceptance Criteria:**
- Given a new application is submitted, when it enters the queue, then the system assigns it to the case officer with the lowest active caseload in the relevant team.
- Given no officers are available, when assignment fails, then it is escalated to the team leader's unassigned queue.

**Priority:** Must | **Complexity:** L

---

### US-037: Case Officer Reviews Application
**As a** Case Officer **I want** to view a complete application with all documents and system check results **so that** I can make an informed assessment.

**Acceptance Criteria:**
- Given a case officer opens an assigned application, when the review page loads, then all sections (personal details, financials, documents, checks, recommendation) are displayed in a structured layout.
- Given the officer identifies an issue, when they click "Request more information", then the application status changes to AWAITING_INFO and the citizen is notified.

**Priority:** Must | **Complexity:** L

---

### US-038: Approve Application
**As a** Case Officer **I want** to approve an application **so that** it progresses to the next stage of the insolvency process.

**Acceptance Criteria:**
- Given a case officer has reviewed and is satisfied, when they click "Approve", then the application status changes to APPROVED with timestamp and officer ID.
- Given approval occurs, when saved, then the citizen is notified and downstream systems (BASYS/eDEN) are updated.

**Priority:** Must | **Complexity:** M

---

### US-039: Reject Application with Reasons
**As a** Case Officer **I want** to reject an application with structured reasons **so that** the citizen understands why and can reapply if appropriate.

**Acceptance Criteria:**
- Given a case officer determines the application is ineligible, when they click "Reject", then they must select one or more reason codes and optionally add free-text notes.
- Given rejection is saved, when the citizen is notified, then the notification includes the reasons and guidance on next steps.

**Priority:** Must | **Complexity:** M

---

### US-040: Request Additional Information
**As a** Case Officer **I want** to request additional information from the applicant **so that** I can progress the application without rejecting it outright.

**Acceptance Criteria:**
- Given a case officer needs more info, when they create a request, then they specify what is needed and a deadline (default 28 days).
- Given the request is sent, when the citizen logs in, then they see a task in their dashboard with the request details and an upload/response mechanism.
- Given 28 days pass without response, when the deadline expires, then the application is flagged for case officer decision (extend or reject).

**Priority:** Must | **Complexity:** M

---

## Epic 9: Search

### US-041: Cross-System Debtor Search
**As a** Case Officer **I want** to search for a debtor across all connected systems (BASYS, eDEN, DAS, CFT, Moratorium, RoI) **so that** I get a unified view of their history.

**Acceptance Criteria:**
- Given a case officer enters a search query (name, DOB, reference), when they click search, then all connected systems are queried in parallel.
- Given results return, when displayed, then they are grouped by system with match confidence scores.
- Given a result is selected, when clicked, then summary details from that system are shown inline.

**Priority:** Must | **Complexity:** XL

---

### US-042: Fuzzy Name Matching
**As a** Case Officer **I want** the search to handle name variations (spelling, maiden names, aliases) **so that** I find records even when names don't match exactly.

**Acceptance Criteria:**
- Given a search for "MacDonald", when executed, then results include "McDonald", "Macdonald", and other phonetic variations.
- Given fuzzy matching is applied, when results display, then a match confidence percentage is shown alongside each result.

**Priority:** Should | **Complexity:** L

---

### US-043: Filter and Sort Search Results
**As a** Case Officer **I want** to filter search results by system, date range, and status **so that** I can narrow down large result sets efficiently.

**Acceptance Criteria:**
- Given search results are displayed, when the officer applies filters, then results update dynamically without a full page reload.
- Given sorting options are available, when the officer sorts by date or confidence, then results reorder accordingly.

**Priority:** Should | **Complexity:** M

---

### US-044: Search Audit Logging
**As a** Security Admin **I want** all search activity to be logged **so that** inappropriate access to debtor records can be detected and investigated.

**Acceptance Criteria:**
- Given any user performs a search, when executed, then the audit log records: user ID, search terms, timestamp, and number of results returned.
- Given a security review is triggered, when an investigator queries the audit log, then they can filter by user or debtor to see all access.

**Priority:** Must | **Complexity:** S

---

## Epic 10: Dashboards & Analytics

### US-045: Operational Dashboard
**As an** Operations Manager **I want** a real-time dashboard showing application volumes, SLA compliance, and queue depths **so that** I can manage resources and identify bottlenecks.

**Acceptance Criteria:**
- Given the dashboard loads, when data is fetched, then it displays: applications received today/week/month, average processing time, SLA breach count, and queue depth per team.
- Given SLA thresholds are configurable, when a breach occurs, then the relevant metric turns red with a count of affected applications.

**Priority:** Should | **Complexity:** L

---

### US-046: Statistics and Reporting
**As an** Executive **I want** to generate reports on application outcomes by product type, region, and time period **so that** I can inform policy decisions with data.

**Acceptance Criteria:**
- Given an executive accesses the reports section, when they select parameters (date range, product, region), then a report is generated with charts and downloadable CSV/PDF.
- Given the report includes trends, when displayed, then month-on-month comparisons are shown.

**Priority:** Should | **Complexity:** L

---

### US-047: SLA Tracking and Alerts
**As a** Team Leader **I want** automatic alerts when applications approach SLA deadlines **so that** I can intervene before breaches occur.

**Acceptance Criteria:**
- Given an application has been in a status for 80% of the SLA period, when the threshold is crossed, then an alert notification is sent to the assigned officer and team leader.
- Given the SLA breaches, when it occurs, then it is recorded against the case and reflected on the operational dashboard.

**Priority:** Should | **Complexity:** M

---

### US-048: Security Dashboard
**As a** Security Admin **I want** a security-focused dashboard showing failed logins, unusual access patterns, and data export events **so that** I can identify potential threats.

**Acceptance Criteria:**
- Given the security dashboard loads, when data is displayed, then it shows: failed login attempts (last 24h), accounts locked, high-volume search users, and data export events.
- Given anomalous behaviour is detected, when thresholds are exceeded, then an automated alert is raised.

**Priority:** Should | **Complexity:** L

---

### US-049: AI Governance Dashboard
**As a** Policy Manager **I want** to monitor recommendation engine performance (accuracy, bias, override rates) **so that** I can ensure the AI system is operating fairly and effectively.

**Acceptance Criteria:**
- Given the AI governance dashboard loads, when displayed, then it shows: recommendation distribution by product, override rate by officer, confidence score distribution, and demographic breakdowns.
- Given bias indicators exceed thresholds, when detected, then alerts are raised to the policy team.

**Priority:** Could | **Complexity:** XL

---

## Epic 11: Digital Mailroom

### US-050: Scan and Digitise Physical Post
**As the** System **I want** to scan physical correspondence into digital format **so that** all case-related documents exist in one digital record.

**Acceptance Criteria:**
- Given physical post is batch scanned, when images are created, then they are submitted to the OCR pipeline.
- Given OCR completes, when text is extracted, then a searchable PDF is generated alongside the original image.

**Priority:** Could | **Complexity:** L

---

### US-051: Classify Inbound Correspondence
**As the** System **I want** to automatically classify inbound documents by type (court decree, creditor claim, debtor response) **so that** they can be routed to the correct team.

**Acceptance Criteria:**
- Given a scanned document has been OCR'd, when classification runs, then it assigns a document type with confidence score.
- Given classification confidence is above 85%, when assigned, then the document is automatically routed to the relevant queue.
- Given confidence is below 85%, when flagged, then it enters a manual triage queue.

**Priority:** Could | **Complexity:** XL

---

### US-052: Route Documents to Case
**As a** Case Officer **I want** inbound correspondence to be automatically linked to the correct case **so that** I don't have to manually match documents to applications.

**Acceptance Criteria:**
- Given a classified document contains a reference number, when matched, then it is linked to the corresponding case.
- Given no reference is found, when NER extracts name/address, then fuzzy matching attempts to identify the case.
- Given routing succeeds, when linked, then the case officer is notified of new correspondence.

**Priority:** Could | **Complexity:** L

---

### US-053: Digital Mailroom Workflow Triggers
**As an** Operations Manager **I want** certain document types to trigger automated workflows **so that** urgent items (court decrees, statutory deadlines) are actioned promptly.

**Acceptance Criteria:**
- Given a court decree is classified, when routed, then a high-priority task is created with a statutory deadline.
- Given a creditor claim is classified, when routed, then it is added to the claims register for the relevant case.

**Priority:** Could | **Complexity:** L

---

## Epic 12: Administration

### US-054: Manage Users and Roles
**As a** Platform Admin **I want** to create, modify, and deactivate user accounts with role assignments **so that** access is controlled and up to date.

**Acceptance Criteria:**
- Given an admin accesses user management, when they create a user, then they specify name, email, role(s), and organisation.
- Given an admin deactivates a user, when saved, then the user can no longer log in and their active sessions are terminated.
- Given an admin changes a role, when saved, then permissions take effect on the user's next action (no logout required).

**Priority:** Must | **Complexity:** M

---

### US-055: Rules Management Console
**As a** Policy Manager **I want** to view, version, and modify recommendation rules without code changes **so that** policy updates can be implemented quickly.

**Acceptance Criteria:**
- Given the rules console loads, when displayed, then all active rules are listed with their version, effective date, and status.
- Given a rule is modified, when saved, then a new version is created (old version retained) with an effective date.
- Given a rule change is saved, when it takes effect, then only applications started after the effective date use the new rule.

**Priority:** Should | **Complexity:** XL

---

### US-056: Policy Simulation (What-If Analysis)
**As a** Policy Manager **I want** to simulate the impact of a rule change against historical data **so that** I can predict outcomes before going live.

**Acceptance Criteria:**
- Given a policy manager drafts a rule change, when they click "Simulate", then the system replays the last 1000 applications against the modified rules.
- Given simulation completes, when results display, then they show how many applications would have received a different recommendation, broken down by product.

**Priority:** Could | **Complexity:** XL

---

### US-057: Organisation Management
**As a** Platform Admin **I want** to manage organisations (advice agencies, creditors) with their users and permissions **so that** multi-tenancy is maintained.

**Acceptance Criteria:**
- Given an admin creates an organisation, when saved, then it has a name, type, and contact details.
- Given users are linked to an organisation, when they log in, then they only see cases and data relevant to their organisation scope.

**Priority:** Should | **Complexity:** M

---

### US-058: Correspondence Template Management
**As an** Operations Manager **I want** to manage letter and email templates **so that** standard correspondence is consistent and can be updated without developer involvement.

**Acceptance Criteria:**
- Given an admin edits a template, when saved, then the new version is active for all future correspondence of that type.
- Given templates support merge fields, when a letter is generated, then applicant-specific data is inserted correctly.

**Priority:** Should | **Complexity:** M

---

### US-059: System Configuration
**As a** Platform Admin **I want** to manage system configuration (SLA thresholds, timeout values, feature flags) **so that** operational parameters can be adjusted without deployment.

**Acceptance Criteria:**
- Given an admin changes a configuration value, when saved, then it takes effect within 60 seconds without service restart.
- Given a configuration change is made, when recorded, then the audit trail captures the old value, new value, who changed it, and when.

**Priority:** Should | **Complexity:** M

---

## Epic 13: Future/Roadmap

### US-060: Real-Time Application Notifications
**As a** Citizen **I want** to receive real-time notifications (push/SMS/email) when my application status changes **so that** I stay informed without repeatedly checking the portal.

**Acceptance Criteria:**
- Given a citizen has opted in to notifications, when their application status changes, then a notification is sent via their preferred channel within 5 minutes.
- Given the citizen is logged in, when a notification fires, then an in-app notification badge updates in real time.

**Priority:** Could | **Complexity:** M

---

### US-061: Mobile-Responsive Application Journey
**As a** Citizen **I want** to complete my application on a mobile device **so that** I am not restricted to desktop access.

**Acceptance Criteria:**
- Given a citizen accesses IAAS on a mobile device, when the page renders, then all wizard steps are fully functional with touch-friendly controls.
- Given document upload is needed, when on mobile, then the camera can be used to capture documents directly.

**Priority:** Could | **Complexity:** L

---

### US-062: AI-Assisted Document Verification
**As the** System **I want** to use AI to verify the authenticity and content of uploaded documents **so that** fraudulent submissions are detected early.

**Acceptance Criteria:**
- Given a document is uploaded, when AI analysis runs, then it checks for: document tampering indicators, consistency with declared data, and known fraud patterns.
- Given a risk score exceeds the threshold, when flagged, then the document is routed to a specialist fraud review queue.

**Priority:** Could | **Complexity:** XL

---

### US-063: Chatbot Guidance During Application
**As a** Citizen **I want** an AI chatbot to assist me with questions during the application **so that** I can get help without waiting for a phone call.

**Acceptance Criteria:**
- Given a citizen is on any wizard step, when they click "Get help", then a chatbot opens with context-aware guidance for that step.
- Given the chatbot cannot answer, when it identifies a complex query, then it offers to connect the citizen with a human adviser.

**Priority:** Could | **Complexity:** XL

---

### US-064: Predictive Analytics for Resource Planning
**As an** Operations Manager **I want** predictive models to forecast application volumes **so that** staffing can be planned proactively.

**Acceptance Criteria:**
- Given historical data is available, when the forecast model runs weekly, then it predicts application volumes for the next 4 weeks with confidence intervals.
- Given forecasts are displayed, when shown on the dashboard, then actual vs predicted comparisons are visible for model accuracy tracking.

**Priority:** Could | **Complexity:** XL

---

### US-065: Knowledge Hub and CMS
**As a** Policy Manager **I want** a content management system for publishing guidance articles **so that** staff and citizens have access to up-to-date information.

**Acceptance Criteria:**
- Given an author creates an article, when published, then it appears in the knowledge hub searchable by keyword and category.
- Given content is updated, when a new version is published, then the old version is archived and a change log is maintained.

**Priority:** Could | **Complexity:** L

---

### US-066: Case Timeline Visualisation
**As a** Case Officer **I want** a visual timeline of all events on a case **so that** I can quickly understand the history and current state.

**Acceptance Criteria:**
- Given a case officer opens a case, when the timeline tab loads, then all events (status changes, documents received, correspondence sent, system checks) are displayed chronologically.
- Given events are clickable, when selected, then detail expands inline without navigation.

**Priority:** Could | **Complexity:** M

---

## Traceability Matrix Summary

| Epic | Must | Should | Could | Total |
|------|------|--------|-------|-------|
| Authentication & Identity | 3 | 0 | 1 | 4 |*
| Application Creation | 4 | 1 | 0 | 5 |*
| Financial Assessment | 4 | 1 | 0 | 5 |
| Document Management | 2 | 1 | 0 | 3 |*
| System Checks | 4 | 1 | 0 | 5 |
| Recommendation | 2 | 2 | 0 | 4 |*
| Payment & Submission | 2 | 2 | 0 | 4 |
| Case Management | 4 | 0 | 0 | 4 |*
| Search | 1 | 2 | 0 | 3 |*
| Dashboards & Analytics | 0 | 3 | 1 | 4 |*
| Digital Mailroom | 0 | 0 | 4 | 4 |
| Administration | 1 | 4 | 1 | 6 |
| Future/Roadmap | 0 | 0 | 7 | 7 |
| **Total** | **27** | **17** | **14** | **58+** |

*Note: Some epics include additional implied stories within acceptance criteria. Full backlog refinement will expand to 80+ stories.*

---

*Document ends.*
