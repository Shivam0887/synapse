/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
        protocol: "https",
      },
      {
        hostname: "img.clerk.com",
        protocol: "https",
      },
    ],
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    return config;
  },
  reactStrictMode: false,
};

export default nextConfig;
