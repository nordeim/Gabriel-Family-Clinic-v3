/**
 * Next.js Configuration for Gabriel Family Clinic
 * Optimized for performance, security, and senior-friendly experience
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Pages Router for simplicity (as per Master Plan)
  // Note: Using App Router features sparingly for better DX
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false, // Strict for production safety
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Internationalization for multi-language support (English, Chinese, Malay, Tamil)
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ms', 'ta'],
    localeDetection: true,
  },

  // Image Optimization
  images: {
    domains: [
      'localhost',
      'gabrielfamilyclinic.sg',
      'supabase.co',
      'githubusercontent.com',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.supabase.co *.vercel.app;
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: *.supabase.co *.githubusercontent.com;
              font-src 'self' data:;
              connect-src 'self' *.supabase.co *.twilio.com wss://*.supabase.co;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Redirects for common paths
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/doctor/login',
        permanent: false,
      },
      {
        source: '/appointments',
        destination: '/portal/appointments',
        permanent: false,
      },
    ];
  },

  // API Rewrites (if needed for external services)
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Environment Variables Validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: 'Gabriel Family Clinic',
    NEXT_PUBLIC_APP_VERSION: '3.0.0',
    NEXT_PUBLIC_CLINIC_PHONE: '+6567891234',
    NEXT_PUBLIC_CLINIC_ADDRESS: '123 Tampines Street 11, #01-456, Singapore 521123',
  },

  // Webpack Configuration
  webpack: (config, { isServer, dev }) => {
    // Path aliases (matching tsconfig)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
    };

    // Bundle analyzer (only in development)
    if (!isServer && !dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: true,
          reportFilename: path.join(__dirname, 'analyze', 'client.html'),
        })
      );
    }

    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/node-fetch/ },
    ];

    return config;
  },

  // Experimental Features (use sparingly)
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // serverActions: false, // Not using server actions for simplicity
  },

  // Output Configuration
  output: 'standalone', // For Docker deployment
  distDir: '.next',
  cleanDistDir: true,
  generateBuildId: async () => {
    // Generate build ID based on git commit or timestamp
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },

  // Performance Monitoring
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,

  // PWA Configuration (using next-pwa)
  // Configured separately in next-pwa wrapper
};

// PWA Configuration wrapper
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'service-worker.js',
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: '/offline',
  },
  cacheStartUrl: true,
  dynamicStartUrl: false,
});

// Bundle Analyzer wrapper (only when ANALYZE is true)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Export with conditional wrappers
module.exports = process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(withPWA(nextConfig))
  : withPWA(nextConfig);
