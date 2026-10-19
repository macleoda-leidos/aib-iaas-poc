# DWP / Benefits-Check Integration — Options Appraisal

> **Status:** Options paper for the AiB IAAS Proof of Concept.
> **Scope:** How a DWP / benefits-check integration would build on the income/expenditure (I&E) capture and the statute-backed Common Financial Tool (CFT) contribution engine that already exist in the POC.
> **POC honesty note:** IAAS is a Proof of Concept running on synthetic data. There are no live external integrations: `INTEGRATION_MODE=live` throws (`packages/integration-contracts/src/factory.ts:92-99`) and only `mock` works today. Everything in this paper that depends on a real DWP connection is therefore a proposal, not a built capability. Figures are not invented — the only monetary figures quoted are the ones already in the codebase, and the trigger figures are the POC's labelled stand-ins, not the licensed published CFS set.

---

## 1. Executive summary

IAAS does not start from a blank sheet for benefits. The apply journey already captures **structured income and expenditure** against named categories — including a first-class `benefits` income line (`packages/shared-types/src/financial.ts:22`, captured at `apps/web/src/app/apply/page.tsx:1360`) — and that structured data already feeds a **statute-backed contribution assessment**: the Common Financial Tool engine in `packages/statutory`, reachable through a live endpoint (`GET /api/applications/:id/cft-assessment`, `services/api-gateway/src/routes/applications.ts:348-389`).

The engine (`assessContribution`, `packages/statutory/src/cft.ts:116`) implements the Common Financial Statement logic of reg.15 of the Bankruptcy (Scotland) Regulations 2016, compares declared expenditure to published **trigger figures**, flags reg.17 evidence obligations, and computes the reg.16 contingency allowance. The product recommendation cascade (`services/recommendation-service/src/engine/rules.ts:23`) already turns disposable income — income minus expenditure — into a deterministic, statute-cited product recommendation.

Against that foundation, a DWP / benefits integration is a **natural, high-value extension rather than a greenfield build**. The data model, the consent patterns (credit-check already records explicit consent with a 90-day expiry), the immutable audit log, and the integration-contract factory that currently swaps mock for live are all in place. What is missing is a real DWP connection, a lawful basis, and a Data Protection Impact Assessment (DPIA). This paper sets out four integration options, maps each to the recommendation engine and the CFT assessment, and proposes a phased delivery that starts with capabilities we can build today and defers the real-time DWP connection until the legal and architectural prerequisites are met.

---

## 2. The existing foundation

Everything below is in the repository today. This is the material a benefits integration would attach to.

### 2.1 Structured income & expenditure capture

- The apply journey has a dedicated **"Income & Expenditure"** step (`apps/web/src/app/apply/page.tsx:30`), explicitly aligned in the UI copy to the **Common Financial Tool** used across all Scottish debt solutions (`apply/page.tsx:1354`).
- Income is captured against named fields — **wages, benefits, pension, other** (`apply/page.tsx:1359-1362`) — with `benefits` as a first-class line, not free text.
- Expenditure is captured against **rent/mortgage, council tax, utilities, food, transport, insurance, childcare, other** (`apply/page.tsx:1368-1372`).
- The shared type `Income` (`packages/shared-types/src/financial.ts:20-26`) and `Expenditure` (`financial.ts:28-39`) formalise these as typed structures, not loose maps.
- On submit, the journey folds this into an `incomeExpenditure` block with totals (`apply/page.tsx:724-728`).

The point for a benefits integration: **benefit income is already a discrete, typed field in the capture model.** We are not retrofitting a place to put it — we are proposing to *verify and enrich* a value the system already collects.

### 2.2 The CFT contribution engine (`packages/statutory`)

The engine is a faithful POC implementation of the Scottish Common Financial Statement route, not a generic affordability calculator:

