# Project Scaffold Files for Gabriel Family Clinic v3.0

Based on the Project Architecture Document and Master Execution Plan, I'll create the scaffold files that balance the simplified architecture approach with your existing package versions.

---

## 1. `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "project": {
    "name": "gabriel-family-clinic",
    "version": "3.0.0",
    "description": "Neighborhood-first digital platform for Gabriel Family Clinic",
    "author": "Gabriel Family Clinic",
    "license": "MIT"
  },
  "features": {
    "darkMode": false,
    "animations": true,
    "responsiveDesign": true,
    "accessibility": "AAA",
    "rtl": false
  },
  "mantine": {
    "primaryColor": "blue",
    "defaultRadius": "md",
    "loader": "dots",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "Asia/Singapore",
    "firstDayOfWeek": 1,
    "respectReducedMotion": true,
    "cursorType": "pointer",
    "focusRing": "auto"
  }
}
```

---

## 2. `eslint.config.js`

```javascript
/**
 * ESLint Configuration for Gabriel Family Clinic
 * Prioritizes simplicity, readability, and maintainability
 */

const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  // Extend Next.js and TypeScript recommended configs
  ...compat.extends(
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // TypeScript Rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': false,
          'ts-nocheck': false,
          'ts-check': false,
        },
      ],

      // React Rules
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Next.js handles this
      'react/jsx-filename-extension': [
        'warn',
        { extensions: ['.jsx', '.tsx'] },
      ],
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import Rules
      'import/prefer-default-export': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // General Rules
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-use-before-define': 'off',
      'no-nested-ternary': 'warn',
      'no-underscore-dangle': [
        'warn',
        {
          allow: ['_id', '__dirname', '__filename'],
        },
      ],

      // Accessibility Rules (Critical for elderly users)
      'jsx-a11y/anchor-is-valid': [
        'warn',
        {
          components: ['Link'],
          specialLink: ['hrefLeft', 'hrefRight'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // Next.js Specific
      '@next/next/no-html-link-for-pages': ['error', 'src/pages'],
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      '.next',
      'out',
      'public',
      'node_modules',
      'build',
      'dist',
      '.turbo',
      'coverage',
      '.nyc_output',
      '*.min.js',
      '**/vendor/**',
    ],
  },
];
```

---

## 3. `next.config.js`

```javascript
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
```

---

## 4. `package.json`

```json
{
  "name": "gabriel-family-clinic",
  "version": "3.0.0",
  "description": "Neighborhood-first digital platform for Gabriel Family Clinic - One Clinic, One Feature, One Happy Patient",
  "private": true,
  "author": {
    "name": "Gabriel Family Clinic",
    "email": "tech@gabrielfamilyclinic.sg"
  },
  "license": "MIT",
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx scripts/seed.ts",
    "db:studio": "prisma studio",
    "analyze": "ANALYZE=true npm run build",
    "clean": "rm -rf .next out coverage .turbo",
    "preinstall": "npx only-allow npm",
    "postinstall": "prisma generate",
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "check-types": "tsc --noEmit",
    "check-all": "npm run format:check && npm run lint && npm run type-check && npm run test"
  },
  "dependencies": {
    "@auth/prisma-adapter": "2.11.1",
    "@daily-co/daily-js": "0.85.0",
    "@hookform/resolvers": "5.2.2",
    "@mantine/core": "7.17.8",
    "@mantine/dates": "7.17.8",
    "@mantine/form": "7.17.8",
    "@mantine/hooks": "7.17.8",
    "@mantine/modals": "7.17.8",
    "@mantine/notifications": "7.17.8",
    "@mantine/nprogress": "7.17.8",
    "@prisma/client": "6.19.0",
    "@radix-ui/react-label": "2.1.8",
    "@radix-ui/react-select": "2.2.6",
    "@radix-ui/react-slot": "1.2.4",
    "@stripe/react-stripe-js": "5.3.0",
    "@stripe/stripe-js": "8.3.0",
    "@supabase/ssr": "0.7.0",
    "@supabase/supabase-js": "2.80.0",
    "@t3-oss/env-nextjs": "0.13.8",
    "@tanstack/react-query": "5.90.7",
    "@trpc/client": "11.7.1",
    "@trpc/next": "11.7.1",
    "@trpc/react-query": "11.7.1",
    "@trpc/server": "11.7.1",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0",
    "dayjs": "1.11.19",
    "dotenv": "16.6.1",
    "framer-motion": "^11.0.0",
    "immer": "^10.0.3",
    "lucide-react": "0.553.0",
    "micro": "10.0.1",
    "next": "14.2.33",
    "next-auth": "4.24.13",
    "next-pwa": "5.6.0",
    "qrcode": "^1.5.3",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.66.0",
    "react-hot-toast": "^2.4.1",
    "react-query": "^3.39.3",
    "react-server-dom-webpack": "19.2.0",
    "resend": "3.5.0",
    "server-only": "0.0.1",
    "sharp": "^0.33.0",
    "stripe": "16.12.0",
    "superjson": "2.2.5",
    "swr": "^2.2.5",
    "tailwind-merge": "2.6.0",
    "twilio": "5.10.4",
    "uuid": "^9.0.1",
    "zod": "3.25.76",
    "zustand": "4.5.7"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "16.0.1",
    "@playwright/test": "1.56.1",
    "@testing-library/dom": "^9.3.4",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/jest": "^29.5.11",
    "@types/node": "20.19.24",
    "@types/qrcode": "^1.5.5",
    "@types/react": "18.3.26",
    "@types/react-dom": "18.3.7",
    "@types/testing-library__react": "^10.2.0",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "autoprefixer": "10.4.21",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.33",
    "eslint-config-prettier": "9.1.2",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "k6": "0.0.0",
    "lint-staged": "^15.2.0",
    "postcss": "8.5.6",
    "postcss-preset-mantine": "1.18.0",
    "postcss-simple-vars": "7.0.1",
    "prettier": "3.6.2",
    "prettier-plugin-tailwindcss": "0.7.1",
    "prisma": "6.19.0",
    "snyk": "1.1300.2",
    "tailwindcss": "3.4.18",
    "tsx": "^4.7.0",
    "typescript": "5.9.3"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "prisma": {
    "schema": "src/lib/prisma/schema.prisma",
    "seed": "tsx scripts/seed.ts"
  },
  "keywords": [
    "clinic",
    "healthcare",
    "medical",
    "appointment",
    "booking",
    "singapore",
    "nextjs",
    "typescript",
    "supabase",
    "mantine"
  ]
}
```

---

## 5. `postcss.config.js`

```javascript
/**
 * PostCSS Configuration for Gabriel Family Clinic
 * Integrates Mantine UI and Tailwind CSS processing
 */

