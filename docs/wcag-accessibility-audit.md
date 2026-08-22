# WCAG 2.1 AA Accessibility Audit Report

## Document Control

| Field | Value |
|-------|-------|
| Client | Accountant in Bankruptcy (AiB) |
| System | IAAS — Initial Application Advice Service |
| Standard | WCAG 2.1 Level AA |
| Audit Date | 19–21 August 2026 |
| Assessor | [Simulated] Leidos Accessibility Team |
| Tools | axe-core 4.9, WAVE, Lighthouse, NVDA 2024.2, VoiceOver (macOS 15) |
| Version | 1.0 |
| Status | FINAL |
| Report Date | 21 August 2026 |
| Distribution | AiB Digital Services, AiB Policy, Leidos Delivery |

---

## Executive Summary

The IAAS (Initial Application Advice Service) web application was audited against the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA conformance. The audit combined automated tooling, manual expert review, and assistive technology testing to provide a comprehensive assessment of accessibility compliance.

**Overall Compliance: Substantially Compliant**

The application meets **47 of 50 applicable WCAG 2.1 AA success criteria**. Three criteria have partial failures requiring remediation before Live deployment. The failures relate to colour contrast on chart tooltips, missing visible focus indicators on three interactive elements, and missing language attributes on code snippets. None of these failures prevent users from completing core journeys. The application is **fit for Beta use** and will achieve full AA compliance with the remediation items identified in this report.

The application demonstrates strong accessibility foundations including semantic HTML, proper heading hierarchy, keyboard operability, screen reader compatibility, and responsive design. The GOV.UK design patterns have been implemented effectively throughout.

---

## Scope

### Pages Tested

| Page | URL Path | Priority |
|------|----------|----------|
| Home | `/` | High |
| Apply — Step 1: Personal Details | `/apply` | High |
| Apply — Step 2: Address | `/apply` (step 2) | High |
| Apply — Step 3: Employment | `/apply` (step 3) | High |
| Apply — Step 4: Income | `/apply` (step 4) | High |
| Apply — Step 5: Expenditure | `/apply` (step 5) | High |
| Apply — Step 6: Assets | `/apply` (step 6) | High |
| Apply — Step 7: Debts | `/apply` (step 7) | High |
| Apply — Step 8: Documents | `/apply` (step 8) | High |
| Apply — Step 9: Review & Submit | `/apply` (step 9) | High |
| Dashboard | `/dashboard` | High |
| Case Detail | `/cases/[id]` | Medium |
| Recommendation | `/recommendation` | Medium |
| Search | `/search` | Medium |
| Statistics | `/statistics` | Medium |
| Security | `/security` | Low |
| Correspondence | `/correspondence` | Medium |
| Architecture | `/architecture` | Low |
| Login | `/login` | High |
| Account | `/account` | Medium |

### Testing Approach

1. **Automated scanning** — axe-core and Lighthouse run against all pages
2. **Manual expert review** — Each WCAG criterion assessed by trained auditor
3. **Keyboard testing** — Full journey completion using keyboard only
4. **Screen reader testing** — NVDA (Windows), VoiceOver (macOS), Narrator (Windows)
5. **Responsive testing** — 320px to 1920px viewport widths
6. **Zoom testing** — 100% to 400% browser zoom
7. **User preference testing** — High contrast mode, reduced motion, large text

---

## Compliance Summary

| Principle | Applicable Criteria | Pass | Fail | N/A |
|-----------|-------------------|------|------|-----|
| 1. Perceivable | 17 | 16 | 1 | 0 |
| 2. Operable | 15 | 14 | 1 | 0 |
| 3. Understandable | 11 | 10 | 1 | 0 |
| 4. Robust | 7 | 7 | 0 | 0 |
| **Total** | **50** | **47** | **3** | **0** |

---

## Detailed Findings — Failures

### FAIL-001: 1.4.3 Contrast (Minimum) — Partial Failure

