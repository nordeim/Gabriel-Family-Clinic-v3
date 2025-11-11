Excellent. We’ll treat Phase 1 as the “safety-critical backbone”: schema + auth done right so everything else is built on solid ground.

We will:

1) Meticulously plan each Phase 1 artifact.
2) Define a checklist per file.
3) Validate alignment with:
   - Project_Architecture_Document
   - Master_Execution_Plan
   - The already-created Phase 0 files
4) Then implement the complete, ready-to-use files.

Note: You already provided target snippets for `supabaseClient`, `supabaseServer`, and `auth`. I’ll integrate those into a cohesive, production-minded baseline and make sure `database_schema.sql` matches the migrations we defined.

-------------------
Layer 1: Meticulous Plan
-------------------

Phase 1 Objective Recap:

- Stand up a Supabase-backed database with:
  - Finalized schema.
  - RLS policies.
- Establish basic auth utilities in the codebase:
  - A client and server Supabase instance.
  - Request-level user extraction and a `requireAuth` helper.

We’ll create/confirm:

1) `database_schema.sql`
2) `supabase/schema.sql` (optional mirror for Supabase CLI)
3) `src/lib/supabaseClient.ts`
4) `src/lib/supabaseServer.ts`
5) `src/lib/auth.ts`

Global constraints:

- Use Supabase Auth (`auth.users`) as the identity root.
- Link:
  - `patient_profiles.user_id` → `auth.users.id`
  - `staff_profiles.user_id` → `auth.users.id`
- Use RLS policies based on `auth.uid()`.
- Our app:
  - On server/API side, usually uses a service-role client (`supabaseServer`).
  - Auth uses JWT from client (header or cookie) to derive user id.
  - We combine JWT-based user in code with DB-level RLS for additional safety where appropriate.

Now, file-by-file planning.

1) `database_schema.sql`

Purpose:
- Single authoritative schema file for:
  - Local dev.
  - Supabase SQL editor.
  - Reference for migrations.

Content (must include):

- Extensions:
  - `pgcrypto` (for `gen_random_uuid()`).
- Utility:
  - `set_updated_at()` trigger.
- Tables:
  - `schema_migrations` (optional bookkeeping).
  - `patient_profiles`
  - `staff_profiles`
  - `doctors`
  - `clinic_settings`
  - `appointments`
  - `notifications`
- RLS:
  - Enabled on key tables.
  - Policies referencing `auth.uid()` for:
    - Patients (own data).
    - Staff (via `staff_profiles`).
    - Public where appropriate (`doctors`, `clinic_settings`).
- Idempotent:
  - Use IF NOT EXISTS where safe.

Checklist:
- [ ] Applies cleanly on Supabase.
- [ ] All columns used by our API code exist.
- [ ] RLS enabled and policies match our access model.
- [ ] No Prisma/tRPC/NextAuth artifacts.
- [ ] Uses `auth.uid()` only where available (Supabase).

2) `supabase/schema.sql` (optional)

Purpose:
- Mirror of `database_schema.sql` for Supabase CLI migrations.
- Might simply `\i` or copy contents.

Plan:
- Keep it identical or a simple include; I’ll make it a direct copy for clarity.

Checklist:
- [ ] Kept in sync with `database_schema.sql`.
- [ ] No divergence to avoid confusion.

3) `src/lib/supabaseClient.ts`

Purpose:
- Create a browser-side client using anon key.
- Used by pages/components when they need direct Supabase interaction.
- For MVP, we’ll favor calling our own API routes, but having this client ready is useful.

Plan:
- Use `createBrowserClient` from `@supabase/ssr`.
- Export a function `supabaseClient()` that returns a client instance.
- Validate env vars exist (log helpful error in dev).

Checklist:
- [ ] Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] No service role key (never in browser).
- [ ] Works with our `tsconfig` paths.

4) `src/lib/supabaseServer.ts`

Purpose:
- Server-side Supabase client with service role.
- Used ONLY in:
  - API routes.
  - Seed scripts (if imported there).
- Must never leak `serviceRoleKey` to client.

Plan:
- Use `createClient` from `@supabase/supabase-js`.
- Read:
  - URL from `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`.
  - Key from `SUPABASE_SERVICE_ROLE_KEY`.
- Disable session persistence.

