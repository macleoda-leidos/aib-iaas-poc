/** @type {import('next').NextConfig} */
module.exports = { output: 'standalone', reactStrictMode: true, typescript: { ignoreBuildErrors: true }, transpilePackages: ['@aib-iaas/ui-components', '@aib-iaas/shared-types'] };
