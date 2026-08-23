# IAAS Pilot — Success Criteria

## Document Control

| Field | Value |
|-------|-------|
| Document Title | IAAS Pilot Success Criteria and Evaluation Framework |
| Version | 1.0 |
| Date | August 2026 |
| Owner | IAAS Programme Team |
| Classification | OFFICIAL |

---

## Purpose

This document defines the measurable criteria by which the IAAS pilot will be evaluated. Success is determined by achieving the target thresholds across all criteria. These criteria have been agreed with the programme board and will form the basis of the pilot outcome report and go/no-go decision for wider rollout.

---

## Success Criteria

| # | Criteria | Target | Measurement Method | When Measured |
|---|----------|--------|--------------------|---------------|
| 1 | Task completion rate | >80% | Percentage of participants who complete all 10 scripted test scenarios without assistance | End of pilot Week 1 |
| 2 | Time to process a case | <10 minutes | Measured from opening a case to recording a decision (approve/reject/request info). Averaged across all participants and cases. | Throughout pilot (audit log timestamps) |
| 3 | User satisfaction (SUS) | >70 | System Usability Scale questionnaire (10 questions, score 0-100). Industry average is 68; we target above average. | End of pilot Week 2 |
| 4 | Critical bugs found | 0 | No Priority 1 (system down) or Priority 2 (feature broken, blocking workflow) issues unresolved during pilot | Throughout pilot |
| 5 | Feature understanding | >75% | Post-pilot quiz on system features and capabilities (10 questions covering key workflows) | End of pilot Week 2 |
| 6 | Would recommend (NPS) | >60% | Net Promoter Score — percentage of participants scoring 9-10 minus percentage scoring 0-6 on "Would you recommend this system to a colleague?" | End of pilot Week 2 |

---

## Pilot Parameters

### Duration

**2 weeks** (10 working days)

- **Week 1**: Structured testing using scripted scenarios, familiarisation, initial feedback
- **Week 2**: Unstructured use simulating real caseload, advanced features, final evaluation

### Participants

**5-10 AiB case officers** selected to represent:
- Mix of experience levels (junior and senior case officers)
- Different product specialisms (DAS, bankruptcy, trust deeds)
- Varying digital confidence levels
- At least one participant from each operational team

### Support Structure

| Support Mechanism | Detail |
|-------------------|--------|
| Dedicated Slack channel | Real-time support, question answering, issue reporting. Monitored 08:30-17:00 daily. |
| Daily check-in | 15-minute stand-up at 09:30 each day. Quick round-table on progress, issues, and blockers. |
| Training guide | Written guide provided to all participants before pilot begins (docs/pilot-training-guide.md) |
| Tech lead availability | Available for screen-sharing troubleshooting within 30 minutes during working hours |
| Pilot lead | Single point of contact for all non-technical queries |

---

## Evaluation Process

### Data Collection

1. **Automated metrics**: Task completion times captured from audit logs (case open to decision timestamps)
2. **Test scenario results**: Each participant completes the 10 scripted scenarios and records pass/fail
3. **SUS questionnaire**: Administered electronically at the end of Week 2
4. **Feature quiz**: 10-question multiple choice quiz covering key system capabilities
5. **NPS question**: Single question administered alongside SUS
6. **Bug log**: All issues reported via Slack channel, categorised by severity

### Analysis

Results will be compiled within 3 working days of pilot completion. The pilot outcome report will include:
- Aggregate scores against each criterion (met/not met)
- Individual participant feedback themes
- Bug and issue summary with resolution status
- Recommendations for changes before wider rollout
- Go/no-go recommendation with rationale

---

## Exit Criteria

The pilot concludes when **one** of the following conditions is met:

### Successful Exit (Go)
All six success criteria targets are met. The service proceeds to wider rollout planning with any minor issues added to the backlog.

### Conditional Exit (Go with conditions)
Four or more criteria are met, remaining criteria are within 10% of target. The service proceeds to a remediation sprint addressing gaps, followed by a brief revalidation with 2-3 participants.

### Unsuccessful Exit (No-go)
Three or more criteria are not met, OR any critical blocker is identified that cannot be resolved within one sprint. The service returns to development for a focused improvement phase, with a new pilot date scheduled.

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Participants too busy to engage | Pilot participation formally agreed with line managers; protected time allocated |
| Technical environment issues | Pre-pilot smoke test conducted; backup environment available |
| Low response rate on questionnaires | Questionnaires completed in facilitated session, not sent as homework |
| Participants unfamiliar with digital tools | Training guide and supported onboarding session before pilot begins |
| Single participant skews results | Minimum 5 participants ensures no single outlier determines outcome |

---

## Stakeholder Sign-Off

This document requires agreement from:

| Role | Name | Agreed | Date |
|------|------|--------|------|
| Programme Sponsor | | | |
| Pilot Lead | | | |
| Technical Lead | | | |
| Operations Manager | | | |
