/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "simon.heimlicher.com",
      },
    ],
  },
};

module.exports = nextConfig;
