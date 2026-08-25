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

module.exports = nextConfig;
