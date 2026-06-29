/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@aib-iaas/ui-components', '@aib-iaas/shared-types', '@aib-iaas/validation'],
};

module.exports = nextConfig;
