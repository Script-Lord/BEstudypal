/** @type {import('next').NextConfig} */
const nextConfig = {
  // All pages are 'use client' — no server actions or SSR needed.
  // Vercel handles routing for dynamic segments ([docId]) natively.
  images: { unoptimized: true },
};

module.exports = nextConfig;
