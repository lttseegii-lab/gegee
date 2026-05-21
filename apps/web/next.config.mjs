/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Pollinations.ai AI image gen
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      // Supabase Storage CDN (pre-rendered product images)
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  experimental: {
    // Server actions enabled by default in 14+
  },
};

export default nextConfig;
