/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    // Ignore critical dependency warning for e2b
    config.ignoreWarnings = [
      {
        module: /node_modules\/e2b/,
      },
    ];
    return config;
  },
};

export default nextConfig;
