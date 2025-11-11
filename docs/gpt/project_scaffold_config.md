Great brief, and thank you for the detailed source configs.

We’ll do this in two layers:

- Layer 1: Plan and validate replacements so they align tightly with:
  - Project_Architecture_Document
  - Master_Execution_Plan
  - Supabase (no Prisma/tRPC/NextAuth/Stripe complexity for MVP)
  - “Start simple, iterate fast” + single-developer maintainability.

- Layer 2: Provide complete, ready-to-use replacement files:
  - components.json
  - eslint.config.js
  - next.config.js
  - package.json
  - postcss.config.js
  - tailwind.config.js
  - tsconfig.json
  - (Plus minimal .prettierrc and .gitignore adjustments consistent with this setup)

I will simplify where prior configs overreach (Prisma, tRPC, heavy PWA stack, etc.) but keep compatibility with the Node/package versions you shared and the architecture we designed.

Important: All code below is meant as a drop-in replacement set for this MVP codebase.

--------------------
Layer 1: Meticulous Planning
--------------------

Key alignment points:

1) Scope:
- Single Next.js app using Pages Router.
- Supabase (auth + DB).
- Mantine for UI; Tailwind optional/minimal; no Shadcn UI complexity required.
- Twilio for SMS.
- Jest + Playwright set up (already designed).
- No Prisma, no tRPC, no NextAuth, no Stripe in MVP: remove to reduce cognitive/ops load.

2) Config principles:
- components.json:
  - Reflect Mantine-first, accessible design.
  - Keep aliases consistent with tsconfig and next.config.
- eslint.config.js:
  - Flat config.
  - Next + TS + JSX-a11y + Prettier.
  - Keep rules strict but pragmatic.
- next.config.js:
  - Pages Router.
  - Security headers (CSP, HSTS).
  - Basic i18n for en/zh/ms/ta.
  - Standalone for Docker.
  - No heavy PWA or unused wrappers for MVP.
- package.json:
  - Only required deps:
    - next, react, react-dom, @supabase/supabase-js, @supabase/ssr,
      @mantine/core/hooks, zod, react-hook-form, dayjs, twilio, dotenv.
    - Jest, Playwright, ESLint, Prettier, Tailwind, etc. as devDeps.
  - Scripts aligned to Master_Execution_Plan:
    - dev, build, start, lint, test:unit, test:integration, test:e2e, db:seed.
- postcss.config.js:
  - Tailwind + autoprefixer; Mantine does not require PostCSS, keep config lean.
- tailwind.config.js:
  - Focus on simple, accessible defaults.
  - No unnecessary plugins; lean utilities.
- tsconfig.json:
  - Strict, aligned paths, no Prisma/tRPC aliases.
- .prettierrc + .gitignore:
  - Ensure compatibility with chosen stack.

Validation:
- All configs must:
  - Point to src structure as defined in PAD.
  - Avoid stale references (no prisma, no t3-env, no next-auth, etc.).
  - Be easy to understand and own by one dev.

Plan checks out. Now to produce the replacements.

--------------------
Layer 2: Complete Replacement Files
--------------------

1) components.json

A lean configuration focused on Mantine + our aliases. We keep the shadcn schema reference harmless; it won’t affect runtime.

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
    "name": "gabriel-clinic-mvp",
    "version": "1.0.0",
    "description": "Gabriel Family Clinic MVP – One clinic, one simple system, one happy patient.",
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

Notes:
- Keeps aliases in sync with planned structure.
- No over-specific UI frameworks beyond what we actually use.

--------------------
2) eslint.config.js

Flat config, Next + TS + a11y + Prettier. Removed Prisma/tRPC/etc. references.

```javascript
/**
 * ESLint Configuration for Gabriel Family Clinic MVP
 * Prioritizes simplicity, readability, accessibility, and maintainability.
 */

const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname
});

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Base configs: Next.js, TS, Prettier, a11y
  ...compat.extends(
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ),

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: path.resolve(__dirname, 'tsconfig.json')
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
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
          'ts-check': false
        }
      ],

      // React
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Imports
      'import/prefer-default-export': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }
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
            'type'
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal'
            }
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],

      // General
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-use-before-define': 'off',
      'no-nested-ternary': 'warn',

      // Accessibility (crucial for seniors)
      'jsx-a11y/anchor-is-valid': [
        'warn',
        {
          components: ['Link'],
          aspects: ['invalidHref', 'preferButton']
        }
      ]
    }
  },

  // Tests: relax some rules
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },

  // Configs and scripts: allow console and require
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  },

  // Ignores
  {
    ignores: [
      '.next',
      'out',
      'public',
      'node_modules',
      'dist',
      'coverage',
      '.turbo',
      'playwright-report',
      'test-results'
    ]
  }
];
```

--------------------
3) next.config.js

Simplified, secure, aligned with PAD/Master Plan. No unnecessary PWA/Prisma/NextAuth.

```javascript
/**
 * Next.js Configuration for Gabriel Family Clinic MVP
 * Optimized for simplicity, security, and a senior-friendly experience.
 */

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // We use the Pages Router, not App Router, for MVP simplicity.
  // (App Router can be introduced later if needed.)

  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src']
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ms', 'ta'],
    localeDetection: true
  },

  images: {
    domains: ['localhost', 'supabase.co', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp']
  },

  async headers() {
    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co;",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob: *.supabase.co;",
      "font-src 'self' data:;",
      "connect-src 'self' *.supabase.co *.twilio.com;",
      "frame-ancestors 'none';",
      "base-uri 'self';",
      "form-action 'self';"
    ]
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp }
        ]
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }]
      }
    ];
  },

  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/appointments',
        destination: '/book',
        permanent: false
      },
      {
        source: '/admin',
        destination: '/staff/appointments',
        permanent: false
      }
    ];
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'Gabriel Family Clinic',
    NEXT_PUBLIC_CLINIC_PHONE: '+6560000000',
    NEXT_PUBLIC_CLINIC_ADDRESS: '123 Sample Street, #01-234, Singapore',
    NEXT_PUBLIC_TIMEZONE: 'Asia/Singapore'
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/types': path.resolve(__dirname, 'src/types')
    };
    return config;
  },

  output: 'standalone',
  distDir: '.next'
};

module.exports = nextConfig;
```

