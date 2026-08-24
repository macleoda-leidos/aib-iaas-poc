# User Personas: Initial Application Advice Service (IAAS)

**Programme:** AiB Digital Transformation  
**Document Owner:** Accountant in Bankruptcy, Scottish Government  
**Version:** 1.0  
**Classification:** OFFICIAL  
**Date:** August 2026  

---

## Jamie Henderson — Citizen Applicant (Debtor)

**Age:** 34 | **Location:** Edinburgh (Leith) | **Tech Confidence:** Low

### Background
Jamie works as a delivery driver on a zero-hours contract. Following a relationship breakdown and a period of reduced hours during 2024, he accumulated £18,000 in unsecured debt across credit cards, a bank loan, and council tax arrears. He lives in rented accommodation and has no significant assets. He found information about debt solutions through a Google search but is overwhelmed by the options and unsure which apply to him.

### Goals
- Understand which debt solution is right for his circumstances without needing specialist knowledge
- Complete an application without taking time off work
- Get a clear timeline for when his situation will be resolved
- Stop creditor contact and threatening letters
- Rebuild his credit rating over time

### Motivations
- Reducing daily anxiety about finances and creditor calls
- Providing stability for his two children who stay with him at weekends
- Regaining control and moving forward with his life

### Frustrations (Current State)
- Cannot find a single, clear explanation of all debt solution options in one place
- Government websites use legal language he does not understand
- No way to apply online; must attend an appointment during working hours
- Called AiB three times for a status update and was told to wait
- Filled in the same personal details on three different forms for his money adviser

### Responsibilities
- Provide accurate financial information about income, expenditure, and debts
- Upload or post supporting evidence (payslips, bank statements, debt letters)
- Respond to requests for additional information within statutory timescales
- Attend any required meetings or hearings

### User Journeys in IAAS
- Complete the financial assessment questionnaire to receive a product recommendation
- Upload payslips and bank statements as supporting evidence
- Submit a Minimal Asset Process (MAP) application based on the recommendation
- Track application status through the citizen dashboard and receive SMS notifications

### System Interactions
- Citizen portal: financial assessment, application form, document upload, status tracker
- Notification service: SMS and email alerts for status changes
- Payment service: fee payment (if applicable to recommended product)

### Quote
> "I just want someone to tell me what I'm meant to do. I don't understand the difference between all these options and I can't afford to get it wrong."

---

## Fiona MacRae — Money Adviser (Citizens Advice Scotland)

**Age:** 42 | **Location:** Glasgow (Partick) | **Tech Confidence:** High

### Background
Fiona is a senior money adviser at Citizens Advice Scotland's Glasgow bureau. She holds the Wiseradviser qualification and has worked in debt advice for 14 years. She manages a caseload of 40-50 active clients at any time and supervises two trainee advisers. She is proficient with technology but frustrated by the number of disconnected systems she must navigate daily.

### Goals
- Submit applications on behalf of clients quickly and without re-keying data
- See all her clients' AiB cases in one place regardless of product type
- Receive proactive alerts when cases need attention rather than chasing manually
- Reduce the time spent on administration so she can see more clients
- Provide clients with accurate timescales and progress information

### Motivations
- Helping vulnerable people through one of the most stressful periods of their lives
- Professional pride in providing accurate, timely advice
- Reducing waitlists at the bureau by processing cases faster

### Frustrations (Current State)
- Must log into BASYS, eDEN, and DAS Register separately for different clients
- Re-keys the same client details (name, address, NI number, debts) into each system
- No visibility of whether a client has existing cases in other AiB systems
- Compiles paper application packs with photocopied evidence for postal submission
- Receives no notification when a case progresses; must phone AiB to check
- Training new advisers takes months because each system has different workflows

### Responsibilities
- Assess clients' financial circumstances and advise on appropriate debt solutions
- Complete and submit applications on behalf of clients with their informed consent
- Gather and submit supporting evidence
- Respond to AiB queries within required timescales
- Keep clients informed of progress

### User Journeys in IAAS
- Log in to the adviser portal and access a client's pre-populated financial assessment
- Review the recommendation engine's suggested product and override if professional judgement differs
- Submit a DAS application with uploaded income/expenditure evidence
- Monitor a dashboard of all active client cases and respond to information requests

### System Interactions
- Adviser portal: client caseload view (interface demonstration on synthetic data; client management and bulk operations are 🎯 **TARGET** — **not implemented**)
- Recommendation engine: review and accept/override suggestions
- Document upload: attach evidence on behalf of clients
- Notification service: email alerts for case status changes and deadlines

