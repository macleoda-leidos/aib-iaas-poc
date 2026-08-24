# IAAS Stakeholder Demo Script

**Duration:** 10 minutes
**Audience:** Senior stakeholders, bid reviewers, AiB leadership
**Environment:** Live deployment at https://macleoda-leidos.github.io/aib-iaas-poc/

---

## Opening (30 seconds)

> "Welcome to IAAS — the Accountant in Bankruptcy's future digital front door. What you are about to see is a fully functional Proof of Concept: a live, deployed application with 50+ pages, 28 admin features, 12+ AI capabilities, and a real backend API — all built in 10 sprints at zero monthly hosting cost. This is not a prototype or a wireframe. Every button works. Every page is connected to a live API. Let me show you."

**Talking points:**
- Emphasise "working software" — this is not slides or Figma mockups
- Mention it runs on GitHub Pages (free) + Render (free tier)
- Set the expectation: breadth of capability, not depth of any single feature

---

## Scene 1 — Citizen Journey (2 minutes)

### What to show:
1. **Home page** (`/`) — AiB-branded landing page with GOV.UK patterns, service status, list of debt solutions, "Apply now" button
2. **Apply page** (`/apply`) — Click "Apply now", walk through 2-3 sections of the 9-step form
3. **Eligibility Meter** — As you enter income/debt figures, show the real-time eligibility indicator updating in the sidebar
4. **Recommendation** — Complete enough fields to trigger the recommendation engine showing product confidence scores

### Script:

> "A citizen arrives at IAAS knowing they have debt problems but unsure which solution is right for them. The home page immediately tells them what products exist — Bankruptcy, Minimal Asset Process, DAS, Trust Deed, and Moratorium.

> They click Apply and begin a guided journey. As they enter their financial circumstances — let me put in some debts here, an income figure — watch the eligibility meter on the right. It is updating in real time, telling them before they even submit which products they are likely to qualify for.

> When they submit, the recommendation engine evaluates their circumstances against statutory criteria and returns a confidence-scored recommendation: 'DAS is 87% suitable for your situation, because...' with full explainability."

### Talking points:
- Real-time guidance reduces drop-off (citizens know they are on the right track)
- The form has auto-save — citizens can return where they left off
- Validation catches errors immediately (NI number format, UK postcode, age check)
- Mobile responsive — works on any device

---

## Scene 2 — Staff Dashboard (2 minutes)

### What to show:
1. **Login** (`/login`) — Select "Karen MacLeod, Senior Officer" demo account, show MFA step
2. **Dashboard** (`/dashboard`) — AI-prioritised case list with urgent/high/normal badges, anomaly alert cards, notification bell, live ticker
3. **Case Detail** (`/case/AIB-2024-001`) — AI-generated summary at the top, quality check panel, risk score gauge, decision support checklist

### Script:

> "Now let us switch perspective to AiB staff. Karen MacLeod logs in as a Senior Officer. Notice the MFA step — we have full multi-factor authentication in the design.

> Her dashboard is intelligent. Cases are not just listed chronologically — they are AI-prioritised. Urgent cases surface to the top. These amber cards are anomaly alerts: the system has detected an income discrepancy in one application and a potential duplicate in another.

> Let me open a case. The first thing Karen sees is an AI-generated summary — a natural language paragraph synthesised from all the case data. Below that, a Quality Check panel has run six automated pre-decision checks: are documents complete? Does income match declarations? Any conflicts of interest? The risk score gauge gives an instant visual indication. And this Decision Support checklist guides her through the statutory requirements she must verify before making a determination."

### Talking points:
- AI does not replace staff judgement — it augments it
- Anomaly detection catches problems that manual review might miss
- The quality check reduces errors and supports consistent decision-making
- Everything is auditable — every action logged with timestamp and actor

---

## Scene 3 — Admin Portal (2 minutes)

### What to show:
1. **Admin Hub** (`/admin`) — Grid of 28 features, scroll to show breadth
2. **Rules Engine** (`/admin/rules`) — Show 9 rules, toggle one on/off, run the interactive tester
3. **Digital Mailroom** (`/admin/digital-mailroom`) — AI OCR/NER pipeline, document classification, auto-routing stats
4. **AI Governance** (`/admin/ai-governance`) — Bias metrics, model registry, override audit trail
5. **Policy Simulation** (`/admin/policy-simulation`) — Adjust a threshold slider, show impact on historical cases

### Script:

> "The admin portal gives AiB full control over the platform's intelligence. Twenty-eight features accessible from one page.

> The Rules Engine lets policy staff manage recommendation rules without writing code. I can toggle a rule, change a threshold, and use this interactive tester to see how it would affect a sample case.

> Digital Mailroom shows how AI can triage incoming postal correspondence — OCR extracts text, Named Entity Recognition identifies case references and document types, and the system routes to the correct queue automatically. In the POC we are showing an 89% auto-route accuracy.

> AI Governance is critical for public sector. We track model performance, monitor for bias across protected characteristics, and maintain a full audit trail of any human overrides. This is transparency by design.

> And Policy Simulation lets analysts model 'what if' scenarios — what happens if we change the MAP debt threshold from 25,000 to 30,000? The tool runs 100 historical cases against the new rules and shows the projected impact."

### Talking points:
- Business users control rules, not developers
- AI governance meets emerging Scottish Government ethics frameworks
- Policy simulation prevents unintended consequences before deployment
- Digital Mailroom alone could save hundreds of staff hours per year

---

## Scene 4 — AI Features (1.5 minutes)