- **`assessContribution(input)`** (`packages/statutory/src/cft.ts:116`) is the entry point. It takes a `CftInput` of income, expenditure, trigger figures, and optional statutory allowances.
- **`CftIncome`** (`cft.ts:25-30`) is `{ wages, benefits, pension, other }` — benefit income is a named input to the assessment itself, which is why verified benefit data would flow straight into it.
- **`CftExpenditure`** (`cft.ts:32-41`) is the eight-category structure matching the capture form.
- **Trigger-figure logic (reg.15):** expenditure is assessed against the *greater* of what the debtor declared and the published trigger total (`cft.ts:149-152`); a debtor spending under the triggers is not assessed as if they could contribute the difference.
- **Per-category excess tracking (reg.17):** each category over its trigger is recorded as a `TriggerExcess` and sets `evidenceRequired: true` (`cft.ts:129-147`, `cft.ts:189`), because reg.17 attaches an evidence duty to each excess individually — netting them off would hide what the evidence is owed against.
- **Statutory allowances:** aliment and child support are additive under s.89(4) (`cft.ts:155-156`); guaranteed minimum pension income is a protected floor under s.89(3) (`cft.ts:159-161`).
- **Contingency allowance (reg.16):** up to 10% of the contribution, capped absolutely by payment frequency — **£4.62 weekly, £9.23 fortnightly, £20 monthly** (`cft.ts:92-96`, mirrored as citable thresholds in `packages/statutory/src/thresholds.ts:103-108`).
- **`contribution`** is income less allowed expenditure, floored at zero — "a deficit is not a contribution" (`cft.ts:80`, `cft.ts:166`).
- Every assessment returns `citations[]` naming the exact provisions applied (`cft.ts:171-181`).

### 2.3 `INDICATIVE_TRIGGER_FIGURES` — the labelled POC stand-in

The engine ships a set of indicative monthly trigger figures (`cft.ts:203-212`): rent 700, council tax 140, utilities 180, food 300, transport 160, insurance 60, childcare 250, other 120. These are **explicitly labelled as a POC stand-in** in the source — "the real CFS trigger figures are published annually and licensed; these are plausible stand-ins so the assessment can be demonstrated end to end" (`cft.ts:195-202`). The endpoint echoes this honestly in its response payload: `triggerFiguresSource: 'INDICATIVE (POC stand-in — not the licensed published CFS figures)'` (`applications.ts:382`). Any production deployment, with or without DWP integration, must swap these for the licensed published set.

### 2.4 The CFT assessment endpoint

`GET /api/applications/:id/cft-assessment` (`applications.ts:348-389`) is a thin route that:

1. Resolves the application and enforces the same ownership/capability guard as `GET /:id` (`applications.ts:359-364`) — staff, the owning debtor, or an anonymous caller holding the application-scoped capability token.
2. Reads the stored `incomeExpenditure`, returning `NO_FINANCIALS` if absent (`applications.ts:366-370`).
3. Maps the stored flexible `Record<string, number>` onto the fixed CFT shapes via **`foldToShape`** (`applications.ts:19-29`), using `CFT_INCOME_KEYS` and `CFT_EXPENDITURE_KEYS` (`applications.ts:14-17`). Any unrecognised category is folded into `other` so the declared total is preserved rather than silently dropped.
4. Calls `assessContribution` with `INDICATIVE_TRIGGER_FIGURES` and returns the assessment plus the honesty label.

This is the exact join point a benefits integration plugs into: **it already turns declared I&E into a statutory contribution figure.** Verified benefit income would improve the `income.benefits` value going in; everything downstream is already wired.

### 2.5 Adjacent patterns a benefits integration would reuse

