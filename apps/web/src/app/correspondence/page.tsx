'use client';

import { useState } from 'react';

const TEMPLATES = [
  { id: 'ack', name: 'Application Acknowledgement', description: 'Confirms receipt of application and next steps' },
  { id: 'info', name: 'Request for Additional Information', description: 'Requests missing documents or clarification' },
  { id: 'approved', name: 'Decision Notification — Approved', description: 'Informs applicant of successful outcome' },
  { id: 'rejected', name: 'Decision Notification — Rejected', description: 'Informs applicant of unsuccessful outcome with reasons' },
  { id: 'referral', name: 'Referral to Money Adviser', description: 'Refers applicant to accredited money advice provider' },
];

const CASES = [
  { ref: 'IAAS-2026-00012', name: 'Alistair Morrison', product: 'DAS', debt: '£18,400', status: 'submitted' },
  { ref: 'IAAS-2026-00011', name: 'Brenda Campbell', product: 'MAP', debt: '£9,200', status: 'under_review' },
  { ref: 'IAAS-2026-00010', name: 'Craig Stewart', product: 'PTD', debt: '£23,100', status: 'additional_info_required' },
  { ref: 'IAAS-2026-00008', name: 'Eleanor MacPherson', product: 'DAS', debt: '£14,200', status: 'approved' },
  { ref: 'IAAS-2026-00007', name: 'Fiona MacDonald', product: 'MAP', debt: '£8,900', status: 'under_review' },
];

const SENT_LOG = [
  { ref: 'IAAS-2026-00008', template: 'Decision Notification — Approved', sent: '12 Aug 2026, 14:30', by: 'Karen MacLeod', channel: 'Email + Post' },
  { ref: 'IAAS-2026-00010', template: 'Request for Additional Information', sent: '11 Aug 2026, 09:15', by: 'James Wilson', channel: 'Email' },
  { ref: 'IAAS-2026-00005', template: 'Referral to Money Adviser', sent: '8 Aug 2026, 16:45', by: 'Karen MacLeod', channel: 'Email' },
  { ref: 'IAAS-2026-00004', template: 'Decision Notification — Rejected', sent: '6 Aug 2026, 11:20', by: 'David Henderson', channel: 'Email + Post' },
];

function generateLetter(templateId: string, caseData: typeof CASES[0]) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const templates: Record<string, string> = {
    ack: `Dear ${caseData.name},

We are writing to confirm that we have received your application for debt advice through the Initial Application Advice Service (IAAS).

Your application reference is: ${caseData.ref}

What happens next:
• Your application will be reviewed by an AiB officer within 5 working days
• System checks will be conducted against existing records
• A product recommendation will be generated based on your financial circumstances
• You will be notified of the outcome by email

If you need to provide additional information or have questions about your application, please contact us quoting your reference number.

You can check the status of your application at any time by logging into your IAAS account.

Yours sincerely,

AiB Case Administration Team
Accountant in Bankruptcy
1 Pennyburn Road, Kilwinning, KA13 6SA
Tel: 0300 200 2600`,

    info: `Dear ${caseData.name},

Re: Application ${caseData.ref}

We are writing regarding your recent application to the Initial Application Advice Service.

After reviewing your submission, we require the following additional information before we can proceed:

□ Proof of income (payslips or benefit statements for the last 3 months)
□ Bank statements for all accounts (last 3 months)
□ Evidence of debts listed (statements or letters from creditors)
□ Proof of current address (utility bill or council tax statement dated within last 3 months)

Please provide this information within 14 days of the date of this letter. You can upload documents through your IAAS account or post them to the address below.

If we do not receive the requested information within this timeframe, your application may be closed.

If you have any questions, please contact us quoting reference ${caseData.ref}.

Yours sincerely,

AiB Case Administration Team
Accountant in Bankruptcy`,

    approved: `Dear ${caseData.name},

Re: Application ${caseData.ref} — DECISION: APPROVED

We are pleased to inform you that your application has been reviewed and approved.

Based on our assessment of your financial circumstances, the recommended debt solution for you is:

    ${caseData.product} (${caseData.product === 'DAS' ? 'Debt Arrangement Scheme' : caseData.product === 'MAP' ? 'Minimal Asset Process' : caseData.product === 'PTD' ? 'Protected Trust Deed' : caseData.product})

What happens next:
• A qualified money adviser will be assigned to your case
• They will contact you within 5 working days to arrange an appointment
• They will explain the recommended solution and discuss your options
• No creditor action can be taken against you during this period

Total debt recorded: ${caseData.debt}

Important: This recommendation is for information purposes. A money adviser will discuss all available options with you before any decision is made.

Yours sincerely,

Karen MacLeod
Senior Officer — Case Administration
Accountant in Bankruptcy`,

    rejected: `Dear ${caseData.name},

Re: Application ${caseData.ref} — DECISION: NOT APPROVED

We have reviewed your application to the Initial Application Advice Service and regret that we are unable to approve it at this time.

Reasons for this decision:
• Your total debt level (${caseData.debt}) falls below the minimum threshold for formal debt solutions
• Based on your income and expenditure, informal arrangements may be more suitable

What you can do:
• Contact Citizens Advice Scotland (0800 028 1456) for free money advice
• Speak to your creditors directly about informal payment arrangements
• Visit www.moneyhelper.org.uk for guidance on managing debt
• You may re-apply if your circumstances change significantly

You have the right to request a review of this decision within 28 days.

Yours sincerely,

David Henderson
Senior Officer — Case Administration
Accountant in Bankruptcy`,

    referral: `Dear ${caseData.name},

Re: Application ${caseData.ref} — Referral to Money Adviser

Following our review of your application, we are referring you to an accredited money adviser who can help you explore your debt solution options.

Your referral details:
• Money Advice Provider: Citizens Advice Scotland — Edinburgh Bureau
• Contact: James Robertson
• Phone: 0800 028 1456
• Email: debt.advice@cas-edinburgh.org.uk

The money adviser will:
• Contact you within 5 working days
• Arrange a free, confidential appointment
• Review your financial situation in detail
• Explain all available options including ${caseData.product}
• Help you make an informed decision

You do not need to take any action — the adviser will contact you. However, if you do not hear from them within 7 working days, please call the number above.

This is a free service. You will never be asked to pay for money advice.

Yours sincerely,

AiB Case Administration Team
Accountant in Bankruptcy`,
  };

  return templates[templateId] || 'Template not found';
}

