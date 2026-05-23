import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // 開発時は React が eval() を使用するため unsafe-eval を許可
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // 地図タイル・Leaflet アイコン（unpkg.com）・Supabase Storage 写真
  // 開発時はローカル Supabase（127.0.0.1:54321）も許可
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com https://*.supabase.co${isDev ? " http://127.0.0.1:54321" : ""}`,
  // Nominatim・Supabase はすべて API Route 経由のためサーバー側のみ
  "connect-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // カメラ・マイク不要、位置情報は地図機能で使用
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // トンネル経由でのローカル開発アクセスを許可（iPhone で geolocation をテストするため）
  ...(isDev && {
    allowedDevOrigins: [
      "*.trycloudflare.com", // Cloudflare Quick Tunnel（アカウント不要）
      "*.loca.lt",           // localtunnel（アカウント不要）
      "*.ngrok-free.app",    // ngrok free（要アカウント）
      "*.ngrok.io",          // ngrok paid（要アカウント）
    ],
  }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