| Attribute | Detail |
|-----------|--------|
| **Criterion** | 1.4.3 Contrast (Minimum) — Level AA |
| **Pages Affected** | Statistics, Security dashboard |
| **Severity** | High |
| **User Impact** | Users with low vision |

**Issue:** Chart visualisations rendered by the Recharts library use default tooltip styling that does not meet the minimum contrast ratio of 4.5:1 for normal text. Specifically:

- Tooltip body text uses `#999999` on white background (`#ffffff`) = **2.85:1** (fails 4.5:1 requirement)
- Tooltip label text uses `#333333` on white background = **12.6:1** (passes)
- Chart axis labels use `#666666` on white background = **5.74:1** (passes)
- Legend text uses `#333333` = **12.6:1** (passes)

The failure is isolated to tooltip content that appears on hover/focus over chart data points.

**Evidence:**
```
Element: <p class="recharts-tooltip-item" style="color: #999">
Foreground: #999999
Background: #ffffff
Contrast ratio: 2.85:1
Required: 4.5:1
Tool: axe-core 4.9 — color-contrast rule
```

**Impact:** Users with moderately low vision (common in users over 50) may be unable to read the specific data values shown in chart tooltips. The charts themselves remain perceivable through axis labels and visual data representation.

**Recommendation:** Override Recharts tooltip component styles:
```css
.recharts-tooltip-item {
  color: #505a5f !important; /* GOV.UK secondary text grey — 7.08:1 ratio */
}
```
Alternatively, implement a custom tooltip component with guaranteed contrast compliance.

**Priority:** High — fix before Live deployment

---

### FAIL-002: 2.4.7 Focus Visible — Partial Failure

| Attribute | Detail |
|-----------|--------|
| **Criterion** | 2.4.7 Focus Visible — Level AA |
| **Pages Affected** | Search page, Dashboard cards |
| **Severity** | High |
| **User Impact** | Keyboard-only users |

**Issue:** Three interactive elements do not display a visible focus indicator when navigated to via keyboard:

1. **Quick search category buttons** on the Search page — styled with `outline: none` to remove default browser outline but no replacement focus style applied
2. **"View case" links** within dashboard summary cards — the card has a hover effect but the individual link lacks a distinct focus state
3. **Pagination controls** on the Dashboard — number buttons show focus in Chrome but not in Firefox/Safari

**Evidence:**
```html
<!-- Search page quick filter buttons -->
<button class="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
        style="outline: none;">
  Bankruptcy
</button>
<!-- No focus-visible styles applied -->
```

Keyboard navigation via Tab key shows no visible indication that the button is focused. Only the browser's default styling (if not suppressed) provides any focus indication.

**Impact:** Keyboard-only users (including those with motor impairments who cannot use a mouse) cannot determine which element currently has focus, making the interface effectively unusable for keyboard navigation on affected pages.

**Recommendation:** Add consistent focus-visible styles to all interactive elements:
```css
/* Global focus style matching GOV.UK Design System */
:focus-visible {
  outline: 3px solid #ffdd00; /* GOV.UK yellow focus colour */
  outline-offset: 2px;
  box-shadow: 0 0 0 3px #ffdd00;
}
```
For Tailwind CSS implementation:
```html
class="focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:outline-none"
```

**Priority:** High — fix before Live deployment

---

### FAIL-003: 3.1.2 Language of Parts — Minor Failure

| Attribute | Detail |
|-----------|--------|
| **Criterion** | 3.1.2 Language of Parts — Level AA |
| **Pages Affected** | Architecture page |
| **Severity** | Low |
| **User Impact** | Screen reader users (minimal practical impact) |

**Issue:** The Architecture page contains code snippets and technical configuration examples (JSON, SQL, Docker Compose syntax) that are not marked with appropriate language attributes. Screen readers may attempt to pronounce code syntax as English text, producing confusing output.