- **Adviser submit-on-behalf** with recorded authority: `applications.ts:269-285` stamps `submittedByUserId` and `authorityDeclaredAt` when a permitted user sets `authorityDeclared: true`, taking the identity from the verified token, never the body. This is the exact pattern an adviser-assisted benefits check needs.
- **Explicit consent recording:** the credit-check service refuses to run without `consentGiven` (`services/credit-check-service/src/routes/credit-check.ts:38-44`) and has a dedicated consent-recording endpoint that stamps a `consentType`, a timestamp, and a 90-day expiry (`credit-check.ts:126-142`).
- **Immutable audit:** every state-changing action writes an audit event whose actor is derived from the verified token, not the request body (`auditActor`, `applications.ts:147-157`).
- **Integration-contract factory:** `createCreditClient` and siblings (`packages/integration-contracts/src/factory.ts`) select mock vs live from `INTEGRATION_MODE`; the `ICreditClient` interface already models a consent-bearing lookup (`runCheck(params & { consentGiven })`, `interfaces.ts:43-46`). A `createBenefitsClient` would follow the identical shape.

---

## 3. Integration options

Four options, each assessed against business value, feasibility, security, privacy, UX, and recommendation-engine value, then mapped to the outcomes the briefing asks for (debt advice quality, product-recommendation accuracy, affordability/contribution assessment, adviser productivity, fraud reduction, evidence automation).

### 3.1 Option A — Consent-based citizen benefits check

The citizen, inside the apply journey, authorises a **real-time DWP entitlement/award lookup** and the result pre-fills (or verifies) the `benefits` income line.

- **Business value — High.** Benefit income is one of the hardest figures for citizens to state accurately (multiple awards, different frequencies, recent uprating). A real-time pull removes guesswork and reduces downstream rework. It directly improves the quality of every assessment that depends on income.
- **Feasibility — Low-to-Medium (today).** Architecturally straightforward — it mirrors the existing credit-check consent-then-lookup flow and would slot into the integration-contract factory. The blocker is entirely external: a real DWP entitlement API, a lawful basis (plausibly Digital Economy Act 2017 Part 5 public-service-delivery powers, plus a data-sharing agreement), and a DPIA. None of that is a code problem.
- **Security — Medium concern.** Reuses real HS256 JWT auth, the default-deny gate, and the application-scoped capability token for anonymous apply-journey callers. The new surface is the outbound DWP call: it needs mutually-authenticated transport, secrets management (the POC already refuses the dev JWT secret in production), and tight scoping so a token can only pull the subject's own award.
- **Privacy — High sensitivity.** Benefit award data is special-category-adjacent and highly sensitive. Needs explicit, informed, revocable consent; data minimisation (pull only the fields the CFT needs — benefit type and amount, not the full case history); and a short retention window. See §5.
- **UX — Strong positive.** One consent screen, one button, pre-filled figures. It shortens the single most error-prone step of the journey. The consent language must be genuinely informed, not a dark pattern.
- **Recommendation-engine value — High.** Verified benefit income sharpens `monthlyIncome`, hence disposable income, hence the whole product cascade (§4). It also raises `confidence` on the resulting recommendation because the single largest input uncertainty is removed.

Outcome mapping: **debt-advice quality** ↑ (accurate income), **recommendation accuracy** ↑↑, **affordability/CFT** ↑↑ (feeds `income.benefits` directly), **adviser productivity** ↑ (less chasing), **fraud reduction** ↑ (declared vs actual gap closes), **evidence automation** → see Option D.

### 3.2 Option B — Adviser-assisted check (submit-on-behalf, recorded authority)

A money adviser runs the benefits check on behalf of a client, under recorded authority, inside a case they are handling.

