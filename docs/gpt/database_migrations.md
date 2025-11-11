Love your consistency. Let’s do this carefully.

We’ll:

- First: Plan the migration and seed strategy rigorously.
- Validate against our schema, Supabase reality, and MVP scope.
- Then: Produce:
  - A complete set of SQL migrations (Supabase-style) to match the agreed `database_schema.sql`.
  - Seed SQL for core reference data (clinic settings, doctors).
  - A `scripts/seed.ts` to optionally seed via Node using Supabase service key.

Everything will be:

- Minimal, explicit, and reversible where possible.
- Safe for a solo dev.
- Compatible with Supabase (primary target) and also usable with vanilla Postgres if needed.

Layer 1: Meticulous Plan

Objectives

- Express the final schema as a set of ordered migrations instead of one monolith.
- Ensure seeds:
  - Provide just enough data for:
    - Staff portal to function (you’ll still need to map a real auth user).
    - Doctor list to show.
  - Do NOT hard-code sensitive/user-specific info.
- Provide `scripts/seed.ts`:
  - Uses `@supabase/supabase-js` with service-role key.
  - Idempotent: safe to run multiple times.

Target Environment

- Primary: Supabase Postgres:
  - We rely on:
    - `pgcrypto` (for `gen_random_uuid()`).
    - RLS with `auth.uid()`.
    - Existing `auth.users` table.
- Secondary (dev/local): any Postgres 14+:
  - Same SQL works with minor adjustments (no `auth.uid()`, etc.), but our focus is Supabase.

Migrations Structure

We’ll use a simple naming scheme (you can adjust to your tooling):

- `supabase/migrations/0001_init_extensions_and_utils.sql`
- `supabase/migrations/0002_core_tables.sql`
- `supabase/migrations/0003_rls_policies.sql`
- `supabase/migrations/0004_seed_core_data.sql` (optional: or separate seed SQL)

Seed Strategy

We’ll provide:

- SQL seed (for Supabase SQL editor / migration).
- TS seed script (`scripts/seed.ts`) that:
  - Uses service-role key.
  - Upserts:
    - One `clinic_settings` row (if not present).
    - A sample doctor (or a couple).
  - Leaves `staff_profiles` for manual linking to real Supabase users.

Validation Before Execution

Check alignment:

- Tables:
  - `patient_profiles`, `staff_profiles`, `doctors`, `clinic_settings`, `appointments`, `notifications`, `schema_migrations`.
- Constraints:
  - PKs, FKs, indices as defined.
- RLS:
  - Uses `auth.uid()`.
- Migrations:
  - Ordered.
  - No circular dependencies.
- Seeds:
  - Safe (no fake NRICs or real phone numbers).
  - Idempotent.

All consistent. Now we generate.

Layer 2: Complete Migrations + Seed Files + scripts/seed.ts

Note: Adjust file names to your Supabase CLI format if needed (`YYYYMMDDHHMMSS_...`). The content is what matters.

1) Migration: 0001_init_extensions_and_utils.sql

Path: `supabase/migrations/0001_init_extensions_and_utils.sql`

```sql
-- 0001_init_extensions_and_utils.sql
-- Initialize required extensions and utility functions

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schema migrations tracking table (optional but useful)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (name)
SELECT '0001_init_extensions_and_utils'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = '0001_init_extensions_and_utils'
);
```

2) Migration: 0002_core_tables.sql

Path: `supabase/migrations/0002_core_tables.sql`

```sql
-- 0002_core_tables.sql
-- Core tables: patient_profiles, staff_profiles, doctors, clinic_settings,
-- appointments, notifications

-- 2.1 patient_profiles
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

-- 2.2 staff_profiles
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

-- 2.3 doctors
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

-- 2.4 clinic_settings
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

-- Ensure at least one settings row exists
INSERT INTO clinic_settings (id, clinic_name)
SELECT gen_random_uuid(), 'Gabriel Family Clinic'
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings);

-- 2.5 appointments
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

-- 2.6 notifications
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

INSERT INTO schema_migrations (name)
SELECT '0002_core_tables'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = '0002_core_tables'
);
```

3) Migration: 0003_rls_policies.sql

Path: `supabase/migrations/0003_rls_policies.sql`

```sql
-- 0003_rls_policies.sql
-- Enable and define RLS policies

-- Enable RLS
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Note: These policies assume Supabase environment (auth.uid()).

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
SELECT '0003_rls_policies'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = '0003_rls_policies'
);
```

4) Migration / Seed: 0004_seed_core_data.sql

You can treat this as a migration or run separately. It seeds:

- Ensured `clinic_settings` exists (already done).
- Insert sample doctors.

Path: `supabase/migrations/0004_seed_core_data.sql`

