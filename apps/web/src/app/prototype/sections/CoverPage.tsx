/**
 * CoverPage — Title page for the interactive PDF prototype.
 * Renders AiB branding, title block, version, classification, and purpose statement.
 */
export function CoverPage() {
  return (
    <section id="cover" className="prototype-section flex flex-col items-center justify-between min-h-[297mm]">
      {/* GOV.UK-style black header */}
      <div className="w-full bg-gov-black text-white px-6 py-4 -mx-[15mm] -mt-[20mm] mb-12" style={{ width: 'calc(100% + 30mm)', marginLeft: '-15mm', marginTop: '-20mm' }}>
        <div className="max-w-3xl mx-auto">
          <span className="text-sm font-bold tracking-wide uppercase">AiB</span>
          <span className="text-sm ml-2 font-normal">Accountant in Bankruptcy</span>
        </div>
      </div>

      {/* Title block — centred */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <h1 className="text-4xl font-bold text-gov-black mb-4 leading-tight">
          Initial Application Advice Service
        </h1>

        <p className="text-xl text-gray-600 mb-2">
          Interactive Prototype — Stakeholder Walkthrough
        </p>

        <p className="text-base text-gray-500 mb-8">
          v1.0 — July 2025
        </p>

        {/* Classification banner */}
        <div className="inline-block border-2 border-gov-blue px-6 py-2 mb-12">
          <span className="text-sm font-bold text-gov-blue tracking-wider uppercase">
            OFFICIAL — POC Demonstration
          </span>
        </div>

        {/* Purpose statement */}
        <div className="max-w-lg text-left bg-gray-50 border-l-4 border-gov-green p-6 rounded-r">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            This document is a clickable PDF showing the key user journeys through the
            AiB Initial Application Advice Service. Each page represents a screen or
            decision point, with internal links allowing stakeholders to navigate between
            sections during review sessions.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            The prototype covers: applicant self-service, AiB staff case review,
            money adviser workflows, and the administrative back-office portal.
          </p>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">
            This is NOT a live service. All data shown is synthetic and for
            demonstration purposes only. No real personal or financial information
            is used.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-xs text-gray-400 pt-8 border-t border-gray-200">
        <p>Produced for internal stakeholder review — not for public distribution</p>
      </div>
    </section>
  );
}
