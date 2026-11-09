import type {NextConfig} from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  // Default ['**/*'] precaches ~10MB of /public (face models, large svgs) on every SW install.
  globPublicPatterns: ['icons/**/*', 'assets/logo-128.png', 'assets/google.svg', 'assets/facebook.svg'],
});

const supabaseStorage = [{ protocol: 'https' as const, hostname: '*.supabase.co', pathname: '/storage/v1/object/**' }];
try {
  // Custom Supabase domains
  supabaseStorage.push({ protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname, pathname: '/storage/v1/object/**' });
} catch {}

// Security headers for every page. The CSP only uses directives that can't break the app's
// third-party scripts (Google/Facebook sign-in, Turnstile, maps): no framing, no plugins, no
// <base> hijacking, and forms post only to SeeBu. (HTTPS is already forced by HSTS on Vercel;
// upgrade-insecure-requests would break http://localhost during development.)
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera for photo capture and location for "Use my location"; nothing else.
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(), payment=(), usb=()' },
  // Google and Facebook sign-in open popups that must be able to report back.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Linting is oxlint (`npm run lint`), not ESLint; this stops `next build` looking for ESLint.
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@vladmandic/face-api'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion', 'motion'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
      };
    }
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...supabaseStorage,
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withSerwist(nextConfig);