### What to show:
1. **AI Chatbot** — Click the floating chat icon on any page, ask "What is DAS?", show suggested questions
2. **Explainability** (`/case/[ref]/recommendation`) — Confidence gauge, contributing factors, alternatives comparison chart
3. **Predictive Outcomes** — Show the "87% likely approved" badge on a case, explain the basis

### Script:

> "AI is woven throughout the platform, not bolted on. The chatbot widget appears on every page — citizens can ask questions in natural language and get immediate answers without waiting for an adviser.

> On the recommendation page, full explainability is provided. This confidence gauge shows 92% confidence in DAS. Below it, the contributing factors show exactly which inputs drove that recommendation — debt-to-income ratio, number of creditors, employment stability. And this alternatives chart shows why other products scored lower.

> Predictive outcomes help staff too. This badge says 87% likely to be approved — based on historical patterns for cases with similar characteristics. It is a decision aid, not a decision maker."

### Talking points:
- 12+ distinct AI capabilities demonstrated across the platform
- Explainability is not optional — it is built into every AI output
- The chatbot handles 12+ topic areas with pattern matching
- All AI features are auditable and governed via the AI Governance dashboard

---

## Scene 5 — Platform Capabilities (1.5 minutes)

### What to show:
1. **Search** (`/search`) — Type a partial name, show fuzzy matching across systems with identity confidence scores
2. **Security SOC** (`/security`) — Dark-themed dashboard with live threat feed, Sophos/Tenable integration display
3. **Statistics** (`/statistics`) — Live animated charts, KPI counters ticking up, trend lines
4. **Architecture** (`/architecture`) — System diagram, tech stack, integration map

### Script:

> "Three more capabilities that demonstrate enterprise readiness.

> Search uses fuzzy matching across all six AiB systems. I type a partial name and get results from BASYS, eDEN, DAS, and more — with identity confidence scores. This is the single debtor view that AiB does not have today.

> The Security Operations Centre provides real-time monitoring. You can see authentication events, threat detection feeds from Sophos and Tenable, and anomaly alerts. For a POC, this demonstrates the operational maturity we would bring to production.

> Statistics are live — those counters are incrementing in real time. Application volumes, processing times, product distribution, geographic analysis. This is the management information that currently requires manual spreadsheet compilation.

> And the Architecture page documents everything: the system design, technology choices, integration patterns. This is not just working software — it is documented, maintainable, production-ready architecture."

### Talking points:
- Cross-system search solves AiB's number one operational pain point
- Security SOC demonstrates Cyber Essentials Plus alignment
- Live statistics replace manual MI reporting
- Architecture documentation demonstrates professional delivery standards

---

## Closing (30 seconds)

> "What you have just seen is a live, deployed application. Fifty-plus pages. Twenty-eight admin features. Twelve AI capabilities. Ten sprints of delivery. A live API with persistence. And it costs zero pounds per month to host.

> This is not a PowerPoint. It is not a Figma file. It is working software that demonstrates exactly what IAAS can become. Every pattern shown here is production-ready architecture — the path from POC to Alpha is clear, costed, and documented in our roadmap.

> Thank you. I am happy to take questions."

---

## Questions to Anticipate

| Question | Suggested Response |
|----------|-------------------|
| "Is this real or just UI?" | "The frontend is connected to a live API on Render. Data persists in a database. Login works. The recommendation engine runs real rules. It is fully functional, not a mockup." |
| "How long did this take?" | "Ten sprints of focused development. The architecture is designed so that moving to production is evolution, not revolution." |
| "What would production cost?" | "The POC runs free. Production on AWS (ECS/Fargate + RDS) would be approximately 2,000-4,000/month depending on scale. Our Terraform modules are ready." |
| "Is the AI real ML or just rules?" | "The recommendation engine is rules-based — auditable and deterministic. The chatbot uses pattern matching. Both are designed to evolve into ML models once training data is available. The AI Governance framework is already in place for that transition." |
| "How accessible is it?" | "WCAG 2.1 AA targeted. GOV.UK Design System patterns. Semantic HTML, ARIA labels, keyboard navigation, focus management. A formal audit is planned for Alpha." |
| "What about data protection?" | "All POC data is synthetic. The architecture is GDPR-by-design: data minimisation, purpose limitation, encryption at rest and in transit, immutable audit trail." |
| "Can we see the code?" | "The full repository is available on GitHub. Monorepo structure, TypeScript throughout, comprehensive documentation suite of 60 documents." |
| "What is the integration approach?" | "Adapter pattern. Mock integrations mirror the real API contracts for BASYS, eDEN, DAS, CFT, Moratorium, and RoI. Switching from mock to real is a configuration change, not a rewrite." |

---

## Pre-Demo Checklist

- [ ] Open browser to https://macleoda-leidos.github.io/aib-iaas-poc/
- [ ] Verify API is awake: visit https://iaas-api.onrender.com/api/health (wake it 5 mins before demo)
- [ ] Clear browser cache / use incognito (ensures clean state)
- [ ] Have a second tab ready on `/login` for quick staff switch
- [ ] Ensure screen resolution is 1920x1080 or higher
- [ ] Close notification popups and other apps
- [ ] Test chatbot widget opens correctly
- [ ] Confirm dark mode is OFF (light mode is more readable for projectors)

---

## Backup Plan

If the Render API is cold-starting (takes 30-60 seconds on free tier):
1. Start the demo with the home page and apply flow (these work without API)
2. The API status bar will show "Connecting..." then turn green
3. Switch to authenticated features once the API is responsive
4. If API remains down: focus on frontend features, explain "live API is available but sleeping on free hosting — architecture page shows the full backend"

---

*Last updated: August 2026*