- **Business value — High, and the most realistic first live use.** Advisers are supervised professionals operating under existing information-sharing norms; running a check through an authenticated, audited adviser is a lower-risk route to a live DWP connection than exposing it to anonymous citizens. It also serves the digitally-excluded, who are a material share of the debt-advice population.
- **Feasibility — Medium.** The hardest part is already modelled: IAAS records submit-on-behalf with declared authority (`applications.ts:274-284`, `authorityDeclared` / `submittedByUserId` / `authorityDeclaredAt`), the identity taken from the verified token. A benefits check would reuse this exact authority record as its lawful-basis evidence. Advisers are gated by the `applications.create` permission already.
- **Security — Lower concern than Option A.** The caller is authenticated staff/adviser, not anonymous; the capability-token machinery is not even needed. RBAC permissions scope who may invoke it. Note the residual: org-boundary isolation is partial (role-based, not fully tenant-scoped on every route) — an adviser-run check must be constrained to the adviser's own client/case.
- **Privacy — High sensitivity, but better governed.** The authority declaration gives a recorded, timestamped basis for the lookup, and the actor is bound from the token. Still needs the same DPIA and data-minimisation discipline.
- **UX — Strong for the adviser, indirect for the citizen.** Fits the caseworker/adviser screens rather than the public journey. The citizen experiences a faster, more accurate assessment without touching the DWP flow themselves.
- **Recommendation-engine value — High**, identical downstream to Option A once the verified figure lands in `income.benefits`.

Outcome mapping: **adviser productivity** ↑↑ (no manual benefit-statement chasing), **debt-advice quality** ↑↑, **recommendation accuracy** ↑↑, **affordability/CFT** ↑↑, **fraud reduction** ↑, **evidence automation** ↑ (authority record doubles as audit evidence).

### 3.3 Option C — Entitlement / income verification (reconciliation)

Rather than pre-filling, this verifies a **declared** benefit figure against DWP and surfaces the delta — the citizen or adviser still enters a value, and the system flags mismatches for confirmation.

- **Business value — High for assessment integrity.** This is the option that most directly protects the CFT contribution figure and the recommendation from bad input, whether through error or misstatement. It is also the gentlest on consent, because it verifies rather than harvests.
- **Feasibility — Medium.** Needs the same DWP connection as A/B, but the integration surface is narrower: a yes/no-plus-amount verification, not a full award pull. Easier to scope-minimise and easier to get past a DPIA.
- **Security — Medium**, same outbound-call considerations as Option A.
- **Privacy — Best of the real-time options.** Pure verification can be designed to return a match/variance signal rather than the underlying award detail, which is strong data minimisation. Consent is still required, but the data footprint is smallest.
- **UX — Neutral to positive.** A confirmation/variance prompt rather than a silent auto-fill. Slightly more friction than A, but it keeps the citizen in control of the stated figure.
- **Recommendation-engine value — High for confidence.** A verified figure lets the engine attach genuinely higher `confidence`; a flagged variance is exactly the signal a money adviser should see before a statutory recommendation is issued.

Outcome mapping: **affordability/CFT** ↑↑ (protects the input), **recommendation accuracy** ↑↑, **fraud reduction** ↑↑ (this is the fraud-reduction option), **debt-advice quality** ↑, **adviser productivity** ↑, **evidence automation** → partial.

### 3.4 Option D — Evidence auto-gathering

Instead of the citizen uploading award letters manually, IAAS pulls the proof (award notices / entitlement statements) automatically and attaches them to the case via the existing Document Service.

- **Business value — High, and uniquely tied to reg.17.** The CFT engine already computes `evidenceRequired` and lists each `TriggerExcess` needing a reg.17 supporting statement (`cft.ts:140-147`, `cft.ts:189`). Auto-gathered benefit evidence is precisely the proof that discharges part of that obligation. This option turns a compliance burden into an automated step.
- **Feasibility — Medium-to-High complexity.** Depends on DWP exposing retrievable documents, not just data, which is a bigger ask than a figure lookup. The receiving side exists — the Document Service handles upload, storage and the ClamAV simulation — but note the honest caveat: the document upload filter is extension-only (no deep content/MIME sniffing beyond the ClamAV sim), which must harden before machine-sourced documents are trusted.
- **Security — Medium-high concern.** Machine-fetched documents entering a store that currently does shallow validation is a real surface. Needs provenance metadata, integrity checks, and tighter content inspection.
- **Privacy — High sensitivity.** Award letters contain more than the figure the CFT needs; pulling whole documents weakens data minimisation relative to Option C. Justify against the reg.17 evidence need specifically, and retain only as long as the case requires.
- **UX — Strong positive.** Removes the single most-abandoned step of many benefit-related journeys (finding and uploading a letter).
- **Recommendation-engine value — Indirect.** It does not change the numbers the engine reads; it strengthens the evidential record behind the assessment and the reg.17 compliance posture.

