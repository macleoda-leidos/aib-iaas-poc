/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@aib-iaas/ui-components', '@aib-iaas/shared-types', '@aib-iaas/validation'],
  // Skip type checking during build (handled by CI test step)
  typescript: { ignoreBuildErrors: true },
  // Skip eslint during build
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
