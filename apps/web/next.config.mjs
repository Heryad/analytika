/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@analytika/tracker"],
  devIndicators: false,
};

export default nextConfig;
