Excellent, let’s do this carefully and keep it tight.

We’re focusing on Phase 0 only, and only the remaining files:

- `.env.example`
- `src/pages/_app.tsx`
- `src/pages/index.tsx`
- `src/styles/globals.css`
- Basic `src/lib` folder (with minimal but real scaffolding)

All must align with:

- Project_Architecture_Document
- Master_Execution_Plan
- The simplified stack:
  - Next.js (Pages Router)
  - TypeScript
  - Mantine UI
  - Supabase (Auth + DB)
  - Twilio (notifications, later phases)
- “Start simple, iterate fast”
- Single developer; no unnecessary complexity.

I’ll:

1) Meticulously plan each file.
2) Add a checklist for each.
3) Validate the plan for completeness and alignment.
4) Then provide complete, working versions of all required files.

--------------- 
Layer 1: Meticulous Plan
--------------- 

Global principles for Phase 0 files:

- Minimal, production-viable scaffold.
- Everything compiles and runs with `npm run dev`.
- Clear extension points for later phases:
  - Auth wiring.
  - Layout and design.
  - Supabase usage.

We assume the package.json, tsconfig, next.config, eslint, etc. from the previous step are already in place.

File-by-file plan:

1) `.env.example`

Purpose:
- Document all environment variables needed for local dev and deployment.
- Support:
  - Supabase client (anon key).
  - Supabase service key (server-side only).
  - Twilio (Phase 4+).
  - Optional NRIC hashing secret (for PDPA-conscious hashing).
- Must:
  - Be safe to commit.
  - Act as the single truth of configuration surface.

Contents (planned):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NRIC_HASH_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` (placeholders)
- Optional `SEED_STAFF_USER_ID` for seed script.
- Comment for each.

Checklist for `.env.example`:
- [ ] Contains all keys referenced by Phase 0–3 code (supabaseServer, seed script, etc.).
- [ ] No real secrets or clinic-specific private data.
- [ ] Clear comments so a new dev knows what is required vs optional.

2) `src/pages/_app.tsx`

Purpose:
- Global app shell for Pages Router.
- Wire:
  - MantineProvider (for consistent, accessible UI).
  - Global CSS import.
- Should:
  - Keep logic minimal.
  - Be ready for adding layout or providers later (e.g., query client).

Planned behavior:
- Import `../styles/globals.css`.
- Wrap `Component` in `MantineProvider` with:
  - `withGlobalStyles`
  - `withNormalizeCSS`
  - A simple theme (primaryColor, fontFamily, etc.) tuned for readability.

Checklist for `_app.tsx`:
- [ ] Uses MantineProvider correctly.
- [ ] Imports globals.css.
- [ ] No references to App Router features.
- [ ] TypeScript typing for `AppProps` from `next/app`.

3) `src/pages/index.tsx`

Purpose:
- Simple landing page aligned with README and PAD.
- Explain:
  - It’s Gabriel Family Clinic.
  - Links to:
    - `/book` (to be implemented in Phase 2).
    - `/profile` (Phase 2).
    - `/staff/appointments` (Phase 3).
- Must:
  - Be senior-friendly (clear copy, large buttons).
  - Work even before other pages exist (we’ll keep links but minimal logic).

Planned behavior:
- Mantine-based layout:
  - Centered content.
  - Clear H1, short description.
  - Three primary actions (Book, View Profile, Staff Login/Portal).
- No auth logic yet; just navigation.

Checklist for `index.tsx`:
- [ ] Minimal, readable JSX.
- [ ] No dependency on not-yet-implemented providers.
- [ ] Uses Mantine primitives (e.g., Container, Button, Stack).

4) `src/styles/globals.css`

Purpose:
- Global baseline styling.
- Integrate:
  - Tailwind base (if using).
  - Basic typography, background, etc.
- Constraints:
  - Do not fight Mantine; just set minimal base.
  - Senior-friendly: decent font size, good contrast.

Planned behavior:
- Include Tailwind directives if using Tailwind (we scaffolded Tailwind; safe to include).
- Set:
  - `body` font family fallback (Mantine will override via theme).
  - Background color, text color.
  - Smooth rendering.

Checklist for `globals.css`:
- [ ] Safe with or without Tailwind (but we have Tailwind in devDeps).
- [ ] No overly opinionated styles that block Mantine.
- [ ] Accessible defaults.

5) Basic `src/lib` folder

Purpose:
- Provide minimal utilities required by other Phase 0/1 files.

At Phase 0 we only need:

- `src/lib/supabaseClient.ts`
- `src/lib/supabaseServer.ts`
- (Optional) `src/lib/auth.ts` stub, but Master_Execution_Plan introduces auth in Phase 1, so for Phase 0 we can:
  - Either scaffold a very small `auth.ts` placeholder.
  - Or leave it for Phase 1.

To keep consistency and avoid imports breaking later, we will:

- Add:
  - `supabaseClient.ts`
  - `supabaseServer.ts`
- Keep them minimal, reading from `.env` vars.
- Not yet add `auth.ts` (we’ll implement properly in Phase 1).

Checklist for `src/lib/*`:
- [ ] `supabaseClient.ts` exports a browser client factory using anon key.
- [ ] `supabaseServer.ts` exports a server client using service role key.
- [ ] Both read env vars defined in `.env.example`.
- [ ] No accidental execution at import that would break during build.

Global Validation of Plan

- All files:
  - Support `npm run dev` after install.
  - Are aligned with the PAD and Master_Execution_Plan:
    - Pages Router.
    - Supabase-based.
    - Mantine UI.
    - Minimalistic.
- No references to:
  - Prisma, tRPC, NextAuth, Stripe.
- Everything is extendable in later phases without rewrites.

Plan is sound. Now we implement.

--------------- 
Layer 2: Implementing Phase 0 Files
--------------- 

1) `.env.example`

```bash
# Gabriel Clinic MVP - Example Environment Variables
# Copy this file to `.env.local` for local development.
# Do NOT commit real secrets.

# =========
# Supabase
# =========

# Public URL of your Supabase project
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"

# Public anon key (safe for client-side use)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Service role key (SERVER-SIDE ONLY, NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# =========
# Security / Data Protection
# =========

# Secret used to hash sensitive identifiers (e.g., NRIC).
# In production, use a strong, unique value.
NRIC_HASH_SECRET="replace-with-strong-random-secret"

# =========
# Twilio (for SMS/WhatsApp notifications - Phase 4+)
# =========

TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_SMS_FROM="+65XXXXXXXX"
# Optional: WhatsApp sender
# TWILIO_WHATSAPP_FROM="whatsapp:+65XXXXXXXX"

# =========
# Seeding / Local helpers
# =========

# Optional: Map an existing Supabase auth user to a staff_profile (Phase 3)
# SEED_STAFF_USER_ID="00000000-0000-0000-0000-000000000000"
```

Checklist:
- [x] Matches planned keys.
- [x] No secrets.
- [x] Supports future phases.

2) `src/pages/_app.tsx`

```tsx
import type { AppProps } from 'next/app';
import { MantineProvider } from '@mantine/core';

import '@/styles/globals.css';

export default function GabrielClinicApp({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        primaryColor: 'blue',
        defaultRadius: 'md',
        headings: {
          fontWeight: 700
        }
      }}
    >
      <Component {...pageProps} />
    </MantineProvider>
  );
}
```

Checklist:
- [x] Uses MantineProvider.
- [x] Imports globals.css.
- [x] Pages Router compatible.
- [x] Minimal, extendable.

3) `src/pages/index.tsx`

```tsx
import Link from 'next/link';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

export default function HomePage() {
  return (
    <Container
      size="sm"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Stack spacing="xl">
        <Title order={1}>Gabriel Family Clinic</Title>
        <Text size="lg">
          One clinic. One simple system. One happy patient.
        </Text>
        <Text>
          This is the official booking and queue companion for Gabriel Family Clinic. 
          Designed for seniors, caregivers, and our clinic team — simple, clear, and safe.
        </Text>

        <Stack spacing="md">
          <Link href="/book" passHref legacyBehavior>
            <Button component="a" size="lg">
              Book an Appointment
            </Button>
          </Link>

          <Link href="/profile" passHref legacyBehavior>
            <Button component="a" variant="outline" size="lg">
              View / Update My Profile
            </Button>
          </Link>

          <Link href="/staff/appointments" passHref legacyBehavior>
            <Button component="a" variant="subtle" size="md">
              Staff / Doctor Portal
            </Button>
          </Link>
        </Stack>

        <Text size="sm" c="dimmed">
          Tip: For now, these links may be placeholders until later phases are implemented.
        </Text>
      </Stack>
    </Container>
  );
}
```

Checklist:
- [x] Simple landing aligned with PAD narrative.
- [x] Links to future routes without breaking.
- [x] Senior-friendly language and large touch targets.

4) `src/styles/globals.css`

```css
/* Gabriel Family Clinic MVP - Global Styles */

