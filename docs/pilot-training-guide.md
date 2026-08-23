# IAAS Pilot — Staff Training Guide

## Document Control

| Field | Value |
|-------|-------|
| Document Title | IAAS Pilot Staff Training Guide |
| Version | 1.0 |
| Audience | AiB case officers participating in the IAAS pilot |
| Date | August 2026 |
| Classification | OFFICIAL |

---

## Who This Guide Is For

This guide is for AiB case officers who are participating in the IAAS (Initial Application Advice Service) pilot. You will be using the new digital service to review applications, process cases, and provide feedback on the system before it goes live. No prior experience with the IAAS system is needed — this guide will walk you through everything.

## Prerequisites

Before you begin, ensure you have:

- **Browser**: Google Chrome (version 100+) or Microsoft Edge (version 100+). Firefox is supported but Chrome/Edge are recommended for the best experience.
- **Network access**: Standard AiB network access. The service is cloud-hosted and accessible from any internet-connected device.
- **Credentials**: You will receive your login email and temporary password via secure email from the pilot lead. Keep these confidential.
- **MFA device**: A smartphone with an authenticator app installed (Microsoft Authenticator, Google Authenticator, or any TOTP-compatible app).

---

## Logging In

1. Open your browser and navigate to the IAAS portal URL (provided separately via secure email).
2. Click the **"Log in"** button in the top-right corner of the page.
3. Enter your provided email address and password.
4. You will be prompted for a Multi-Factor Authentication (MFA) code. Open your authenticator app and enter the 6-digit code displayed.
5. Click **"Verify"** to complete login.

After successful authentication, you will be redirected to your dashboard.

**First login note**: On your first login, you may be asked to set up MFA by scanning a QR code with your authenticator app. Follow the on-screen instructions — this only happens once.

---

## The Dashboard

After logging in as a staff member, you will see the **Case Officer Dashboard**. Here is what each section shows:

### Priority Cases

Cases are sorted by priority with the most urgent at the top. Priority is determined by:
- Time since submission (older cases appear higher)
- Application complexity score
- Whether the case has been flagged by the AI quality system

### Notifications

The notifications panel (top-right bell icon) shows:
- New cases assigned to you
- Cases requiring urgent attention
- System announcements from the pilot team

### Anomaly Alerts

The AI-powered anomaly detection highlights cases that may need extra scrutiny. These are not errors — they are cases where the system has detected unusual patterns that a human should review. Treat these as suggestions, not instructions.

### Quick Stats

A summary bar shows your caseload: total assigned, pending review, completed today, and average processing time.

---

## Processing a Case

This is the core workflow you will perform during the pilot.

### Step 1: Open a Case

Click on any case in your priority list. This opens the **Case Detail** view showing:
- Applicant summary (name, reference number, submission date)
- Application type and current status
- Assigned officer and any previous notes

### Step 2: Review the AI Summary

At the top of the case detail page, you will see an **AI-Generated Summary**. This provides a plain-English overview of the application including:
- Key financial figures (total debt, income, expenditure)
- Recommended product and confidence level
- Any flags or concerns identified automatically

**Important**: The AI summary is a tool to help you work faster. It does not replace your professional judgment. Always verify key details against the full application data below.

### Step 3: Check the Quality Panel

The **Quality Panel** on the right side shows:
- Data completeness score (percentage of fields filled)
- Validation status (all required documents present?)
- Cross-reference checks (any matches in existing systems?)
- Risk indicators

### Step 4: Make a Decision

Once you have reviewed the case, click either:
- **Approve** — The application meets criteria and should proceed to the recommended product pathway
- **Reject** — The application does not meet criteria (you must provide a reason)
- **Request Information** — More information is needed from the applicant

After your decision, the system records it in the audit trail and updates the case status. The applicant will be notified automatically.

---

## Searching for Cases

### Basic Search

