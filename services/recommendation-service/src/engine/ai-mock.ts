/**
 * Mock AI Explanation Service
 *
 * In production, this could connect to an LLM service (with appropriate safeguards)
 * to generate personalised explanations. For the POC, we use pre-written templates.
 *
 * IMPORTANT: Any production AI service must:
 * - Not make binding legal or financial decisions
 * - Clearly state it is providing information, not advice
 * - Be reviewed by AiB policy team
 * - Comply with Scottish Government AI principles
 * - Have human oversight
 */

const explanations: Record<string, string> = {
  bankruptcy: `Based on the information you've provided, sequestration (bankruptcy) may be the most suitable option for your situation.

**What this means:**
Sequestration is a formal legal process that can write off most of your debts. It lasts for one year, after which you are usually discharged and no longer liable for the debts included.

**Key considerations:**
- Your assets may be sold to pay creditors
- It will affect your credit rating for 6 years
- Certain professions may be affected
- You will appear on the Register of Insolvencies

**Next steps:**
We strongly recommend speaking with a qualified money adviser before proceeding. Free advice is available from Citizens Advice Scotland or an approved money adviser.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  minimal_asset_process: `Based on the information you've provided, the Minimal Asset Process (MAP) may be suitable for your situation.

**What this means:**
MAP is a simplified form of bankruptcy for people with low income and few assets. It provides debt relief without the full costs of sequestration.

**Eligibility indicators from your application:**
- Your total debt is within the MAP threshold
- You have limited assets
- Your disposable income is low

**Key benefits:**
- Lower cost than full sequestration
- Same legal protection from creditors
- Debts written off after discharge
- Application fee may be waived in some circumstances

**Next steps:**
An approved money adviser must certify your application. Contact Citizens Advice Scotland or a local advice agency.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  debt_arrangement_scheme: `Based on the information you've provided, the Debt Arrangement Scheme (DAS) appears suitable for your situation.

**What this means:**
DAS allows you to repay your debts in full over an extended period through a Debt Payment Programme (DPP). While in the programme, creditors cannot take enforcement action against you.

**Why DAS may suit you:**
- You have regular income and can afford reduced payments
- Your debt level is manageable with extended repayment terms
- You want to repay what you owe whilst being protected from creditor action

**Key features:**
- Statutory protection from creditors
- Single affordable monthly payment
- Interest and charges frozen
- No impact on most professions
- You keep your assets

**Next steps:**
An approved money adviser will help you create a Debt Payment Programme. This sets out affordable payments to all your creditors.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  protected_trust_deed: `Based on the information you've provided, a Protected Trust Deed (PTD) may be suitable for your situation.

**What this means:**
A Trust Deed is a voluntary agreement with your creditors to repay what you can afford over 4 years. Once protected, creditors included in the deed cannot take separate action against you.

**Why a PTD may suit you:**
- You have some assets and income available for creditors
- Your debt is significant but you can make contributions
- You want to avoid sequestration while providing a fair return to creditors

**Key considerations:**
- Typically lasts 4 years
- You may need to release equity from property
- Affects your credit rating
- A trustee manages the arrangement

**Next steps:**
You will need to work with an insolvency practitioner who will propose the trust deed to your creditors.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  debt_payment_programme: `Based on the information you've provided, a Debt Payment Programme (DPP) under the Debt Arrangement Scheme may be suitable.

**What this means:**
A DPP allows you to repay your debts in full through affordable monthly payments over a longer period than originally agreed.

**Why this may suit you:**
- Your debt level is relatively low
- You can afford regular payments from your disposable income
- You want to repay in full without entering formal insolvency

**Key benefits:**
- No insolvency record
- Interest and charges frozen
- Statutory protection while in the programme
- Single monthly payment

**Next steps:**
Contact an approved money adviser who will help you set up the programme.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  moratorium: `You currently have an active moratorium (breathing space) in place.

**What this means:**
A moratorium gives you 6 weeks of legal protection from creditor action while you seek advice about your financial situation.

**During this period:**
- Creditors cannot take enforcement action
- You have time to seek free money advice
- You can explore which debt solution is right for you

**What to do now:**
Use this time to speak with an approved money adviser about your options. They can help you understand which longer-term solution might be appropriate.

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,

  signposting_advice: `Based on the information you've provided, we recommend seeking free professional money advice to explore your options.

**Why we're signposting rather than recommending a specific product:**
Your circumstances may benefit from a personalised discussion with a qualified adviser who can explore all available options with you.

**Free advice services available:**
- Citizens Advice Scotland: 0800 028 1456
- National Debtline Scotland: 0808 808 4000
- Your local authority money advice service

**What an adviser can help with:**
- Understanding all debt solutions available in Scotland
- Budgeting and income maximisation
- Dealing with priority debts
- Negotiating with creditors
- Applying for a formal debt solution if appropriate

*This is an automated assessment for information purposes only. It does not constitute legal or financial advice.*`,
};

export function getAiExplanation(product: string, _factors?: unknown[]): string {
  return explanations[product] || explanations['signposting_advice'];
}
