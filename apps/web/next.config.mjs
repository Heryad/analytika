/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@analytika/sdk"],
  devIndicators: false,
};

export default nextConfig;
