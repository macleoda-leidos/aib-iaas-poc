/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'aib-iaas-poc';

const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : 'standalone',
  reactStrictMode: true,
  trailingSlash: true,
  // GitHub Pages serves from /repo-name/ subpath
  basePath: isGitHubPages ? `/${repoName}` : '',
  assetPrefix: isGitHubPages ? `/${repoName}/` : '',
  // @aib-iaas/statutory is safe to pull into the browser bundle: it has zero runtime
  // dependencies, unlike @aib-iaas/database which would drag better-sqlite3 in.
  transpilePackages: ['@aib-iaas/ui-components', '@aib-iaas/shared-types', '@aib-iaas/validation', '@aib-iaas/statutory'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['recharts', 'fuse.js', 'axios'],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

// A static export (output: 'export') cannot emit HTTP response headers — that is
// what the <meta> CSP in src/app/layout.tsx and public/_headers / staticwebapp.config.json
// exist for. When the app is instead served by the Node runtime (output:
// 'standalone'), attach the real header set here. Guarded so an `export` build
// does not warn that `headers()` is unsupported.
if (process.env.NEXT_OUTPUT !== 'export') {
  nextConfig.headers = async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self' 'unsafe-inline'",
            "connect-src 'self' https://iaas-api.onrender.com https://*.onrender.com http://localhost:3001",
            "frame-ancestors 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      ],
    },
  ];
}

module.exports = nextConfig;
