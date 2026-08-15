import { Section } from '../page';

/**
 * LoginScreens — Three static screens showing the Keycloak SSO login flow:
 * 1. Credentials entry
 * 2. Multi-Factor Authentication
 * 3. Session established with SSO propagation
 */
export function LoginScreens() {
  return (
    <>
      {/* Screen 1: Login Credentials */}
      <Section id="login" title="Login — Credentials" screenNumber={5}>
        <div className="min-h-[60vh] bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center p-4 rounded-lg">
          <div className="w-full max-w-md">
            {/* Keycloak Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
                <span className="text-sm font-bold text-gray-700">AiB Identity Service</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Powered by Keycloak &bull; Single Sign-On</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Realm indicator */}
              <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Realm: <strong>aib-internal</strong></span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">OpenID Connect</span>
              </div>

              <div className="p-6">
                <h1 className="text-xl font-bold text-center mb-6 text-gray-800">Sign in to AiB Services</h1>

                {/* Demo account selector */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Demo Account</label>
                  <div className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white">
                    Admin User — System Admin
                  </div>
                </div>

                {/* Username */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username or email</label>
                  <div className="w-full border border-gray-300 rounded p-2.5 text-sm bg-gray-50">
                    admin@aib.example.gov.scot
                  </div>
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <div className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white">
                    ••••••••
                  </div>
                </div>

                {/* Sign In Button */}
                <a href="#login-mfa"
                  className="block w-full bg-blue-600 text-white font-bold py-3 rounded text-center no-underline hover:bg-blue-700 transition-colors mb-4">
                  Sign In
                </a>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">Or sign in with</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Social login buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-center gap-2 p-2.5 border border-gray-300 rounded">
                    <span>🏴</span>
                    <span className="text-sm font-medium">ScotAccount</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2.5 border border-gray-300 rounded">
                    <span>🇬🇧</span>
                    <span className="text-sm font-medium">GOV.UK Login</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t px-6 py-3 text-center">
                <p className="text-xs text-gray-400">
                  Keycloak 24.x &bull; OIDC &bull; SAML 2.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Screen 2: MFA */}
      <Section id="login-mfa" title="Login — Multi-Factor Authentication" screenNumber={6}>
        <div className="min-h-[60vh] bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center p-4 rounded-lg">
          <div className="w-full max-w-md">
            {/* Keycloak Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
                <span className="text-sm font-bold text-gray-700">AiB Identity Service</span>
              </div>
            </div>

            {/* MFA Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Realm: <strong>aib-internal</strong></span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">Step 2 of 2</span>
              </div>

              <div className="p-6">
                {/* Lock icon + heading */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Multi-Factor Authentication</h2>
                  <p className="text-sm text-gray-500">Additional verification required for Admin User</p>
                </div>

                {/* MFA Method Selection */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 p-2 rounded border border-blue-600 bg-blue-50 text-center text-xs font-bold">
                    <p>📱 Authenticator</p>
                    <p className="text-gray-400 font-normal">TOTP</p>
                  </div>
                  <div className="flex-1 p-2 rounded border border-gray-200 text-center text-xs">
                    <p>🔑 Security Key</p>
                    <p className="text-gray-400">WebAuthn</p>
                  </div>
                  <div className="flex-1 p-2 rounded border border-gray-200 text-center text-xs">
                    <p>📧 Email Code</p>
                    <p className="text-gray-400">One-time code</p>
                  </div>
                </div>

                {/* 6-digit code boxes */}
                <div className="mb-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Enter 6-digit code from your authenticator app</label>
                  <div className="flex gap-1 justify-center mb-4">
                    {['1', '2', '3', '4', '5', '6'].map((digit, i) => (
                      <div key={i} className="w-10 h-12 border-2 border-gray-900 rounded flex items-center justify-center text-lg font-bold">
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verify button */}
                <a href="#login-success"
                  className="block w-full bg-blue-600 text-white font-bold py-3 rounded text-center no-underline hover:bg-blue-700 transition-colors mb-4">
                  Verify &amp; Continue
                </a>

                {/* Info text */}
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500 text-center">
                    <strong>MFA powered by Keycloak</strong> — supports TOTP, WebAuthn (FIDO2), SMS, Email OTP.
                    Compatible with Okta Verify, Google Authenticator, Microsoft Authenticator, YubiKey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Screen 3: Session Established */}
      <Section id="login-success" title="Login — Session Established" screenNumber={7}>
        <div className="min-h-[60vh] bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center p-4 rounded-lg">
          <div className="w-full max-w-md">
            {/* Keycloak Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
                <span className="text-sm font-bold text-gray-700">AiB Identity Service</span>
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Realm: <strong>aib-internal</strong></span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Authenticated</span>
              </div>

              <div className="p-6">
                {/* Green checkmark */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl text-green-700">✓</span>
                  </div>
                  <p className="font-bold text-green-800 text-lg">Authentication Successful</p>
                  <p className="text-sm text-gray-600 mt-1">Welcome, Admin User</p>
                </div>

                {/* SSO session info */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <p className="text-sm font-bold text-blue-800 mb-2">🔗 SSO Session Established Across:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['BASYS', 'ASTRA', 'eDEN', 'CFT', 'RoI', 'IAAS'].map(sys => (
                      <div key={sys} className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="font-medium">{sys}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redirecting text */}
                <p className="text-xs text-gray-500 text-center mb-4">Redirecting to unified portal...</p>

                {/* Continue link */}
                <a href="#portal-admin"
                  className="block w-full bg-gov-blue text-white font-bold py-3 rounded text-center no-underline hover:bg-blue-800 transition-colors">
                  Continue to Portal →
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