### Quote
> "I spend half my day logging into different systems and typing the same information over and over. If I could get that time back, I could see ten more clients a month."

---

## Karen MacLeod — AiB Senior Case Officer

**Age:** 51 | **Location:** Kilmarnock | **Tech Confidence:** Medium

### Background
Karen has worked at AiB for 15 years, progressing from administrative officer to senior case officer. She manages a team of six case officers processing DAS and MAP applications. She is deeply knowledgeable about insolvency legislation and procedures but finds new technology changes disruptive unless well supported. She commutes to the Kilmarnock office but works from home two days per week.

### Goals
- Ensure her team meets statutory timescales on every case
- Have a complete view of each debtor's history before making decisions
- Reduce the time her team spends on low-value administrative tasks
- Maintain quality and consistency of decisions across her team
- Support less experienced officers with complex or borderline cases

### Motivations
- Professional responsibility to make correct decisions that affect people's lives
- Pride in her team's performance and SLA compliance record
- Desire to focus on complex cases that require human judgement rather than routine processing

### Frustrations (Current State)
- Must check BASYS, eDEN, and ASTRA separately to understand a debtor's full history
- Paper applications arrive with missing information, requiring back-and-forth by post
- Manual allocation of cases means uneven workload distribution across the team
- No real-time view of team SLA compliance; relies on weekly spreadsheet reports
- Cannot easily identify patterns (e.g., repeated applications, adviser quality issues)

### Responsibilities
- Review and approve complex or escalated case decisions
- Monitor team workload and reallocate cases when officers are absent
- Ensure statutory timescales are met across all active cases
- Quality-assure decisions made by junior officers
- Report team performance to the operations manager

### User Journeys in IAAS
- Review the team workload dashboard each morning and reallocate cases approaching SLA breach
- Open a flagged application, review the automated eligibility assessment, and approve or escalate
- Access the unified debtor record to check for prior applications across all products
- Generate a weekly team performance report for the operations manager

### System Interactions
- Staff portal: case workqueue, debtor record, decision screens
- Workload dashboard: team allocation, SLA monitoring, capacity planning
- Audit trail: review actions taken on cases by team members
- Reporting: team performance, volumes, outcomes

### Quote
> "I need to see everything about a debtor in one place. At the moment I'm logging into three systems just to check whether someone has applied before."

---

## James Wilson — AiB Case Officer

**Age:** 28 | **Location:** Edinburgh | **Tech Confidence:** High

### Background
James joined AiB three years ago after completing a politics degree at the University of Edinburgh. He processes MAP and sequestration applications daily and is comfortable with technology, often helping older colleagues navigate system issues. He finds the current systems slow and outdated compared to what he uses in his personal life. He is studying for a professional qualification in insolvency.

### Goals
- Process applications quickly and accurately to meet daily targets
- Have all the information he needs on one screen rather than switching between systems
- Reduce time spent on routine checks that could be automated
- Build expertise in complex cases to progress his career
- Avoid errors that result in complaints or rework

### Motivations
- Career progression within AiB or the wider Scottish Government
- Intellectual challenge of complex insolvency cases
- Satisfaction of helping people resolve their debt problems

### Frustrations (Current State)
- Spends 30% of his day on data entry and copying information between systems
- Paper applications are often illegible or incomplete
- Credit check results must be manually requested and waited for
- Cannot see whether an applicant has cases in other AiB systems without asking a colleague
- The training he received on BASYS was minimal and he learns by trial and error

### Responsibilities
- Process a daily allocation of new applications
- Conduct eligibility assessments against statutory criteria
- Request and review credit checks and supporting evidence
- Make or recommend decisions on straightforward cases
- Escalate complex cases to the senior case officer

### User Journeys in IAAS
- Pick up the next case from his prioritised workqueue
- Review the pre-completed application alongside automated credit check results
- Validate eligibility using the system's rules-based assessment and confirm the decision
- Send an automated outcome notification to the applicant

### System Interactions
- Staff portal: workqueue, application review, decision entry
- Credit check integration: automated results displayed in-context
- Eligibility engine: rules-based assessment presented for officer review
- Notification service: trigger outcome communications

### Quote
> "The systems we use feel like they were built in 2005. I spend half my time copying things from one screen to another when the computer should just do it."

---

## Sarah Mitchell — AiB Team Leader

**Age:** 45 | **Location:** Dundee | **Tech Confidence:** Medium