Use the search bar at the top of the dashboard. You can search by:
- Applicant name (first name, surname, or both)
- Reference number (e.g., IAAS-2026-00012)
- Postcode

### Fuzzy Matching

The search uses fuzzy matching, meaning it will find results even if you make minor spelling errors. For example, searching "Morison" will find "Morrison". This is intentional and helps when applicant names are slightly different across systems.

### Cross-System Search

When you search, the system checks across all connected registers (BASYS, eDEN, DAS Register) to show you whether the applicant has any existing records. Results from other systems appear in a separate "Related Records" section below the IAAS results.

---

## My Application (Debtor View)

To understand the citizen experience, you can switch to a debtor test account. This lets you see exactly what applicants see when they:
- Check their application status
- View their recommended product with explanations
- See what information they have submitted
- Track progress through the decision process

To access this view, log out and log back in with the demo debtor account credentials (provided separately). Navigate to **"My Application"** from the main menu.

All sections are expandable — click any section heading to reveal the details underneath.

---

## Admin Features

The admin portal provides additional functionality beyond case processing. While these features are primarily for senior staff and system administrators, you are welcome to explore them during the pilot:

- **Rules Engine**: View and understand the product recommendation rules
- **AI Governance**: See how the AI models are configured and monitored
- **Reports**: Generate caseload reports and export data
- **User Management**: View user accounts and roles (read-only for case officers)
- **Audit Log**: Search the complete audit trail of all system actions

Access the admin portal via the "Admin" link in the navigation menu, or by navigating directly to the admin portal URL.

---

## Troubleshooting

### "Backend waking up" message or slow first load

This is **normal behaviour**. The pilot environment uses a cloud hosting service that puts the backend to sleep after periods of inactivity to save costs. When you first access the system (or after a period of no use), the backend takes approximately 30 seconds to start up. Simply wait and retry — subsequent requests will be fast.

### Page not loading or showing errors

1. Clear your browser cache (Ctrl+Shift+Delete, select "Cached images and files", click Clear)
2. Try a hard refresh (Ctrl+Shift+R)
3. If the issue persists, try a different browser
4. If still not working, report via the pilot Slack channel

### MFA code not working

- Ensure the time on your phone is correct (authenticator apps are time-sensitive)
- Wait for a new code to appear (codes change every 30 seconds)
- If persistent, contact the pilot lead for an MFA reset

### Cannot find a case

- Check your search spelling (though fuzzy matching should help)
- Try searching by reference number instead of name
- Ensure you are logged in with the correct account (staff, not debtor)

---

## Providing Feedback

Your feedback is essential to improving the service. There are several ways to share your thoughts:

1. **In-app feedback form**: Navigate to `/feedback` from any page, or click the "Feedback" link in the footer. This is the preferred method as it captures context about which page you were on.

2. **Pilot Slack channel**: For quick questions, suggestions, or issues that need immediate attention.

3. **Daily check-in**: A brief 15-minute session each day where you can raise issues verbally.

4. **Post-pilot questionnaire**: A formal survey at the end of the pilot covering usability, usefulness, and recommendations.

All feedback is valued — whether it is a major usability issue, a minor cosmetic suggestion, or something you particularly like about the system. There are no wrong answers.

---

## Support Contacts

| Need | Contact | Method |
|------|---------|--------|
| Technical issues | Pilot tech lead | Slack channel |
| Account/access issues | Pilot lead | Email or Slack |
| Process questions | Your line manager | As normal |
| Urgent system issues | Tech lead | Slack (tag @here) |

---

## Key Reminders

- This is a **pilot** — things may not be perfect, and that is expected. Your job is to use the system and tell us what works and what does not.
- All data in the system is **synthetic** (fake). No real personal data is involved.
- Your feedback directly shapes the final service. The more specific and honest your feedback, the better the service will be for everyone.
- If in doubt about anything, ask in the Slack channel. There are no silly questions during a pilot.
