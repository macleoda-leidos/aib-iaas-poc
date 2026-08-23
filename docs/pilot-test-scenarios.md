# IAAS Pilot — Test Scenarios

## Document Control

| Field | Value |
|-------|-------|
| Document Title | IAAS Pilot Scripted Test Scenarios |
| Version | 1.0 |
| Audience | Pilot participants and pilot lead |
| Date | August 2026 |
| Purpose | Structured testing of core functionality during staff pilot |

---

## Instructions

Complete each scenario in order. For each scenario, follow the steps exactly as written, observe whether the expected result occurs, and mark Pass or Fail. If a scenario fails, note what happened in the "Observations" field and continue to the next scenario.

**Test accounts:**
- Staff account: Provided via secure email (case officer role)
- Debtor account: demo@example.com / demo (citizen role)

**Environment**: IAAS Pilot environment (URL provided separately)

---

## Scenario 1: Login and MFA

**Objective**: Verify that authentication works correctly with multi-factor authentication.

| Step | Action |
|------|--------|
| 1 | Open the IAAS portal URL in Chrome or Edge |
| 2 | Click "Log in" in the top navigation |
| 3 | Enter your staff email address and password |
| 4 | When prompted, enter the 6-digit MFA code from your authenticator app |
| 5 | Click "Verify" |

**Expected Result**: You are redirected to the Case Officer Dashboard. Your name appears in the top-right corner. The priority cases list is visible with at least one case shown.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 2: Review a Submitted Case

**Objective**: Verify that case details, AI summary, and quality panel display correctly.

| Step | Action |
|------|--------|
| 1 | From the dashboard, locate case **IAAS-2026-00012** (use search if not visible) |
| 2 | Click on the case to open it |
| 3 | Read the AI-generated summary at the top of the page |
| 4 | Scroll down to review the full application details |
| 5 | Check the Quality Panel on the right side |

**Expected Result**: The case detail page loads showing: applicant name and reference number, an AI summary with key financial figures, a quality panel showing data completeness percentage and validation status, and the full application data in expandable sections.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 3: Approve a Case

**Objective**: Verify that the approval workflow functions correctly and updates case status.

| Step | Action |
|------|--------|
| 1 | With case **IAAS-2026-00012** open, click the "Approve" button |
| 2 | If prompted, confirm your decision |
| 3 | Observe the status change on screen |
| 4 | Navigate back to the dashboard |
| 5 | Verify the case status has updated in the case list |

**Expected Result**: A success message confirms the approval. The case status changes to "Approved". The audit trail shows your decision with timestamp. On the dashboard, the case now shows "Approved" status (or moves to a completed section).

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 4: Reject a Case

**Objective**: Verify that the rejection workflow captures a reason and updates correctly.

| Step | Action |
|------|--------|
| 1 | From the dashboard, open case **IAAS-2026-00011** |
| 2 | Review the case details briefly |
| 3 | Click the "Reject" button |
| 4 | In the reason field, type: "Incomplete financial information — income evidence not provided" |
| 5 | Confirm the rejection |

**Expected Result**: A rejection reason field appears when Reject is clicked. After confirmation, a success message displays. The case status changes to "Rejected" with your reason recorded. The audit trail shows the rejection with reason and timestamp.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 5: Search for an Applicant

**Objective**: Verify that search functionality works with fuzzy matching.

| Step | Action |
|------|--------|
| 1 | Click the search bar at the top of the dashboard |
| 2 | Type "Morrison" and press Enter (or click Search) |
| 3 | Review the search results |
| 4 | Now search for "Morison" (deliberate misspelling, one 'r') |
| 5 | Compare the results |

**Expected Result**: The first search returns results for any applicant named Morrison. The second search (misspelled) also returns Morrison results thanks to fuzzy matching. Results show the applicant name, reference number, and current status. A "Related Records" section may show matches from other systems.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 6: Citizen Journey — My Application

**Objective**: Verify the citizen-facing view works correctly, showing application status and details.

| Step | Action |
|------|--------|
| 1 | Log out of your staff account |
| 2 | Log in with the debtor account (demo@example.com / demo) |
| 3 | Complete MFA if prompted |
| 4 | Navigate to "My Application" from the main menu |
| 5 | Click on each expandable section to verify content displays |

