/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
    optimizePackageImports: ['lucide-react'],
  },
  // Configure for Cloudflare Pages deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'X-manage-app',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
