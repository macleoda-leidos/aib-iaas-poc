/**
 * Section wrapper component — each screen gets its own page in PDF output.
 * Provides consistent spacing, anchor IDs, breadcrumb headers, and "back to contents" footers.
 *
 * Lives in its own module rather than in page.tsx: Next.js only permits a known
 * set of exports from a page file (default, metadata, generateStaticParams, ...)
 * and rejects anything else at typecheck time. Exporting it from the page also
 * made every sections/* file import its own parent, which is a cycle.
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