module.exports = {
  plugins: {
    // Tailwind CSS
    'tailwindcss': {},
    
    // Autoprefixer for browser compatibility
    'autoprefixer': {},
    
    // Mantine PostCSS preset for component styles
    'postcss-preset-mantine': {
      autoRem: true, // Convert px to rem for better accessibility
      mantineBreakpoints: {
        xs: '36em',   // 576px
        sm: '48em',   // 768px
        md: '62em',   // 992px
        lg: '75em',   // 1200px
        xl: '88em',   // 1408px
      },
    },
    
    // Simple variables for consistent theming
    'postcss-simple-vars': {
      variables: {
        // Colors aligned with clinic branding
        'primary-color': '#3B82F6',     // Blue
        'secondary-color': '#10B981',   // Green
        'error-color': '#EF4444',       // Red
        'warning-color': '#F59E0B',     // Amber
        'info-color': '#0EA5E9',        // Sky
        
        // Spacing for consistency
        'spacing-xs': '0.5rem',
        'spacing-sm': '1rem',
        'spacing-md': '1.5rem',
        'spacing-lg': '2rem',
        'spacing-xl': '3rem',
        
        // Typography
        'font-primary': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-mono': '"JetBrains Mono", "SF Mono", monospace',
        
        // Shadows for depth
        'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        
        // Border radius for consistency
        'radius-sm': '0.25rem',
        'radius-md': '0.5rem',
        'radius-lg': '0.75rem',
        'radius-xl': '1rem',
        'radius-full': '9999px',
        
        // Z-index layers
        'z-dropdown': '1000',
        'z-sticky': '1020',
        'z-fixed': '1030',
        'z-modal-backdrop': '1040',
        'z-modal': '1050',
        'z-popover': '1060',
        'z-tooltip': '1070',
        
        // Transition timing
        'transition-fast': '150ms',
        'transition-base': '250ms',
        'transition-slow': '350ms',
        
        // Breakpoints (matching Mantine)
        'breakpoint-xs': '576px',
        'breakpoint-sm': '768px',
        'breakpoint-md': '992px',
        'breakpoint-lg': '1200px',
        'breakpoint-xl': '1408px',
      },
    },
    
    // CSS Nano for production optimization (conditionally)
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            colormin: true,
            convertValues: true,
            calc: true,
            svgo: false, // Let Next.js handle SVG optimization
          },
        ],
      },
    }),
  },
};
```

---

## 6. `tailwind.config.js`

```javascript
/**
 * Tailwind CSS Configuration for Gabriel Family Clinic
 * Optimized for accessibility and senior-friendly UI
 */