### Background
Sarah manages workload allocation and SLA compliance for the DAS applications team in Dundee. She has 18 years of public sector experience, including seven at AiB. Her role sits between operational case work and management reporting — she ensures the right cases reach the right officers at the right time and flags capacity issues before they become SLA breaches.

### Goals
- Maintain SLA compliance above 95% across her team
- Identify capacity issues early and redistribute work before deadlines are missed
- Provide accurate, timely management information to senior leadership
- Ensure consistent decision quality across officers with varying experience levels
- Reduce the time she spends manually compiling reports

### Motivations
- Team success and recognition for consistent performance
- Supporting her officers' professional development
- Contributing to AiB's digital transformation and being seen as an enabler of change

### Frustrations (Current State)
- Manually tracks workload allocation in a shared spreadsheet updated twice daily
- Cannot see real-time SLA status; discovers breaches only in retrospect
- Compiles weekly performance reports by extracting data from three systems
- Has no early warning when an officer is falling behind on their caseload
- Case complexity varies widely but allocation does not account for this

### Responsibilities
- Allocate incoming cases to officers based on capacity, skill, and product type
- Monitor SLA compliance and intervene before breaches
- Compile and submit weekly and monthly performance reports
- Identify training needs based on error rates and escalation patterns
- Deputise for the operations manager during absence

### User Journeys in IAAS
- Review the real-time workload dashboard at 9am and adjust allocations
- Receive an automated alert that two cases are approaching SLA breach and reassign them
- Generate a monthly performance report with one click from the analytics dashboard
- Review decision consistency metrics and identify officers who may need additional support

### System Interactions
- Workload dashboard: allocation, capacity, SLA tracking
- Reporting and analytics: automated report generation, trend analysis
- Staff portal: case reassignment, officer workload view
- Audit trail: review decisions for quality assurance

### Quote
> "I maintain a spreadsheet with 200 rows that I update by hand twice a day. If someone is off sick, I don't find out cases are stuck until a deadline has already passed."

---

## Robert Anderson — Head of Digital / Operations Manager

**Age:** 55 | **Location:** Edinburgh | **Tech Confidence:** Medium

### Background
Robert is responsible for AiB's digital transformation programme and overall operational performance. He has 25 years of public sector experience including senior roles at Revenue Scotland and the Scottish Courts and Tribunals Service. He understands technology at a strategic level but relies on his delivery teams for technical detail. He reports directly to the Accountant in Bankruptcy and represents AiB at Scottish Government digital governance boards.

### Goals
- Deliver the IAAS platform on time and within budget
- Demonstrate measurable improvements in citizen experience and operational efficiency
- Secure continued funding by evidencing value at each programme gate
- Ensure the platform meets Scottish Government technology standards
- Manage organisational change so staff adopt the new platform willingly

### Motivations
- Leaving a legacy of modernisation at AiB before retirement
- Professional reputation within Scottish Government digital leadership community
- Genuine belief that citizens deserve better public services

### Frustrations (Current State)
- Cannot produce a single report showing all insolvency activity in Scotland
- Each legacy system has different vendors, contracts, and support arrangements
- Digital spend is consumed by maintaining outdated systems rather than innovation
- No citizen satisfaction data because there is no digital channel to measure
- Staff resist change because previous IT projects caused disruption without clear benefit

### Responsibilities
- Own the IAAS programme business case and benefits realisation plan
- Chair the programme board and report to the Accountant in Bankruptcy
- Manage relationships with technology suppliers and Scottish Government Digital
- Ensure compliance with Technology Assurance Framework and spending controls
- Lead organisational change management and staff engagement

### User Journeys in IAAS
- Review the executive dashboard showing channel uptake, processing times, and citizen satisfaction
- Present programme progress to the Scottish Government Digital Assurance board
- Approve proposed changes to recommendation engine rules before deployment
- Monitor benefits realisation against the approved business case

### System Interactions
- Executive dashboard: strategic KPIs, trend analysis, benefits tracking
- Reporting: programme status, financial tracking, risk register
- Configuration: approve rule changes flagged for senior sign-off

### Quote
> "Ministers will ask me whether this investment has made a difference. I need data that proves it — not in six months, but in real time."

---

## Margaret Fraser — Policy Manager

**Age:** 48 | **Location:** Edinburgh | **Tech Confidence:** Low

### Background
Margaret is a senior policy official responsible for DAS and PTD regulations within AiB. She drafts secondary legislation, develops operational policy, and ensures AiB's processes align with the Bankruptcy (Scotland) Act 2016 and subsequent amendments. She has a law degree and 20 years of policy experience. She finds technology frustrating when it requires developer involvement to implement straightforward rule changes.

