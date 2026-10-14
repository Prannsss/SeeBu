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

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
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