**Evidence:**
```html
<pre><code>
{
  "services": {
    "api-gateway": {
      "build": "./services/api-gateway",
      "ports": ["3001:3001"]
    }
  }
}
</code></pre>
<!-- No lang attribute or aria-label to indicate this is code/non-prose content -->
```

When read by NVDA, this is announced character-by-character for punctuation and attempts English pronunciation of property names, producing: "open brace, quotation mark services quotation mark colon open brace..."

**Impact:** Screen reader users navigating the Architecture page will hear garbled pronunciation of code blocks. However, this page is informational/technical documentation and not part of any core user journey. The practical impact is minimal as the target audience for this page is technical staff.

**Recommendation:**
1. Add `aria-label="Code example: [description]"` to code blocks
2. Consider adding `role="img"` with a descriptive `aria-label` for purely illustrative code
3. Alternatively, provide a text description before each code block that conveys the key information

**Priority:** Low — acceptable for Beta, fix before Live

---

## Detailed Findings — Passes

### Principle 1: Perceivable

| Criterion | Result | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | Pass | All images have descriptive alt text; AiB logo uses `alt="Accountant in Bankruptcy"`. Decorative icons use `aria-hidden="true"`. |
| 1.2.1 Audio-only/Video-only | N/A | No audio or video content present |
| 1.3.1 Info and Relationships | Pass | Proper heading hierarchy maintained (h1 > h2 > h3). Form inputs linked to labels via `htmlFor`/`id`. Tables use `<th>` with scope attributes. Lists use semantic `<ul>`/`<ol>`. |
| 1.3.2 Meaningful Sequence | Pass | DOM order matches visual reading order on all pages. CSS layout does not reorder content. |
| 1.3.3 Sensory Characteristics | Pass | Instructions do not rely solely on shape, size, location, or sound. Error messages use text descriptions. |
| 1.3.4 Orientation | Pass | No content restricted to single orientation. Layout adapts to portrait and landscape. |
| 1.3.5 Identify Input Purpose | Pass | Form inputs use appropriate `autocomplete` attributes (e.g., `given-name`, `family-name`, `email`, `postal-code`). |
| 1.4.1 Use of Colour | Pass | Status indicators use text labels alongside colour (e.g., "Approved" in green badge includes text). Form errors indicated by text message and icon, not colour alone. |
| 1.4.3 Contrast (Minimum) | **Fail** | See FAIL-001 above |
| 1.4.4 Resize Text | Pass | Content remains functional and readable at 200% browser zoom. No horizontal scrolling required. |
| 1.4.5 Images of Text | Pass | No images of text used. All text rendered as HTML. |
| 1.4.10 Reflow | Pass | Content reflows to single column at 320px width. No loss of information or functionality. No two-dimensional scrolling. |
| 1.4.11 Non-text Contrast | Pass | UI components and graphical objects meet 3:1 contrast ratio. Form borders, buttons, icons all verified. |
| 1.4.12 Text Spacing | Pass | Tested with WCAG text spacing bookmarklet (line-height 1.5x, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em). No content clipped or overlapping. |
| 1.4.13 Content on Hover/Focus | Pass | Tooltips are dismissible (Escape key), hoverable (pointer can move to tooltip without it disappearing), and persistent (remain visible until dismissed). |

### Principle 2: Operable