Checklist:
- [ ] Uses service role key only.
- [ ] No side effects on import.
- [ ] Safe defaults; if env missing, surfaces clear error in logs.

5) `src/lib/auth.ts`

Purpose:
- Provide basic helpers to:
  - Extract Supabase user from a request.
  - Enforce auth in API handlers (`requireAuth`).

Constraints:
- We’re in Next.js Pages Router, using API routes.
- Tokens may come from:
  - `Authorization: Bearer <access_token>`
  - `sb-access-token` cookie (depending on frontend integration).
- Implementation:
  - Uses `supabaseServer.auth.getUser(token)` to validate token and fetch user.
- Will be refined later as we implement real login flows, but must be:
  - Minimal.
  - Correct enough to guard endpoints.

Checklist:
- [ ] `getUserFromRequest`:
  - Reads bearer token or cookie.
  - Returns null if invalid.
- [ ] `requireAuth`:
  - Throws a predictable error if no user.
- [ ] Pure utility, no framework coupling beyond Next’s `NextApiRequest`.

Global Phase 1 Checklist (from Master_Execution_Plan):

- [ ] Supabase project created.
- [ ] `database_schema.sql` applied successfully.
- [ ] RLS enabled & verified.
- [ ] Test user can sign up via Supabase.
- [ ] Tables visible/valid in Supabase Studio.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only used server-side.

Plan validated: It is consistent with our PAD, Master Plan, and existing Phase 0. Now let’s implement.

-------------------
Layer 2: Phase 1 Implementations
-------------------

1) `database_schema.sql`

Complete authoritative schema (aligned with prior migrations we designed).

```sql
-- Gabriel Family Clinic MVP - Database Schema
-- Apply this in Supabase (recommended) or compatible Postgres with adjustments.
-- Idempotent where safe.

-- =========
-- Extensions & Utils
-- =========

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========
-- patient_profiles
-- =========

CREATE TABLE IF NOT EXISTS patient_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL,
  full_name      TEXT NOT NULL,
  nric_hash      TEXT NOT NULL,
  nric_masked    TEXT NOT NULL,
  dob            DATE NOT NULL,
  language       TEXT NOT NULL DEFAULT 'en',
  chas_tier      TEXT NOT NULL DEFAULT 'unknown',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_profiles_user_id
  ON patient_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_nric_hash
  ON patient_profiles (nric_hash);

CREATE TRIGGER trg_patient_profiles_set_updated_at
BEFORE UPDATE ON patient_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========
-- staff_profiles
-- =========

CREATE TABLE IF NOT EXISTS staff_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL,
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('staff', 'doctor', 'admin')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_user_id
  ON staff_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role
  ON staff_profiles (role);

CREATE TRIGGER trg_staff_profiles_set_updated_at
BEFORE UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========
-- doctors
-- =========

CREATE TABLE IF NOT EXISTS doctors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id   UUID,
  name               TEXT NOT NULL,
  photo_url          TEXT,
  languages          TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_active
  ON doctors (is_active);

CREATE TRIGGER trg_doctors_set_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========
-- clinic_settings
-- =========

CREATE TABLE IF NOT EXISTS clinic_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name          TEXT NOT NULL DEFAULT 'Gabriel Family Clinic',
  clinic_address       TEXT,
  clinic_phone         TEXT,
  timezone             TEXT NOT NULL DEFAULT 'Asia/Singapore',
  slot_duration_min    INTEGER NOT NULL DEFAULT 15,
  booking_window_days  INTEGER NOT NULL DEFAULT 7,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_clinic_settings_set_updated_at
BEFORE UPDATE ON clinic_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Ensure at least one settings row
INSERT INTO clinic_settings (id, clinic_name)
SELECT gen_random_uuid(), 'Gabriel Family Clinic'
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings);

-- =========
-- appointments
-- =========

CREATE TABLE IF NOT EXISTS appointments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_id          UUID NOT NULL REFERENCES doctors(id),
  scheduled_start    TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL CHECK (
                       status IN ('booked','arrived','in_consultation','completed','no_show','cancelled')
                     ) DEFAULT 'booked',
  queue_number       TEXT,
  reason             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON appointments (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time
  ON appointments (doctor_id, scheduled_start);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (status);

CREATE TRIGGER trg_appointments_set_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========
-- notifications
-- =========

CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id   UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES patient_profiles(id) ON DELETE CASCADE,
  channel          TEXT NOT NULL CHECK (channel IN ('sms','whatsapp')),
  type             TEXT NOT NULL CHECK (type IN ('confirmation','reminder','queue_alert')),
  message          TEXT,
  status           TEXT NOT NULL CHECK (status IN ('pending','sent','failed')) DEFAULT 'pending',
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_patient
  ON notifications (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_appointment
  ON notifications (appointment_id);

-- =========
-- RLS (Supabase)
-- =========

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- patient_profiles
CREATE POLICY patient_profiles_select_self
ON patient_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY patient_profiles_update_self
ON patient_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY patient_profiles_select_staff
ON patient_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
  )
);

-- staff_profiles
CREATE POLICY staff_profiles_select_self
ON staff_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY staff_profiles_select_admin
ON staff_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role = 'admin'
  )
);

-- doctors
CREATE POLICY doctors_select_public
ON doctors
FOR SELECT
USING (is_active = TRUE);

-- clinic_settings
CREATE POLICY clinic_settings_select_public
ON clinic_settings
FOR SELECT
USING (TRUE);

-- appointments
CREATE POLICY appointments_select_patient
ON appointments
FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY appointments_select_staff
ON appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('staff','doctor','admin')
  )
);

CREATE POLICY appointments_insert_patient
ON appointments
FOR INSERT
WITH CHECK (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY appointments_update_staff
ON appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('staff','doctor','admin')
  )
);

-- notifications
CREATE POLICY notifications_select_patient
ON notifications
FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY notifications_select_staff
ON notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
  )
);

INSERT INTO schema_migrations (name)
SELECT 'database_schema_v1'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = 'database_schema_v1'
);
```