const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via class (though we primarily use light mode)
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Colors aligned with healthcare and trust
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#3B82F6', // Trust blue
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        secondary: {
          DEFAULT: '#10B981', // Healthcare green
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Semantic colors for medical context
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#0EA5E9',
        // CHAS tier colors
        chas: {
          blue: '#3B82F6',
          orange: '#FB923C',
          green: '#22C55E',
          pioneer: '#8B5CF6',
          merdeka: '#EC4899',
        },
      },
      
      // Border radius for friendly UI
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      // Typography optimized for readability
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
        // Chinese font support
        chinese: ['"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      
      // Font sizes with better accessibility
      fontSize: {
        // Larger base sizes for elderly users
        'xs': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        'sm': ['0.9375rem', { lineHeight: '1.5' }],   // 15px
        'base': ['1rem', { lineHeight: '1.6' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.6' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.5' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.3' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1.1' }],       // 48px
      },
      
      // Spacing for touch targets (minimum 48px for elderly users)
      spacing: {
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
        '128': '32rem',  // 512px
      },
      
      // Animation timings for smooth UX
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
      
      // Screen breakpoints aligned with common devices
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for specific layouts
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      
      // Min height for better mobile experience
      minHeight: {
        '0': '0',
        'screen': '100vh',
        'screen-small': '100svh', // Small viewport height
        'screen-large': '100lvh', // Large viewport height
      },
      
      // Z-index system
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom plugin for focus-visible utilities
    function({ addUtilities }) {
      addUtilities({
        '.focus-visible-ring': {
          '@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500': {},
        },
        '.touch-target': {
          '@apply min-h-[48px] min-w-[48px]': {}, // WCAG AAA touch target size
        },
      });
    },
  ],
};
```

---

## 7. `tsconfig.json`

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    
    // Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    
    // Modules
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/store/*": ["./src/store/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/utils/*": ["./src/lib/utils/*"],
      "@/api/*": ["./src/pages/api/*"],
      "@/public/*": ["./public/*"]
    },
    "rootDir": ".",
    "typeRoots": ["./node_modules/@types", "./src/types"],
    
    // Emit
    "noEmit": true,
    "importHelpers": true,
    "importsNotUsedAsValues": "remove",
    "downlevelIteration": true,
    "sourceMap": true,
    "inlineSourceMap": false,
    "inlineSources": false,
    "declaration": false,
    "declarationMap": false,
    "removeComments": true,
    "preserveConstEnums": true,
    
    // JavaScript Support
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    
    // Skip Lib Check for faster builds
    "skipLibCheck": true,
    
    // Experimental
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    
    // Next.js specific
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/**/*",
    "scripts/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "build",
    "dist",
    "coverage",
    ".turbo",
    "**/*.spec.ts",
    "**/*.test.ts",
    "cypress",
    "playwright-report"
  ],
  "ts-node": {
    "compilerOptions": {
      "module": "commonjs",
      "target": "ES2022",
      "strict": false
    }
  }
}
```

---

## Additional Configuration Files

### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSameLine": false,
  "jsxSingleQuote": false,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.js",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "printWidth": 80
      }
    },
    {
      "files": "*.md",
      "options": {
        "proseWrap": "always"
      }
    }
  ]
}
```

### `.gitignore`

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.nyc_output
playwright-report
test-results

# Next.js
.next
out
build
dist

# Production
build
dist

# Misc
.DS_Store
*.pem
.vscode
.idea

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env*.local
!.env.example

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# PWA
public/sw.js
public/workbox-*.js

# Sentry
.sentryclirc

# Database
*.db
*.db-journal
*.sqlite
*.sqlite3

# Logs
logs
*.log

# OS files
Thumbs.db

# IDE
.vscode/*
!.vscode/extensions.json
.idea
.fleet

# Testing
cypress/videos
cypress/screenshots
cypress/downloads

# Bundle analyzer
analyze

# Backup files
*.backup
*.bak

# Temporary files
tmp
temp
.tmp
```

### `.nvmrc`

```
18.17.0
```

---

## Summary

These scaffold files provide a solid foundation for the Gabriel Family Clinic project with:

1. **Simplified Architecture**: Following the Master Plan's recommendation for simplicity while keeping your existing package versions
2. **Senior-Friendly Focus**: Larger touch targets, better contrast, accessibility-first
3. **Security Built-in**: CSP headers, HTTPS enforcement, secure cookies
4. **Performance Optimized**: PWA support, image optimization, code splitting
5. **Developer Experience**: TypeScript strict mode, ESLint, Prettier, hot reload
6. **Testing Ready**: Jest, React Testing Library, Playwright configured
7. **Deployment Ready**: Docker support, Vercel optimization, bundle analysis

The configuration balances the need for a robust system with the simplicity required for single-developer maintenance, focusing on the core mission: helping Mdm. Tan book her appointment in under 3 minutes.
