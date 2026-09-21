/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow high payload sizes for Base64 screenshots if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