Outcome mapping: **evidence automation** ↑↑ (this is the evidence option), **adviser productivity** ↑↑, **debt-advice quality** ↑, **affordability/CFT** → supports (discharges reg.17 evidence), **fraud reduction** ↑ (documentary corroboration), **recommendation accuracy** → neutral/indirect.

### 3.5 Option comparison at a glance

| Option | Business value | Feasibility today | Privacy sensitivity | Primary payoff |
|---|---|---|---|---|
| A — Citizen check | High | Low–Med (external blockers) | High | Accurate income, best UX |
| B — Adviser-assisted | High | Medium (authority model exists) | High (better governed) | Lowest-risk first live route |
| C — Verification | High | Medium (narrow surface) | Lowest of the four | Fraud reduction + confidence |
| D — Evidence auto-gather | High | Med–High | High (whole documents) | reg.17 evidence automation |

---

## 4. Mapping to the recommendation engine

The recommendation cascade (`services/recommendation-service/src/engine/rules.ts:23`) is deterministic and statute-backed, and its single most load-bearing derived value is **disposable income = monthly income − monthly expenditure** (`rules.ts:24`). Benefit income is a component of that income total, so verifying it sharpens every branch that keys off disposable income or affordability:

- **DAS (Debt Arrangement Scheme).** Eligibility gates on `disposableIncome > 0` within the statutory debt range (`rules.ts:166-172`), and the `confidence` band is set directly by the size of the surplus — high above £200, medium above £100, low above £0 (`rules.ts:186`). An under-declared benefit could put a genuinely-eligible debtor below zero and route them away from DAS; an over-declared one inflates confidence falsely. Verified benefit income makes both the eligibility decision and the confidence band trustworthy.
- **MAP (Minimal Asset Process).** The MAP branch requires `disposableIncome <= 50` alongside the asset and debt tests (`rules.ts:131-135`). This £50 ceiling is one of the engine's most sensitive boundaries — a small benefit mis-statement can flip a case in or out of MAP. Verified income is exactly what makes a £50-boundary decision defensible.
- **DPP (Debt Payment Programme).** Keys off whether debt is repayable within the default contribution period (`DCO.defaultPeriodMonths` = 48, `rules.ts:112`) at the current surplus. Accurate surplus → accurate months-to-repay → correct DPP-vs-alternative call.
- **PTD and sequestration.** The trust-deed deferral (`rules.ts:166`) and the no-surplus sequestration arm (`rules.ts:222-225`, starting at `SEQUESTRATION_MIN_DEBT` = £3,000) both depend on whether the debtor has a surplus at all. Verified benefit income decides which side of "can offer something to creditors" the case falls.
- **Confidence.** Because confidence is partly a function of surplus size, removing the largest source of input uncertainty (self-stated benefit income) legitimately raises confidence rather than inflating it.

And on the **CFT contribution figure** specifically: `assessContribution` reads `income.benefits` as a named input (`cft.ts:27`), sums it into `totalIncome` (`cft.ts:117-119`), and the `contribution` is `totalIncome − allowedExpenditure` floored at zero (`cft.ts:166`). Verified benefit income therefore flows straight into the statutory contribution number returned by `GET /:id/cft-assessment` — the same number a caseworker would quote, with reg.15/16/17 citations attached. A production deployment would pair this with the licensed trigger figures replacing `INDICATIVE_TRIGGER_FIGURES`.