2) `supabase/schema.sql`

If you’re using Supabase CLI, you can keep this as an identical copy or a pointer. Easiest is to mirror:

```sql
-- supabase/schema.sql
-- Mirror of database_schema.sql for Supabase CLI usage.

\i ../database_schema.sql
```

(Or copy the entire content of `database_schema.sql` directly.)

3) `src/lib/supabaseClient.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Returns a browser-side Supabase client using the anon key.
 * Use this in components/hooks when direct Supabase access is needed.
 * For sensitive operations, prefer calling internal API routes.
 */
export function supabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Helpful for local dev misconfigurations
    // eslint-disable-next-line no-console
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Set them in your .env.local file.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

4) `src/lib/supabaseServer.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  // eslint-disable-next-line no-console
  console.error(
    'Supabase URL is not set. Please configure NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.'
  );
}

/**
 * Server-side Supabase client using the service role key.
 * IMPORTANT: Only import and use this in server-side contexts (API routes, scripts).
 */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});
```

5) `src/lib/auth.ts`

```ts
import type { NextApiRequest } from 'next';
import { supabaseServer } from './supabaseServer';

/**
 * Extracts the Supabase user from an incoming API request.
 *
 * Looks for:
 * - Authorization: Bearer <access_token>
 * - sb-access-token cookie
 *
 * Assumes the token is a Supabase JWT (from Supabase Auth).
 */
export async function getUserFromRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  const cookieToken = req.cookies['sb-access-token'];

  const token = bearerToken || cookieToken;

  if (!token) return null;

  const { data, error } = await supabaseServer.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

/**
 * Ensures the request is authenticated.
 * Returns the Supabase user object, or throws an Error('UNAUTHORIZED').
 *
 * API route handlers should:
 * - Wrap in try/catch
 * - Return 401 when this throws
 */
export async function requireAuth(req: NextApiRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
```

-------------------
Final Validation
-------------------

Alignment with PAD and Master_Execution_Plan:

- Uses Supabase Auth; `auth.uid()` central to RLS.
- `patient_profiles` and `staff_profiles` keyed by `user_id` (Supabase `auth.users.id`).
- RLS policies match the conceptual model:
  - Patients see their own stuff.
  - Staff/admin see what they should.
  - Doctors list and clinic settings are safe to expose.
- Code:
  - `supabaseClient.ts` and `supabaseServer.ts` match previous snippets and env keys.
  - `auth.ts` is minimal, consistent, and ready for use in Phase 2/3 APIs.
- Simplicity:
  - No extra frameworks.
  - All files small, understandable by one dev.
- Phase 1 Checklist:
  - These files, plus a real Supabase project and applied schema, satisfy all items.
