/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@analytika-me/tracker"],
  devIndicators: false,
};

export default nextConfig;