--------------------
4) package.json

Aligned with Master_Execution_Plan: no Prisma, no tRPC, no NextAuth; includes Jest+Playwright+Tailwind+Mantine+Supabase+Twilio, using versions consistent with the list you provided where applicable.

```json
{
  "name": "gabriel-clinic-mvp",
  "version": "1.0.0",
  "description": "Neighborhood-first MVP for Gabriel Family Clinic – One clinic, one simple system, one happy patient.",
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
    "test:unit": "jest --runInBand --selectProjects default",
    "test:integration": "jest --runInBand --selectProjects default",
    "test:e2e": "playwright test",
    "db:seed": "ts-node scripts/seed.ts",
    "clean": "rm -rf .next dist coverage playwright-report test-results",
    "check-all": "npm run format:check && npm run lint && npm run type-check && npm run test"
  },
  "dependencies": {
    "@hookform/resolvers": "5.2.2",
    "@mantine/core": "7.17.8",
    "@mantine/hooks": "7.17.8",
    "@supabase/ssr": "0.7.0",
    "@supabase/supabase-js": "2.80.0",
    "dayjs": "1.11.19",
    "dotenv": "16.6.1",
    "next": "14.2.33",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.66.0",
    "twilio": "5.10.4",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "16.0.1",
    "@playwright/test": "1.56.1",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/jest": "29.5.14",
    "@types/node": "20.19.24",
    "@types/react": "18.3.26",
    "@types/react-dom": "18.3.7",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "autoprefixer": "10.4.21",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.33",
    "eslint-config-prettier": "9.1.2",
    "eslint-plugin-jsx-a11y": "6.8.0",
    "jest": "29.7.0",
    "jest-environment-jsdom": "29.7.0",
    "lint-staged": "15.2.0",
    "node-mocks-http": "1.15.1",
    "postcss": "8.5.6",
    "prettier": "3.6.2",
    "prettier-plugin-tailwindcss": "0.7.1",
    "tailwindcss": "3.4.18",
    "ts-jest": "29.2.5",
    "ts-node": "10.9.2",
    "tsx": "4.7.0",
    "typescript": "5.9.3",
    "playwright": "1.56.1"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  },
  "keywords": [
    "clinic",
    "healthcare",
    "appointment",
    "booking",
    "singapore",
    "nextjs",
    "typescript",
    "supabase",
    "mantine",
    "twilio",
    "mvp"
  ]
}
```

Notes:
- Intentionally omits Prisma, NextAuth, Stripe, tRPC to keep MVP aligned with Master Plan.
- Uses ts-jest and playwright as previously planned.

--------------------
5) postcss.config.js

Lean: Tailwind + autoprefixer (+ optional Mantine preset if you like, but not required).

```javascript
/**
 * PostCSS Configuration for Gabriel Family Clinic MVP
 * Keep it simple: Tailwind + Autoprefixer.
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

--------------------
6) tailwind.config.js

Simple, senior-friendly, but not overblown. We mainly rely on Mantine; Tailwind is a utility supplement.

```javascript
/**
 * Tailwind CSS Configuration for Gabriel Family Clinic MVP
 * Lightweight utility layer alongside Mantine.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6'
        },
        secondary: {
          DEFAULT: '#10B981'
        },
        danger: {
          DEFAULT: '#EF4444'
        }
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }]
      }
    }
  },
  plugins: []
};
```

--------------------
7) tsconfig.json

Strict, aligned with our path aliases and no Prisma/tRPC noise.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false,

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/types/*": ["./src/types/*"]
    },

    "noEmit": true,
    "esModuleInterop": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "types": ["jest", "node"],

    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "scripts/**/*.ts",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    "jest.config.cjs",
    "playwright.config.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "dist",
    "coverage",
    "playwright-report",
    "test-results"
  ]
}
```

--------------------
8) Minimal .prettierrc (for completeness)

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

--------------------
9) Minimal .gitignore (aligned with this stack)

```gitignore
node_modules
.next
dist
out
coverage
playwright-report
test-results
.env
.env*.local
!.env.example
.vercel
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
pnpm-lock.yaml
```

--------------------
Validation Summary

- No unused heavy dependencies (Prisma, NextAuth, tRPC, Stripe) to confuse or burden the solo dev.
- All configs align with:
  - Supabase + Next.js Pages Router.
  - Mantine + optional Tailwind utilities.
  - Our API handlers and directory structure.
- Security-conscious:
  - CSP, HSTS, basic headers included.
- DX-conscious:
  - Strict TS, ESLint + Prettier, Jest + Playwright ready.
- Faithful to “start simple, iterate fast”:
  - Everything focuses on the MVP slices: auth integration, patient profile, booking, staff portal, notifications.

If you’d like next, I can:

- Generate initial `src` scaffolding:
  - `_app.tsx` with Mantine provider.
  - `index.tsx`, `book.tsx`, `profile.tsx`, `staff/appointments.tsx`.
- Or produce a short “Diff Guide” to move from your current repo to this streamlined MVP safely.