**Net effect:** benefits verification does not require a new engine or new rules. It improves the fidelity of one input that the existing deterministic cascade and the existing CFT assessment already consume, and it lets the system attach honestly-higher confidence to the output.

---

## 5. Privacy & consent

DWP benefit data is among the most sensitive personal data a public service handles. This section is deliberately cautious: the POC demonstrates the *patterns*, but a live integration needs formal governance that does not exist yet.

- **Lawful basis.** A live DWP data share would need an explicit legal gateway — plausibly the Digital Economy Act 2017 Part 5 public-service-delivery powers plus a bilateral data-sharing agreement, under UK GDPR and the Data Protection Act 2018. This is a legal determination, not an engineering one, and must precede any build. **This paper does not assert that a basis exists.**
- **Consent model.** IAAS already has the shape: the credit-check service refuses to proceed without `consentGiven` (`credit-check.ts:38-44`) and records consent with a type, timestamp and 90-day expiry (`credit-check.ts:126-142`). A benefits check would reuse this — explicit, informed, specific to the DWP lookup, and revocable. For adviser-assisted checks (Option B), the recorded authority declaration (`authorityDeclaredAt`, `applications.ts:284`) provides a complementary, timestamped basis.
- **Data minimisation.** Pull only what the CFT needs. Option C (verification returning match/variance) is the strongest here; Option D (whole award letters) is the weakest and must be justified against the specific reg.17 evidence need. Do not store the full DWP case history.
- **Retention.** Short, purpose-bound retention aligned to the life of the application and any statutory record-keeping duty — not indefinite. The 90-day consent expiry already in the credit-check pattern is a sensible default to build from.
- **Audit.** Every lookup must write an immutable audit event. The pattern exists: `auditActor` binds the actor from the verified token, never the request body (`applications.ts:147-157`), and the audit log is append-only. A benefits lookup would log who ran it, under what consent/authority, and when — without logging the benefit data itself.
- **Honest gaps.** This needs a **DPIA** and **information-sharing agreements** before any live connection. Residual POC risks remain relevant: session/capability tokens live in browser storage (XSS-exfiltratable in principle, mitigated by the strict CSP but not eliminated), and org-boundary RBAC isolation is only partial. Both must be closed before benefit data flows through the browser or across org boundaries.

---

## 6. Phased delivery

Phases follow the briefing's bucketing (Quick Win = 1 sprint, Near-Term = 2–4, Strategic = 10+) and the 7 scoring criteria (CX · operational efficiency · advice accuracy · caseworker productivity · fraud reduction · implementation complexity [lower=better] · strategic value, each 1–5).

### Phase 1 — Quick Wins (1 sprint): structured consent + manual verification workflow

Build everything that does **not** need a live DWP connection, so value lands immediately and the governance work runs in parallel.

- Add a benefits-specific **consent capture** step reusing the credit-check consent pattern (`credit-check.ts:126-142`): type, timestamp, expiry, audit event.
- Add a **manual verification workflow**: a caseworker/adviser marks a declared benefit figure as "verified against evidence" with a note and audit trail, raising the recommendation confidence accordingly. No external call — this uses the existing I&E, CFT endpoint and audit log.
- Surface the CFT `evidenceRequired` / `triggerExcesses` output (`cft.ts:189`) on the case screen as an explicit "evidence owed" list, so reg.17 obligations are visible.

Scoring: CX **3** · ops efficiency **3** · advice accuracy **4** · caseworker productivity **4** · fraud reduction **2** · complexity **2** (low — all internal) · strategic value **3**. Low complexity, no legal blocker, real workflow value.

### Phase 2 — Near-Term (2–4 sprints): sandbox DWP API behind the integration-contract factory

Introduce a **live-capable client** without exposing citizens to it, pointed at a DWP sandbox.