| Criterion | Result | Notes |
|-----------|--------|-------|
| 2.1.1 Keyboard | Pass | All functionality operable via keyboard. Application form completable entirely via Tab/Enter/Space. Dropdowns navigable via arrow keys. |
| 2.1.2 No Keyboard Trap | Pass | No keyboard traps detected. Modal dialogs (if any) allow Tab cycling and Escape to close. |
| 2.1.4 Character Key Shortcuts | Pass | No single-character keyboard shortcuts implemented. |
| 2.2.1 Timing Adjustable | Pass | No time limits on form completion. Session timeout managed by Keycloak with configurable duration. |
| 2.3.1 Three Flashes | Pass | No flashing or blinking content. Progress indicators use smooth animations only. |
| 2.4.1 Bypass Blocks | Pass | "Skip to main content" link present on all pages. Activates on first Tab press. Links correctly to `<main>` element. |
| 2.4.2 Page Titled | Pass | Each page has a unique, descriptive `<title>`. Format: "Page Name — IAAS — AiB". |
| 2.4.3 Focus Order | Pass | Tab order follows logical reading sequence. No focus jumping or unexpected movement. |
| 2.4.4 Link Purpose (In Context) | Pass | All links have descriptive text or `aria-label`. No bare "click here" or "read more" links. |
| 2.4.5 Multiple Ways | Pass | Content reachable via navigation menu, search, and direct links from dashboard. |
| 2.4.6 Headings and Labels | Pass | All sections have descriptive headings. Form field labels accurately describe expected input. |
| 2.4.7 Focus Visible | **Fail** | See FAIL-002 above |
| 2.5.1 Pointer Gestures | Pass | No functionality requires multi-point or path-based gestures. All touch targets have single-tap alternatives. |
| 2.5.2 Pointer Cancellation | Pass | All click/tap actions fire on `mouseup`/`touchend`. Actions can be cancelled by moving pointer away before release. |
| 2.5.3 Label in Name | Pass | Visible labels match accessible names. Button text matches `aria-label` where both are present. |

### Principle 3: Understandable

| Criterion | Result | Notes |
|-----------|--------|-------|
| 3.1.1 Language of Page | Pass | `<html lang="en-GB">` correctly set on all pages. |
| 3.1.2 Language of Parts | **Fail** | See FAIL-003 above |
| 3.2.1 On Focus | Pass | No context changes triggered by focus alone. Focus does not open menus, submit forms, or navigate. |
| 3.2.2 On Input | Pass | No unexpected context changes on input. Form fields do not auto-submit or navigate on value change. |
| 3.2.3 Consistent Navigation | Pass | Navigation menu structure identical across all pages. Position and order consistent. |
| 3.2.4 Consistent Identification | Pass | Components with same function have same labels. "Apply" button consistently labelled throughout. |
| 3.3.1 Error Identification | Pass | Form validation errors clearly identified with red border, error icon, and descriptive text message below the field. Error summary displayed at top of form with links to each error. |
| 3.3.2 Labels or Instructions | Pass | All form fields have visible labels. Required fields marked with "(required)" text, not just asterisk. Help text provided for complex fields (e.g., National Insurance number format). |
| 3.3.3 Error Suggestion | Pass | Error messages provide specific correction guidance (e.g., "Enter a valid email address, like name@example.com"). |
| 3.3.4 Error Prevention (Legal) | Pass | Review step in application journey allows users to check all entered data before submission. Edit links return to specific steps without data loss. |

### Principle 4: Robust

| Criterion | Result | Notes |
|-----------|--------|-------|
| 4.1.1 Parsing | Pass | HTML validated with no duplicate IDs, proper element nesting, complete start/end tags. React renders valid HTML. |
| 4.1.2 Name, Role, Value | Pass | All interactive elements have accessible names. ARIA attributes correctly applied (`aria-expanded`, `aria-controls`, `aria-describedby`). Custom components use appropriate ARIA roles. |
| 4.1.3 Status Messages | Pass | Form submission confirmations, error summaries, and loading states announced via `aria-live="polite"` regions. Toast notifications use `role="alert"`. |

---

## Screen Reader Testing Results

### Test Matrix

| Screen Reader | Browser | OS | Result | Notes |
|--------------|---------|-----|--------|-------|
| NVDA 2024.2 | Chrome 127 | Windows 11 | Pass | All pages navigable. Forms fully usable. Landmarks announced correctly. |
| NVDA 2024.2 | Firefox 128 | Windows 11 | Pass | Consistent with Chrome results. |
| VoiceOver | Safari 18.0 | macOS 15 | Pass | Landmarks, headings, forms correctly announced. Rotor navigation effective. |
| Narrator | Edge 127 | Windows 11 | Pass | Basic navigation successful. Chart content not announced (see note). |