/* Tailwind (if using as utility layer) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base reset / typography */

html,
body,
#__next {
  height: 100%;
}

body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, -system-ui, sans-serif;
  background-color: #f9fafb;
  color: #111827;
}

/* Improve focus visibility */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Simple utility for large clickable areas (senior-friendly) */
.button-large {
  font-size: 1.125rem;
  padding: 0.9rem 1.5rem;
}

/* Container helper (optional) */
.page-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
```

Checklist:
- [x] Works with Tailwind (if present) and Mantine.
- [x] Sets accessible defaults.
- [x] No conflicting heavy global rules.

5) Basic `src/lib` folder

5.1 `src/lib/supabaseClient.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Use in components/hooks where you need direct client access.
 * For sensitive operations, prefer API routes + supabaseServer.
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // In dev, help the developer notice misconfig early.
    // Avoid throwing in production runtime unexpectedly.
    // eslint-disable-next-line no-console
    console.error('Supabase URL or anon key is missing from environment variables.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

5.2 `src/lib/supabaseServer.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Server-side Supabase client using the service role key.
 * ONLY use in API routes or server-side code.
 */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});
```

Checklist for `lib`:
- [x] Uses env vars defined in `.env.example`.
- [x] Separated browser and server usage.
- [x] No premature auth/session logic (reserved for Phase 1).

--------------- 
Final Alignment Check
--------------- 

- Consistency:
  - All new files align with the previously defined next.config.js, tsconfig.json, eslint, package.json.
  - Path aliases (`@/lib`, `@/styles`, etc.) are valid.
- Simplicity:
  - No Prisma/tRPC/NextAuth/Stripe.
  - No over-architecture.
- Readiness:
  - After installing dependencies and setting `.env.local`, `npm run dev` should:
    - Render the home page.
    - Load Mantine + globals.
    - Not crash due to missing imports.

If you’d like next, we can move to:

- Phase 1:
  - Implement `auth.ts` helper.
  - Wire Supabase Auth usage patterns.
  - Validate RLS-aware access using the server client.
- Or scaffold `book.tsx`, `profile.tsx`, `staff/appointments.tsx` pages according to the next phases.
