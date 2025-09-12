/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] }
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Basic CSP for embeds (tune as needed)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
              "connect-src 'self' https:",
              "font-src 'self' data:",
              "object-src 'none'"
            ].join("; ")
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};
export default nextConfig;
