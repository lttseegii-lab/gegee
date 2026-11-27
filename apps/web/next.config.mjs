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
      // Taobao listing photos (products imported via admin → Taobao импорт)
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.tbcdn.cn' },
    ],
  },
  experimental: {
    // Server actions enabled by default in 14+
  },
};

export default nextConfig;