**Expected Result**: The My Application page shows: application reference number, current status with visual progress indicator, submission date, and expandable sections for personal details, financial summary, documents uploaded, and recommended product. Each section expands when clicked, revealing the relevant information.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 7: Complete a New Application

**Objective**: Verify the full 9-step application form can be completed end-to-end.

| Step | Action |
|------|--------|
| 1 | While logged in as the debtor account, navigate to "Apply" |
| 2 | If a "Demo Mode" option is available, enable it to auto-fill fields; otherwise fill manually |
| 3 | Complete Step 1 (Personal Details) and click Continue |
| 4 | Complete Steps 2-8 (Financial details, assets, creditors, income/expenditure, employment, documents, review) |
| 5 | On the final step, review your answers and click "Submit Application" |

**Expected Result**: Each step loads correctly with clear field labels and help text. Validation messages appear if required fields are missed. After submission, a confirmation page shows your new application reference number and next steps. The application appears in "My Application" with status "Submitted".

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 8: Check Recommendation Explanation

**Objective**: Verify that the recommendation page provides a clear, explainable output.

| Step | Action |
|------|--------|
| 1 | Log back in with your staff account |
| 2 | Navigate to the recommendation page for case IAAS-2026-00012 (via `/case/IAAS-2026-00012/recommendation` or by clicking "View Recommendation" on the case) |
| 3 | Review the recommended product section |
| 4 | Review the explanation/reasoning section |
| 5 | Check that all scoring factors are visible |

**Expected Result**: The recommendation page shows: the recommended insolvency product (e.g., DAS, Bankruptcy, Trust Deed), a confidence score or percentage, an explanation section breaking down why this product was recommended, individual scoring factors (income, debt level, asset value, creditor count, etc.) with their contribution to the recommendation, and alternative products considered with reasons they were not selected.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 9: Admin Features

**Objective**: Verify that the admin portal loads and key features are accessible.

| Step | Action |
|------|--------|
| 1 | Navigate to the admin portal (click "Admin" in navigation or go to the admin URL directly) |
| 2 | Verify the admin dashboard loads |
| 3 | Navigate to the "Rules Engine" section |
| 4 | Navigate to the "AI Governance" section |
| 5 | Return to the admin dashboard |

**Expected Result**: The admin portal loads showing system-level information. The Rules Engine page shows the product recommendation rules (criteria, thresholds, weightings). The AI Governance page shows model information, fairness metrics, or configuration. Navigation between sections is smooth with no errors.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Scenario 10: PDF Export

**Objective**: Verify that the PDF export functionality produces a valid, downloadable document.

| Step | Action |
|------|--------|
| 1 | Navigate to the recommendation page for any case (e.g., IAAS-2026-00012) |
| 2 | Locate the "Download PDF" or "Export" button |
| 3 | Click the button |
| 4 | Wait for the PDF to generate and download |
| 5 | Open the downloaded PDF file |

**Expected Result**: A PDF file downloads to your computer (may take a few seconds to generate). The PDF opens in your default PDF viewer and contains: the case reference number, applicant summary, recommended product, explanation of the recommendation, and scoring breakdown. The content matches what was displayed on screen. Text is readable and layout is professional.

| Result | |
|--------|---|
| Pass | [ ] |
| Fail | [ ] |
| Observations | |

---

## Test Summary

| Scenario | Description | Result |
|----------|-------------|--------|
| 1 | Login + MFA | |
| 2 | Review submitted case | |
| 3 | Approve case | |
| 4 | Reject case | |
| 5 | Search for applicant | |
| 6 | Citizen journey | |
| 7 | Complete new application | |
| 8 | Recommendation explanation | |
| 9 | Admin features | |
| 10 | PDF export | |

**Total Pass**: ___ / 10

**Tested by**: ___________________________

**Date**: ___________________________

**Overall comments**:

---

## Reporting Issues

If any scenario fails:

1. Note the exact step where it failed
2. Take a screenshot if possible (Windows: Win+Shift+S)
3. Note any error messages displayed
4. Report in the pilot Slack channel with: scenario number, step number, what happened, screenshot
5. Continue with the remaining scenarios — one failure should not block the rest