### Goals
- Update eligibility rules and thresholds without raising a development request
- Model the impact of proposed policy changes before implementation
- Ensure the recommendation engine reflects current legislation accurately
- Maintain an audit trail of all rule changes for parliamentary scrutiny
- Understand how policy changes affect application volumes and outcomes

### Motivations
- Getting policy right so that citizens receive appropriate debt relief
- Responding quickly to ministerial requests for policy adjustments
- Ensuring AiB's processes remain legally compliant at all times

### Frustrations (Current State)
- Rule changes require a software development request with 6-8 week lead time
- Cannot test the impact of threshold changes without asking analysts to extract data manually
- No clear record of when rules were changed and by whom
- Policy intent is sometimes lost in translation to system logic
- Relies on case officers to report when rules are producing unexpected outcomes

### Responsibilities
- Draft and maintain operational policy for DAS, PTD, and MAP products
- Define eligibility criteria and thresholds for each debt solution
- Review and approve changes to the recommendation engine's rule set
- Respond to parliamentary questions and FOI requests about policy
- Engage with stakeholder groups (money advice sector, creditor bodies) on policy consultations

### User Journeys in IAAS
- Log into the rules configuration interface and adjust the MAP asset threshold from £2,000 to £2,500
- Run an impact simulation showing how many historical applications would change outcome
- Review the change in a staging environment and approve for production deployment
- Generate an audit report showing all rule changes made in the current financial year

### System Interactions
- Rules configuration interface: eligibility thresholds, product criteria, scoring weights
- Impact modelling: simulation against historical data
- Audit trail: complete history of rule changes with approver details
- Reporting: policy impact analysis, volumes by product

### Quote
> "When the Minister asks me to change a threshold, I shouldn't have to wait two months for a developer to update a line of code. I wrote the policy — I should be able to update the rule."

---

## David Chen — Security Administrator / CyberOps Analyst

**Age:** 32 | **Location:** Glasgow | **Tech Confidence:** Very High

### Background
David is a cybersecurity specialist within AiB's IT team, responsible for platform security, access management, and threat monitoring. He holds CISSP and CEH certifications and previously worked at the Scottish Government Cyber Resilience Unit. He joined AiB specifically to support the digital transformation programme and ensure the new platform meets Cyber Essentials Plus and Scottish Government security standards from day one.

### Goals
- Maintain zero security breaches on the IAAS platform
- Ensure role-based access control is correctly implemented and reviewed regularly
- Detect and respond to threats within defined SLA timescales
- Achieve and maintain Cyber Essentials Plus certification
- Ensure compliance with GDPR, the Data Protection Act 2018, and Scottish Government security policies

### Motivations
- Protecting vulnerable citizens' sensitive financial data
- Professional pride in maintaining a secure platform
- Staying ahead of emerging threats and maintaining cutting-edge skills

### Frustrations (Current State)
- Legacy systems have inconsistent access control models that are difficult to audit
- No centralised identity management across BASYS, eDEN, and other systems
- Security logging is fragmented and difficult to correlate across systems
- Patching legacy systems is slow due to vendor dependencies and change control processes
- Cannot enforce multi-factor authentication consistently across all AiB systems

### Responsibilities
- Manage user accounts, roles, and permissions across the IAAS platform
- Monitor security event logs and investigate anomalies
- Conduct regular access reviews and remove orphaned accounts
- Respond to security incidents according to the incident response plan
- Maintain platform compliance with security standards and conduct penetration testing

### User Journeys in IAAS
- Review the daily security dashboard showing failed login attempts, privilege escalations, and anomalous access patterns
- Provision a new case officer account with appropriate role-based permissions
- Investigate an alert showing unusual data export volumes from a staff account
- Conduct a quarterly access review and disable accounts for leavers

### System Interactions
- Security dashboard: threat monitoring, alert management, incident tracking
- Identity and access management: user provisioning, role assignment, MFA enforcement
- Audit trail: security event logs, access patterns, data export tracking
- Configuration: security policies, session timeouts, password rules

### Quote
> "People's most sensitive financial information is in this system. One breach would destroy public trust in AiB's digital services. Security cannot be an afterthought."

---

## Claire Thompson — Platform Administrator

**Age:** 38 | **Location:** Edinburgh | **Tech Confidence:** High

