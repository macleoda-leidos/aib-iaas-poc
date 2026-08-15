/**
 * TableOfContents — Clickable TOC for the interactive PDF prototype.
 * Anchor links allow in-PDF navigation when exported via print-to-PDF.
 */
export function TableOfContents() {
  return (
    <section id="toc" className="prototype-section">
      <h1 className="text-3xl font-bold text-gov-black mb-8 border-b-4 border-gov-blue pb-3">
        Contents
      </h1>

      {/* Journey 1 */}
      <TocJourney number={1} title="Applicant Applies for Debt Advice">
        <TocEntry anchor="home" label="Home Page" index={1} />
        <TocEntry anchor="login" label="Login" index={2} />
        <TocEntry anchor="login-mfa" label="Multi-Factor Authentication" index={3} />
        <TocEntry anchor="login-success" label="Session Established" index={4} />
        <TocEntry anchor="apply-step-1" label="Application: Personal Details" index={5} />
        <TocEntry anchor="apply-step-2" label="Application: Address History" index={6} />
        <TocEntry anchor="apply-step-3" label="Application: Debts" index={7} />
        <TocEntry anchor="apply-step-4" label="Application: Income & Expenditure" index={8} />
        <TocEntry anchor="apply-step-5" label="Application: Assets" index={9} />
        <TocEntry anchor="apply-step-6" label="Application: Documents" index={10} />
        <TocEntry anchor="apply-step-7" label="Application: System Checks" index={11} />
        <TocEntry anchor="apply-step-8" label="Application: Recommendation" index={12} />
        <TocEntry anchor="apply-step-9" label="Application: Payment & Submit" index={13} />
      </TocJourney>

      {/* Journey 2 */}
      <TocJourney number={2} title="AiB Staff Reviews Application">
        <TocEntry anchor="portal-admin" label="Portal (System Admin)" index={14} />
        <TocEntry anchor="portal-officer" label="Portal (Case Officer)" index={15} />
        <TocEntry anchor="dashboard-admin" label="Dashboard (System Admin)" index={16} />
        <TocEntry anchor="dashboard-officer" label="Dashboard (Case Officer)" index={17} />
        <TocEntry anchor="case-detail-pass" label="Case Detail (Credit PASS)" index={18} />
        <TocEntry anchor="case-detail-fail" label="Case Detail (Credit FAIL)" index={19} />
      </TocJourney>

      {/* Journey 3 */}
      <TocJourney number={3} title="Money Adviser Manages Clients">
        <TocEntry anchor="portal-adviser" label="Portal (Adviser)" index={20} />
        <TocEntry anchor="dashboard-adviser" label="Dashboard (Money Adviser)" index={21} />
      </TocJourney>

      {/* Journey 4 */}
      <TocJourney number={4} title="Other Stakeholder Views">
        <TocEntry anchor="portal-debtor" label="Portal (Debtor)" index={22} />
        <TocEntry anchor="dashboard-creditor" label="Dashboard (Creditor)" index={23} />
        <TocEntry anchor="dashboard-trustee" label="Dashboard (Trustee)" index={24} />
        <TocEntry anchor="dashboard-debtor" label="Dashboard (Debtor)" index={25} />
      </TocJourney>

      {/* Journey 5 */}
      <TocJourney number={5} title="Admin Portal">
        <TocEntry anchor="admin-dashboard" label="Admin Dashboard" index={26} />
        <TocEntry anchor="admin-app-detail" label="Application Detail" index={27} />
        <TocEntry anchor="admin-orgs" label="Organisations" index={28} />
        <TocEntry anchor="admin-users" label="Users" index={29} />
      </TocJourney>

      {/* System Overview */}
      <TocJourney title="System Overview">
        <TocEntry anchor="journey-map" label="User Journey Map" index={30} />
      </TocJourney>
    </section>
  );
}

/**
 * Journey group heading within the TOC.
 */
function TocJourney({
  number,
  title,
  children,
}: {
  number?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gov-black mb-2">
        {number ? `Journey ${number}: ` : ''}{title}
      </h2>
      <ol className="list-none space-y-1 pl-4">
        {children}
      </ol>
    </div>
  );
}

/**
 * Single TOC entry — renders a clickable anchor link.
 */
function TocEntry({ anchor, label, index }: { anchor: string; label: string; index: number }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-xs text-gray-400 font-mono w-6 text-right shrink-0">
        {index}.
      </span>
      <a
        href={`#${anchor}`}
        className="text-gov-blue underline hover:text-gov-blue/80 text-sm leading-relaxed"
      >
        {label}
      </a>
    </li>
  );
}