### Key Observations

- **Landmark regions** correctly identified: banner, navigation, main, complementary, contentinfo
- **Heading navigation** (H key in NVDA) provides logical document outline on all pages
- **Form mode** activates correctly on all input fields with labels announced
- **Error messages** announced when `aria-describedby` links error to field
- **Dynamic content** (loading states, form step transitions) announced via `aria-live` regions
- **Charts** — Recharts SVG content is partially accessible; data tables provided as alternative (see Statistics page)

**Note on charts:** Narrator does not announce SVG chart content. A data table alternative is provided below each chart on the Statistics page, which is accessible to all screen readers. Recommend adding `aria-label` to chart containers with summary data.

---

## Mobile Accessibility Testing

| Test | Result | Detail |
|------|--------|--------|
| Touch target size | Pass | All interactive elements ≥ 44x44px (Apple HIG) / 48x48dp (Material) |
| Viewport configuration | Pass | `<meta name="viewport" content="width=device-width, initial-scale=1">` with no `user-scalable=no` |
| Text resizing | Pass | Respects iOS Dynamic Type and Android font size settings |
| Orientation lock | Pass | No content restricted to single orientation |
| Pinch-to-zoom | Pass | Not disabled; users can zoom to 500% |
| Scrollable regions | Pass | All scrollable areas have visible scrollbars or scroll indicators |

### Device Testing

| Device | OS | Browser | Result |
|--------|-----|---------|--------|
| iPhone 15 | iOS 18 | Safari | Pass |
| Samsung Galaxy S24 | Android 15 | Chrome | Pass |
| iPad Pro 12.9" | iPadOS 18 | Safari | Pass |

---

## Automated Testing Results

### axe-core 4.9

| Severity | Issues | Detail |
|----------|--------|--------|
| Critical | 0 | — |
| Serious | 2 | Tooltip contrast (FAIL-001), focus visible (FAIL-002) |
| Moderate | 3 | Code block language (FAIL-003), 2 best-practice alerts |
| Minor | 2 | Empty `<th>` in one table, redundant `role="button"` on `<button>` |
| **Total** | **7** | — |

### Google Lighthouse Accessibility

| Page | Score | Notes |
|------|-------|-------|
| Home | 98/100 | -2 for missing meta description (SEO, not a11y) |
| Apply (all steps) | 96/100 | -4 for tooltip contrast |
| Dashboard | 97/100 | -3 for focus indicator |
| Statistics | 94/100 | -6 for chart contrast issues |
| Search | 96/100 | -4 for focus indicator on quick filters |
| **Average** | **96/100** | — |

### WAVE (WebAIM)

| Category | Count |
|----------|-------|
| Errors | 0 |
| Contrast Errors | 0 (WAVE does not detect dynamic tooltip contrast) |
| Alerts | 4 (redundant title attributes, possible heading misuse) |
| Features | 67 (ARIA landmarks, alt text, form labels detected) |
| Structural Elements | 89 (headings, lists, tables correctly structured) |

---

## Remediation Plan

| # | Issue | Criterion | Severity | Owner | Due Date | Status |
|---|-------|-----------|----------|-------|----------|--------|
| 1 | Chart tooltip contrast | 1.4.3 | High | Frontend Team | 30 Aug 2026 | Open |
| 2 | Focus visible on 3 elements | 2.4.7 | High | Frontend Team | 30 Aug 2026 | Open |
| 3 | Language of parts on code blocks | 3.1.2 | Low | Frontend Team | Beta launch | Open |

### Estimated Remediation Effort

| Issue | Estimated Effort | Complexity |
|-------|-----------------|------------|
| Chart tooltip contrast | 2 hours | Low — CSS override |
| Focus visible | 4 hours | Low — Tailwind classes |
| Language of parts | 2 hours | Low — aria-label attributes |
| **Total** | **8 hours** | — |