### Background
Claire is a platform administrator responsible for the day-to-day technical operation of the IAAS platform. She manages deployments, monitors system health, handles user provisioning requests, and acts as the first point of technical escalation for service issues. She has 12 years of experience in IT operations across Scottish Government bodies and holds AWS and Azure certifications.

### Goals
- Maintain platform availability above 99.5% SLA
- Deploy updates with zero downtime during business hours
- Resolve user access issues within 30 minutes of request
- Ensure monitoring and alerting catches issues before users report them
- Maintain clear documentation of platform configuration and procedures

### Motivations
- Pride in running a reliable platform that staff and citizens depend on
- Continuous improvement of deployment and monitoring processes
- Supporting the organisation's digital transformation through operational excellence

### Frustrations (Current State)
- Legacy system deployments require weekend maintenance windows
- User provisioning involves manual steps across multiple systems
- Monitoring is reactive; issues are often reported by users before alerts fire
- No staging environment for legacy systems makes testing changes risky
- Vendor dependency for BASYS changes means slow resolution of integration issues

### Responsibilities
- Deploy platform updates through the CI/CD pipeline
- Monitor system health and respond to alerts
- Provision and deprovision user accounts based on HR notifications
- Manage environment configuration (dev, staging, production)
- Maintain disaster recovery procedures and conduct regular DR tests

### User Journeys in IAAS
- Review the platform health dashboard each morning and verify all services are green
- Deploy a scheduled release through the CI/CD pipeline and verify in staging before production promotion
- Receive an automated HR notification of a leaver and disable their account within SLA
- Respond to a capacity alert by scaling the application tier and investigating the traffic spike

### System Interactions
- Platform health dashboard: service status, response times, error rates, capacity
- Deployment pipeline: release management, staging, production promotion
- User provisioning: account creation, role assignment, deprovisioning
- Configuration management: environment variables, feature flags, service scaling

### Quote
> "The best infrastructure is the kind nobody notices because it just works. I want citizens and staff to focus on their tasks, not on whether the system is up."

---

## Alastair Campbell — Executive Stakeholder (Accountant in Bankruptcy / CEO)

**Age:** 58 | **Location:** Edinburgh | **Tech Confidence:** Low

### Background
Alastair is the Accountant in Bankruptcy, the statutory officeholder who leads AiB as an executive agency of the Scottish Government. He is a qualified accountant and solicitor with 30 years of experience in public service. He is accountable to Scottish Ministers for the administration of personal insolvency in Scotland and appears before the Scottish Parliament's Economy and Fair Work Committee. He does not use operational systems directly but requires timely, accurate information to make strategic decisions and respond to parliamentary scrutiny.

### Goals
- Deliver a modern, citizen-centred insolvency service that Scotland can be proud of
- Demonstrate value for money from digital transformation investment to Scottish Ministers
- Reduce citizen complaints and increase satisfaction with AiB's services
- Ensure AiB meets all statutory obligations within legislative timescales
- Position AiB as a leader in digital public services within the UK insolvency landscape

### Motivations
- Public service ethos and duty to citizens experiencing financial difficulty
- Organisational legacy and AiB's reputation within Scottish Government
- Accountability to Parliament and Ministers for agency performance

### Frustrations (Current State)
- Receives management information monthly that is already out of date
- Cannot answer ministerial parliamentary questions quickly because data requires manual compilation
- Citizen complaints highlight systemic issues that take months to surface through current reporting
- Has no comparative data showing AiB's performance against other UK insolvency services
- Digital transformation investment is difficult to evidence without real-time metrics

### Responsibilities
- Set strategic direction for AiB as an agency
- Approve programme business cases and spending above delegated thresholds
- Report to Scottish Ministers on agency performance and statutory compliance
- Appear before parliamentary committees and respond to parliamentary questions
- Represent AiB externally with creditor bodies, the money advice sector, and UK-wide insolvency forums

### User Journeys in IAAS
- Open the executive dashboard on a Monday morning to review the prior week's headline performance
- Receive an automated briefing pack before a parliamentary committee appearance showing current volumes, outcomes, and trends
- Review a benefits realisation report showing programme KPIs against business case targets
- Approve a proposed policy rule change that has been flagged as requiring executive sign-off

### System Interactions
- Executive dashboard: headline KPIs, trends, comparisons, alerts
- Reporting: automated briefing packs, benefits realisation, statutory returns
- Approvals: high-impact changes requiring executive authorisation

### Quote
> "When a Minister asks me how many people we helped last month and whether the service is improving, I need to answer in that meeting — not promise to write back in three weeks."

---

*Document ends.*
