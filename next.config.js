/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aliexpress.com',
      },
      {
        protocol: 'https',
        hostname: '**.shein.com',
      },
      {
        protocol: 'https',
        hostname: '**.taobao.com',
      },
      {
        protocol: 'https',
        hostname: '**.temu.com',
      },
      {
        protocol: 'https',
        hostname: '**.aepic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