---

## Conclusion

The IAAS application demonstrates **strong accessibility compliance** for a Beta-stage government service. The application meets 47 of 50 WCAG 2.1 AA success criteria, with only 3 partial failures identified — none of which prevent users from completing core tasks.

The development team has implemented accessibility as a foundational concern rather than an afterthought. Semantic HTML, proper ARIA usage, keyboard operability, and screen reader compatibility are evident throughout the application. The GOV.UK design patterns have been applied effectively, contributing to a consistent and accessible user experience.

The three identified failures require approximately 8 hours of development effort to remediate. The application is **fit for Beta deployment** and will achieve full WCAG 2.1 AA compliance following remediation.

---

## Accessibility Statement (Draft)

The following draft accessibility statement is suitable for publication on the IAAS service, conforming to the required format for UK public sector websites under the Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018.

---

### Accessibility statement for the Initial Application Advice Service

This accessibility statement applies to the Initial Application Advice Service (IAAS) operated by the Accountant in Bankruptcy (AiB).

This website is run by the Accountant in Bankruptcy, an executive agency of the Scottish Government. We want as many people as possible to be able to use this website. For example, that means you should be able to:

- change colours, contrast levels and fonts using browser settings
- zoom in up to 400% without the text spilling off the screen
- navigate most of the website using just a keyboard
- navigate most of the website using speech recognition software
- listen to most of the website using a screen reader (including the most recent versions of NVDA, VoiceOver, and Narrator)

We have also made the website text as simple as possible to understand.

[AbilityNet](https://mcmw.abilitynet.org.uk/) has advice on making your device easier to use if you have a disability.

#### How accessible this website is

We know some parts of this website are not fully accessible:

- some chart tooltip text does not meet minimum colour contrast requirements
- some interactive elements on the search page do not show a visible focus indicator in all browsers
- code examples on the architecture page are not marked up with language attributes for screen readers

#### Feedback and contact information

If you need information on this website in a different format like accessible PDF, large print, easy read, audio recording or braille, please contact:

- Email: accessibility@aib.gov.uk
- Phone: 0300 200 2600

We will consider your request and respond within 10 working days.

#### Reporting accessibility problems with this website

We are always looking to improve the accessibility of this website. If you find any problems not listed on this page or think we are not meeting accessibility requirements, contact us at accessibility@aib.gov.uk.

#### Enforcement procedure

The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the 'accessibility regulations'). If you are not happy with how we respond to your complaint, contact the [Equality Advisory and Support Service (EASS)](https://www.equalityadvisoryservice.com/).

#### Technical information about this website's accessibility

The Accountant in Bankruptcy is committed to making its website accessible, in accordance with the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.

##### Compliance status

This website is substantially compliant with the Web Content Accessibility Guidelines version 2.1 AA standard, due to the non-compliances listed below.

##### Non-accessible content

The content listed below is non-accessible for the following reasons:

**Non-compliance with the accessibility regulations:**

- Chart tooltip text has a contrast ratio of 2.85:1 which fails WCAG 2.1 success criterion 1.4.3 (Contrast Minimum). We plan to fix this by 30 August 2026.
- Three interactive elements on the search page and dashboard do not show a visible focus indicator, which fails WCAG 2.1 success criterion 2.4.7 (Focus Visible). We plan to fix this by 30 August 2026.
- Code snippets on the architecture page do not have language attributes, which fails WCAG 2.1 success criterion 3.1.2 (Language of Parts). We plan to fix this by September 2026.

#### Preparation of this accessibility statement

This statement was prepared on 21 August 2026. It was last reviewed on 21 August 2026.

This website was last tested on 19–21 August 2026. The test was carried out by Leidos Accessibility Team using a combination of automated tools (axe-core, Lighthouse, WAVE) and manual testing with assistive technologies (NVDA, VoiceOver, Narrator).

All pages of the service were tested, including the full 9-step application journey.

---

*End of Report*
