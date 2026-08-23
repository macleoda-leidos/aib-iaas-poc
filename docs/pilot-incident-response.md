# IAAS Pilot — Incident Response Plan

## Document Control

| Field | Value |
|-------|-------|
| Document Title | Pilot Incident Response Plan |
| Version | 1.0 |
| Date | August 2026 |
| Classification | OFFICIAL |
| Scope | IAAS pilot environment only (not production) |

---

## Purpose

This plan defines how incidents are categorised, responded to, and resolved during the IAAS staff pilot. It ensures that issues affecting pilot participants are handled quickly and consistently, minimising disruption to testing while capturing all issues for post-pilot analysis.

---

## Severity Levels

### P1 — Critical

**Definition**: System completely unavailable, data loss or corruption, security breach, or safety concern.

**Examples**: API returns 500 on all requests, database corrupted, authentication system compromised, pilot data exposed externally.

**Response time**: Immediate (within 15 minutes of report)

**Actions**:
1. Acknowledge in Slack channel immediately
2. Notify all pilot participants that system is unavailable
3. Tech lead investigates root cause
4. If unresolvable within 30 minutes: redeploy from last known good state on main branch
5. If data integrity affected: restore from backup, notify programme manager
6. Post-incident: root cause analysis within 24 hours

**Resolution target**: Service restored within 1 hour

---

### P2 — High

**Definition**: Core feature broken or unavailable, blocking pilot workflow. Participants cannot complete test scenarios.

**Examples**: Case approval button not responding, search returns no results, login failing for specific users, PDF export crashes, recommendation page blank.

**Response time**: 1 hour from report

**Actions**:
1. Acknowledge in Slack channel
2. Advise participants on workaround if available (e.g., "Skip scenario 3, continue with 4")
3. Tech lead creates hotfix branch from main
4. Develop, test, and deploy fix
5. Confirm resolution with reporting participant

**Resolution target**: Fix deployed within 4 hours

---

### P3 — Medium

**Definition**: Feature partially broken, incorrect display, or non-blocking usability issue. Participants can continue testing with minor inconvenience.

**Examples**: Dates displaying in wrong format, pagination showing incorrect count, styling broken on one page, slow response on specific endpoint (>5 seconds but not timing out).

**Response time**: 4 hours from report

**Actions**:
1. Acknowledge in Slack channel
2. Record in issue backlog with full details
3. Assess whether fix is safe to deploy during pilot or should wait
4. If safe: fix and deploy in next batch
5. If risky: defer to post-pilot remediation sprint

**Resolution target**: Fixed during pilot or documented for immediate post-pilot sprint

---

### P4 — Low

**Definition**: Cosmetic issue, minor enhancement request, or "nice to have" improvement. No impact on pilot testing.

**Examples**: Font slightly wrong on one heading, colour not matching design spec, suggestion for rewording help text, request for additional feature.

**Response time**: Acknowledged within 1 working day

**Actions**:
1. Thank the participant for the feedback
2. Record in feedback/backlog
3. Prioritise for post-pilot development

**Resolution target**: Captured for future sprints (no pilot-time fix expected)

---

## Escalation Path

```
Pilot Participant
    |
    v (reports via Slack channel)
Pilot Lead (triage and categorise)
    |
    v (P1/P2: immediate escalation)
Tech Lead (investigate and resolve)
    |
    v (P1 only, or if unresolvable within SLA)
Programme Manager (stakeholder communication, decisions on pilot pause/continue)
```

**Escalation triggers**:
- P1 not resolved within 1 hour -> Programme Manager
- P2 not resolved within 4 hours -> Programme Manager
- Multiple P2s in single day -> Consider pilot pause
- Any security concern -> Programme Manager immediately regardless of severity

---

## Communication Channels

| Channel | Use | Audience |
|---------|-----|----------|
| Pilot Slack channel | Real-time issue reporting, updates, workarounds | All participants + support team |
| Email | Formal incident notifications, post-incident reports | Programme board, pilot lead, tech lead |
| Daily check-in (09:30) | Verbal updates on open issues, priorities for the day | Participants + support team |
| Phone (tech lead) | P1 only — if Slack acknowledgement not received within 5 minutes | Tech lead direct |

---

## Rollback Procedure

If a deployment causes issues during the pilot:

1. Identify the problematic commit via `git log`
2. Execute `git revert <commit-hash>` on main branch
3. Push to main: `git push origin main`
4. Render.com auto-deploys from main within **3 minutes**
5. Verify service restored via `/api/health` endpoint
6. Notify participants in Slack that service is restored

**Total rollback time**: Under 5 minutes from decision to deploy.

For database issues: SQLite database can be reset to clean synthetic data state by redeploying the service (in-memory database reinitialises on restart).

---

## Incident Log Template

All incidents during the pilot are recorded using this format:

| Field | Detail |
|-------|--------|
| Incident ID | INC-PILOT-001 |
| Reported by | [Participant name] |
| Date/time | [When reported] |
| Severity | P1 / P2 / P3 / P4 |
| Description | [What happened] |
| Impact | [Who/what affected] |
| Resolution | [What was done] |
| Resolved at | [Date/time] |
| Root cause | [Why it happened] |
| Prevention | [How to prevent recurrence] |

---

## Post-Pilot Review

Within 3 working days of pilot completion, a post-pilot incident review will be conducted covering:
- Total incidents by severity
- Average resolution time vs. target
- Any patterns or recurring issues
- Lessons learned for live service operations
- Recommendations for production incident response plan