- Add a `createBenefitsClient` to the factory following the existing `createCreditClient` shape (`factory.ts:92-99`), with an `IBenefitsClient` interface mirroring `ICreditClient`'s consent-bearing `runCheck` (`interfaces.ts:43-46`), and a `BenefitsMockClient` so the POC and tests keep working on synthetic data.
- Wire `INTEGRATION_MODE=live` for this one client to a **sandbox** DWP endpoint. The factory currently throws on `live` for every client (`factory.ts:40-98`); this phase implements the first real live branch — a significant milestone and a template for the others.
- Deliver **Option B (adviser-assisted) and Option C (verification)** first, because they are the lowest-risk live routes: authenticated callers, narrow data surface, recorded authority.
- Requires: sandbox DWP access, a signed-off DPIA, data-sharing agreement, secrets management, and outbound mutual-TLS.

Scoring: CX **3** · ops efficiency **4** · advice accuracy **5** · caseworker productivity **5** · fraud reduction **4** · complexity **4** (external dependencies, first live integration) · strategic value **4**.

### Phase 3 — Strategic (10+ sprints): real-time citizen entitlement at scale

Open **Option A (citizen check)** and **Option D (evidence auto-gathering)** to the public journey at production scale.

- Real-time entitlement lookup inside the anonymous/authenticated apply journey, gated by the capability token for anonymous callers.
- Automated evidence retrieval into the Document Service — **conditional on first hardening document validation** beyond the current extension-only/ClamAV-sim filter.
- Production trigger figures replace `INDICATIVE_TRIGGER_FIGURES` (`cft.ts:203`) under the licensed CFS feed — this is required for *any* production CFT use, benefits or not, but is a hard prerequisite before real-time citizen-facing assessments.
- Requires: production DWP API access and SLAs, scaled consent management, full accessibility/digital-inclusion provision, and the residual-risk closures from §5.

Scoring: CX **5** · ops efficiency **5** · advice accuracy **5** · caseworker productivity **4** · fraud reduction **5** · complexity **5** (highest — scale, public exposure, document trust) · strategic value **5**.

---

## 7. Risks & dependencies

- **`INTEGRATION_MODE=live` is unimplemented.** Every live branch in the factory throws today (`factory.ts:40-98`). Phase 2 implements the first real one; until then this is mock-only, by design.
- **No real DWP connection, API contract, or sandbox access.** This is the critical external dependency and is entirely outside the codebase. Everything live-dependent here is a proposal.
- **Legal basis and governance.** A lawful gateway (e.g. Digital Economy Act 2017 Part 5), a data-sharing agreement, and a signed-off **DPIA** are prerequisites, not deliverables of the build. The POC cannot and does not assert these exist.
- **Trigger figures are a labelled POC stand-in.** `INDICATIVE_TRIGGER_FIGURES` must be replaced with the licensed published CFS set before any production CFT assessment — the endpoint already discloses this (`applications.ts:382`).
- **Document validation is shallow.** Extension-only filtering plus the ClamAV simulation is insufficient for machine-fetched award documents (Option D); harden before trusting external document sources.
- **Browser-stored tokens.** Session and capability tokens in localStorage/sessionStorage are XSS-exfiltratable in principle, mitigated by the strict CSP and the A5 markdown-escaping fix but not eliminated. Relevant wherever benefit data would transit the browser.
- **Partial org-boundary RBAC.** Isolation is role-based, not fully tenant-scoped on every route; an adviser-assisted check (Option B) must be constrained to the adviser's own client/case before going live.
- **Dependency hygiene.** The standing recommendations apply (bump axios ≥ 1.7, run `npm audit` in CI) before adding an outbound DWP HTTP client.

---

*Prepared for the AiB IAAS POC. All code references are to the repository as of the current branch; all monetary figures are either the licensed-figure stand-ins already labelled in `packages/statutory` or the statutory thresholds carried with their citations in `packages/statutory/src/thresholds.ts`. No figures have been invented for this paper.*
