/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Log server-side errors to the console
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
