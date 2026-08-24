import { Section } from '../Section';

/**
 * JourneyMap — Visual flow diagram showing how screens connect in the interactive prototype.
 * Uses CSS grid with coloured boxes and Unicode arrows to indicate navigation paths.
 */
export function JourneyMap() {
  return (
    <Section id="journey-map" title="User Journey Map" screenNumber={3}>
      <p className="text-sm text-gray-600 mb-6">
        This diagram shows how the prototype screens connect. Click any box to jump to that screen.
        Colours indicate which user journey each screen belongs to.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-8 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-100 border border-blue-400"></span>
          <span>Applicant journey</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-400"></span>
          <span>Staff journey</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-purple-100 border border-purple-400"></span>
          <span>Adviser journey</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-orange-100 border border-orange-400"></span>
          <span>Admin portal</span>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="space-y-6">

        {/* Row 1: Shared auth flow */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <a href="#home" className="block px-4 py-3 bg-blue-100 border-2 border-blue-400 rounded text-center text-sm font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors min-w-[100px]">
            Home
          </a>
          <span className="text-xl text-gray-400 font-bold">→</span>
          <a href="#login" className="block px-4 py-3 bg-gray-100 border-2 border-gray-400 rounded text-center text-sm font-bold text-gray-800 no-underline hover:bg-gray-200 transition-colors min-w-[100px]">
            Login
          </a>
          <span className="text-xl text-gray-400 font-bold">→</span>
          <a href="#login-mfa" className="block px-4 py-3 bg-gray-100 border-2 border-gray-400 rounded text-center text-sm font-bold text-gray-800 no-underline hover:bg-gray-200 transition-colors min-w-[100px]">
            MFA
          </a>
          <span className="text-xl text-gray-400 font-bold">→</span>
          <a href="#login-success" className="block px-4 py-3 bg-gray-100 border-2 border-gray-400 rounded text-center text-sm font-bold text-gray-800 no-underline hover:bg-gray-200 transition-colors min-w-[100px]">
            Session
          </a>
        </div>

        {/* Arrow down from Session */}
        <div className="text-center text-xl text-gray-400 font-bold">↓</div>

        {/* Row 2: Portal split */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <a href="#portal-admin" className="block px-3 py-3 bg-orange-100 border-2 border-orange-400 rounded text-sm font-bold text-orange-900 no-underline hover:bg-orange-200 transition-colors">
              Portal (Admin)
            </a>
            <span className="block text-xl text-gray-400 font-bold">↓</span>
            <a href="#dashboard-admin" className="block px-3 py-3 bg-orange-100 border-2 border-orange-400 rounded text-sm font-bold text-orange-900 no-underline hover:bg-orange-200 transition-colors">
              Dashboard (Admin)
            </a>
            <span className="block text-xl text-gray-400 font-bold">↓</span>
            <a href="#admin-users" className="block px-3 py-3 bg-orange-100 border-2 border-orange-400 rounded text-sm font-bold text-orange-900 no-underline hover:bg-orange-200 transition-colors">
              Admin Screens
            </a>
          </div>

          <div className="text-center space-y-2">
            <a href="#portal-staff" className="block px-3 py-3 bg-green-100 border-2 border-green-400 rounded text-sm font-bold text-green-900 no-underline hover:bg-green-200 transition-colors">
              Portal (Staff)
            </a>
            <span className="block text-xl text-gray-400 font-bold">↓</span>
            <a href="#dashboard-staff" className="block px-3 py-3 bg-green-100 border-2 border-green-400 rounded text-sm font-bold text-green-900 no-underline hover:bg-green-200 transition-colors">
              Dashboard (Staff)
            </a>
            <span className="block text-xl text-gray-400 font-bold">↓</span>
            <a href="#case-detail" className="block px-3 py-3 bg-green-100 border-2 border-green-400 rounded text-sm font-bold text-green-900 no-underline hover:bg-green-200 transition-colors">
              Case Detail
            </a>
          </div>

          <div className="text-center space-y-2">
            <a href="#portal-adviser" className="block px-3 py-3 bg-purple-100 border-2 border-purple-400 rounded text-sm font-bold text-purple-900 no-underline hover:bg-purple-200 transition-colors">
              Portal (Adviser)
            </a>
            <span className="block text-xl text-gray-400 font-bold">↓</span>
            <a href="#dashboard-adviser" className="block px-3 py-3 bg-purple-100 border-2 border-purple-400 rounded text-sm font-bold text-purple-900 no-underline hover:bg-purple-200 transition-colors">
              Dashboard (Adviser)
            </a>
          </div>
        </div>

        {/* Row 3: Applicant journey (separate path from Home) */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-4">Applicant self-service journey (no login required)</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <a href="#home" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Home
            </a>
            <span className="text-lg text-gray-400 font-bold">→</span>
            <a href="#apply-step-1" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Step 1: Personal
            </a>
            <span className="text-lg text-gray-400 font-bold">→</span>
            <a href="#apply-step-2" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Step 2: Debts
            </a>
            <span className="text-lg text-gray-400 font-bold">→</span>
            <a href="#apply-step-3" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Step 3: Income
            </a>
            <span className="text-lg text-gray-400 font-bold">→</span>
            <a href="#apply-step-4" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Step 4: Review
            </a>
            <span className="text-lg text-gray-400 font-bold">→</span>
            <a href="#apply-step-5" className="block px-3 py-2 bg-blue-100 border-2 border-blue-400 rounded text-center text-xs font-bold text-blue-900 no-underline hover:bg-blue-200 transition-colors">
              Step 5: Result
            </a>
          </div>
        </div>

        {/* Cross-journey links */}
        <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-500 text-center mb-3">Cross-journey navigation</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Staff Dashboard → Case Detail</span>
            <span className="text-gray-300">|</span>
            <span>Admin Portal → Manage Users</span>
            <span className="text-gray-300">|</span>
            <span>Adviser Dashboard → Client Cases</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