export default function CorrespondencePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<typeof CASES[0] | null>(null);
  const [sent, setSent] = useState(false);

  const letterContent = selectedTemplate && selectedCase ? generateLetter(selectedTemplate, selectedCase) : null;

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Correspondence</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Generate and send template letters to applicants. Letters are auto-populated with case data.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Template Selection */}
        <div>
          <h2 className="font-bold text-lg mb-3">1. Choose Template</h2>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setSent(false); }}
                className={`w-full text-left p-3 border-2 rounded transition-all ${selectedTemplate === t.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Case Selection */}
        <div>
          <h2 className="font-bold text-lg mb-3">2. Select Case</h2>
          <div className="space-y-2">
            {CASES.map(c => (
              <button key={c.ref} onClick={() => { setSelectedCase(c); setSent(false); }}
                className={`w-full text-left p-3 border-2 rounded transition-all ${selectedCase?.ref === c.ref ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{c.ref} • {c.product} • {c.debt}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${c.status === 'approved' ? 'bg-green-100 text-green-800' : c.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Letter Preview */}
      {letterContent && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-3">3. Preview & Send</h2>
          <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Letter header - GOV.UK style */}
            <div className="bg-white dark:bg-gray-800 p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="font-bold text-lg">Accountant in Bankruptcy</p>
                  <p className="text-xs text-gray-500">An Executive Agency of the Scottish Government</p>
                  <p className="text-xs text-gray-500 mt-1">1 Pennyburn Road, Kilwinning, Ayrshire KA13 6SA</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-mono mt-1">Ref: {selectedCase?.ref}</p>
                </div>
              </div>
              {/* Letter body */}
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {letterContent}
              </pre>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 flex flex-wrap gap-3 items-center">
              <button onClick={handleSend}
                className="bg-green-700 text-white font-bold py-2 px-6 rounded hover:bg-green-800 text-sm">
                {sent ? '✓ Sent!' : '📧 Send via Email'}
              </button>
              <button className="bg-gray-200 dark:bg-gray-700 font-bold py-2 px-6 rounded hover:bg-gray-300 text-sm">
                🖨️ Print
              </button>
              <button className="bg-gray-200 dark:bg-gray-700 font-bold py-2 px-6 rounded hover:bg-gray-300 text-sm">
                📄 Download PDF
              </button>
              <span className="text-xs text-gray-500 ml-auto">
                Channel: Email + Postal (recorded delivery for decisions)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sent Correspondence Log */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="font-bold text-lg mb-4">📬 Sent Correspondence</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left p-3 font-bold">Reference</th>
                <th className="text-left p-3 font-bold">Template</th>
                <th className="text-left p-3 font-bold">Sent</th>
                <th className="text-left p-3 font-bold">By</th>
                <th className="text-left p-3 font-bold">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {SENT_LOG.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 font-mono text-blue-700 dark:text-blue-400">{item.ref}</td>
                  <td className="p-3">{item.template}</td>
                  <td className="p-3 text-gray-500">{item.sent}</td>
                  <td className="p-3">{item.by}</td>
                  <td className="p-3"><span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">{item.channel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