```sql
-- 0004_seed_core_data.sql
-- Seed minimal core data (idempotent)

-- Ensure default clinic settings exist (already handled in 0002, but safe)
INSERT INTO clinic_settings (id, clinic_name)
SELECT gen_random_uuid(), 'Gabriel Family Clinic'
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings);

-- Insert sample doctors (only if none exist)
INSERT INTO doctors (id, name, languages, is_active)
SELECT gen_random_uuid(), 'Dr. Tan Wei Ming', ARRAY['en', 'zh'], TRUE
WHERE NOT EXISTS (SELECT 1 FROM doctors);

INSERT INTO doctors (id, name, languages, is_active)
SELECT gen_random_uuid(), 'Dr. Nur Aisyah', ARRAY['en', 'ms'], TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM doctors WHERE name = 'Dr. Nur Aisyah'
);

INSERT INTO schema_migrations (name)
SELECT '0004_seed_core_data'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = '0004_seed_core_data'
);
```

Note:
- We intentionally do NOT auto-create `staff_profiles` here, because they must be bound to real `auth.users.id`. That’s environment-specific.

5) Node Seed Script: scripts/seed.ts

This script:

- Uses Supabase service-role key.
- Ensures:
  - `clinic_settings` row.
  - Some doctors.
- Provides helper to create a `staff_profile` once you know a real user’s id.

Path: `scripts/seed.ts`

```ts
/* scripts/seed.ts
 *
 * Usage:
 * 1) Set:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 2) Run:
 *    npx ts-node scripts/seed.ts
 * or
 *    ts-node scripts/seed.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

async function ensureClinicSettings() {
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('id, clinic_name')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking clinic_settings:', error);
    throw error;
  }

  if (!data) {
    const { error: insErr } = await supabase.from('clinic_settings').insert({
      clinic_name: 'Gabriel Family Clinic',
      clinic_address: '123 Test Street #01-234, Singapore',
      clinic_phone: '+65 6000 0000',
      timezone: 'Asia/Singapore',
      slot_duration_min: 15,
      booking_window_days: 7
    });

    if (insErr) {
      console.error('Error seeding clinic_settings:', insErr);
      throw insErr;
    }

    console.log('Seeded clinic_settings.');
  } else {
    console.log('clinic_settings already present.');
  }
}

async function ensureDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name')
    .limit(1);

  if (error) {
    console.error('Error checking doctors:', error);
    throw error;
  }

  if (data && data.length > 0) {
    console.log('doctors already seeded.');
    return;
  }

  const { error: insErr } = await supabase.from('doctors').insert([
    {
      name: 'Dr. Tan Wei Ming',
      languages: ['en', 'zh'],
      is_active: true
    },
    {
      name: 'Dr. Nur Aisyah',
      languages: ['en', 'ms'],
      is_active: true
    }
  ]);

  if (insErr) {
    console.error('Error seeding doctors:', insErr);
    throw insErr;
  }

  console.log('Seeded doctors.');
}

/**
 * Helper (manual) to create a staff_profile for a known Supabase auth user.
 * Call this manually by editing userId and running again if needed.
 */
async function createStaffProfileExample() {
  const userId = process.env.SEED_STAFF_USER_ID; // set this manually when needed
  if (!userId) {
    console.log('SEED_STAFF_USER_ID not set; skipping staff_profiles seeding.');
    return;
  }

  const { data: existing, error: existingErr } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingErr) {
    console.error('Error checking staff_profiles:', existingErr);
    throw existingErr;
  }

  if (existing) {
    console.log(`staff_profiles already exists for user_id=${userId}`);
    return;
  }

  const { error: insErr } = await supabase.from('staff_profiles').insert({
    user_id: userId,
    display_name: 'Clinic Admin',
    role: 'admin'
  });

  if (insErr) {
    console.error('Error creating staff_profile:', insErr);
    throw insErr;
  }

  console.log(`Created staff_profile for user_id=${userId}`);
}

async function main() {
  try {
    await ensureClinicSettings();
    await ensureDoctors();
    await createStaffProfileExample();
    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

main();
```

6) Example .env entries for seeding

In `.env.local` or `.env` for running `scripts/seed.ts`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: map an existing Supabase user to staff_profile
# SEED_STAFF_USER_ID=00000000-0000-0000-0000-000000000000
```

7) Execution Steps

- Apply migrations (Supabase CLI or SQL Editor):
  - 0001 → 0002 → 0003 → 0004
- Run seed script (optional but recommended for local/staging):

```bash
npx ts-node scripts/seed.ts
# or
npm run ts-node -- scripts/seed.ts
```

8) Validation Checklist

Before using in real flows:

- [ ] All migrations apply without error in Supabase.
- [ ] Tables and indices match expectations.
- [ ] RLS policies present and referencing `auth.uid()`.
- [ ] `clinic_settings` has exactly one row (or one main row).
- [ ] `doctors` table contains the sample doctors.
- [ ] Running `scripts/seed.ts` twice:
  - No duplicate clinic settings.
  - No duplicate doctors.
  - No errors.
- [ ] After setting `SEED_STAFF_USER_ID`:
  - `staff_profiles` contains a valid admin/staff mapping.

If all boxes are green, your migrations and seeds are:

- Deterministic,
- Idempotent,
- Safe,
- Perfectly aligned with the rest of the architecture.

If you’d like next, I can:

- Generate a concise “DB Ops Runbook” section (sanity checks, backups, RLS tests).
- Or help you wire a minimal CI step that:
  - Applies migrations to a test DB.
  - Runs Jest/Playwright against it.
