/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : 'standalone',
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ['@aib-iaas/ui-components', '@aib-iaas/shared-types', '@aib-iaas/validation'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
