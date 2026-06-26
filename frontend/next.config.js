/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSR-first; no SSR needed for this SaaS app
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
