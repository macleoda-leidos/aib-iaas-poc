import { CoverPage } from './sections/CoverPage';
import { TableOfContents } from './sections/TableOfContents';
import { JourneyMap } from './sections/JourneyMap';
import { HomeScreen } from './sections/HomeScreen';
import { LoginScreens } from './sections/LoginScreens';
import { PortalScreens } from './sections/PortalScreens';
import { ApplySteps } from './sections/ApplySteps';
import { DashboardScreens } from './sections/DashboardScreens';
import { CaseDetailScreens } from './sections/CaseDetailScreens';
import { AdminScreens } from './sections/AdminScreens';

/**
 * Section wrapper component — each screen gets its own page in PDF output.
 * Provides consistent spacing, anchor IDs, breadcrumb headers, and "back to contents" footers.
 */
export function Section({
  id,
  title,
  screenNumber,
  totalScreens = 32,
  children,
}: {
  id: string;
  title: string;
  screenNumber: number;
  totalScreens?: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="prototype-section">
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 text-xs text-gray-500">
        <span>Screen {screenNumber} of {totalScreens}</span>
        <span className="font-medium text-gray-700">{title}</span>
        <a href="#toc" className="text-gov-blue hover:underline">↑ Contents</a>
      </div>

      {/* Screen content */}
      <div className="screen-content">
        {children}
      </div>

      {/* Footer with back link */}
      <div className="mt-8 pt-3 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
        <a href="#toc" className="text-gov-blue hover:underline">↑ Back to Contents</a>
        <span>AiB IAAS Interactive Prototype</span>
      </div>
    </section>
  );
}

export default function PrototypePage() {
  return (
    <div className="prototype-container">
      <CoverPage />
      <TableOfContents />
      <JourneyMap />
      <HomeScreen />
      <LoginScreens />
      <PortalScreens />
      <ApplySteps />
      <DashboardScreens />
      <CaseDetailScreens />
      <AdminScreens />
    </div>
  );
}
