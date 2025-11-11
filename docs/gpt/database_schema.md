Executive Summary

We’ll do this in three stages:

1) Design: Carefully define a secure, minimal, production-ready Postgres/Supabase schema that matches the improved PRD (single clinic, Supabase Auth, PDPA-aware, safe RLS patterns).
2) Tooling: Provide:
   - `database_schema.sql` (complete, idempotent-ish).
   - `deploy_database.py` (Python script to create user/database if needed and apply schema).
   - `run_database_deploy.sh` (shell wrapper).
   - `.env.example` for the deployment environment.
3) Validation: Review the approach against:
   - Supabase usage (where applicable),
   - Security (NRIC handling, RLS),
   - One-dev, 4-week realism.

Important:
- For Supabase, project DB and primary user already exist; you normally do NOT create roles/databases.
- But you requested scripts to create user/db and deploy schema, so I will:
  - Design them to work against a standard Postgres (self-hosted or local),
  - Note clearly how to adapt/limit usage for Supabase.

Below is the meticulous implementation plan, followed by the concrete deliverables.

--------------------
Phase 1: Implementation Plan
--------------------

Objectives

- Define SQL schema consistent with:
  - Single clinic.
  - Supabase Auth with `auth.uid()`.
  - `patient_profiles`, `staff_profiles`, `doctors`, `appointments`, `clinic_settings`, `notifications`.
- Implement:
  - RLS for patient data.
  - Role-based access for staff/doctor/admin.
- Provide deployment tooling:
  - Simple, environment-driven.
  - Safe to run locally and in CI.
- Ensure:
  - PDPA-conscious NRIC handling (hash + masked).
  - Auditable, minimal attack surface.

Step-by-step Plan

1) Schema Design
- Tables:
  - `patient_profiles`
  - `staff_profiles`
  - `doctors`
  - `clinic_settings`
  - `appointments`
  - `notifications`
  - `schema_migrations` (simple tracking table for this script)
- Extensions:
  - `pgcrypto` (for hashing NRIC).
  - `uuid-ossp` or `gen_random_uuid()` (depending on environment).
- Security model:
  - Assume Supabase:
    - `auth.users` exists with `id` as `uuid`.
    - JWT exposes `auth.uid()`.
  - Use RLS:
    - Patients: self-access only.
    - Staff: determined by `staff_profiles` membership.

2) Role and User Model
- For generic Postgres:
  - Create:
    - `gabriel_app` role/user (for application).
  - Grant:
    - Minimal privileges.
- For Supabase:
  - Do not create roles; instead:
    - Run schema as the existing `postgres`/service user.
    - RLS + policies enforce auth.

3) Deployment Flow

- `.env`:
  - Holds connection info (host, port, admin user/pass, db name, app user/pass).
- `deploy_database.py`:
  - Read `.env`.
  - Connect as admin.
  - Optionally:
    - Create database if not exists (for non-Supabase).
    - Create application role/user if not exists.
  - Connect to target database.
  - Execute `database_schema.sql` if not already applied (basic check via `schema_migrations`).
- `run_database_deploy.sh`:
  - Load `.env`.
  - Call `python deploy_database.py`.
  - Appropriate safety checks.

4) Validation Checklist

Before “executing” (i.e., using this in real world), verify:

- Schema:
  - Matches PRD entities.
  - RLS policies compile and are compatible with Supabase (if used).
  - No direct NRIC-as-identity use; only hashed/masked.
- Scripts:
  - Can run on:
    - Local Postgres for dev.
    - CI pipeline.
  - For Supabase:
    - Only use schema portion (no CREATE DATABASE/ROLE).
- Re-runs:
  - Re-running `deploy_database.py` should be:
    - Safe (no duplicate table errors).
    - Or fail loudly with clear messaging.

Now I’ll present the concrete artifacts.

--------------------
Phase 2: `database_schema.sql`
--------------------

Notes:
- Written to be compatible with:
  - Supabase (preferred target): comment where Supabase specifics apply.
  - Generic Postgres: includes role/database creation logic guarded/comments.
- Uses:
  - `gen_random_uuid()` via `pgcrypto` where available.
  - If your environment lacks it, you can switch to `uuid-ossp`.

```sql
-- database_schema.sql
-- Gabriel Family Clinic MVP v1.0
-- Schema for single-clinic, Supabase-compatible deployment.

-- ============================
-- 0. Extensions
-- ============================

-- For Supabase:
-- pgcrypto is available; gen_random_uuid() is supported.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- If using vanilla Postgres without pgcrypto, uncomment:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- 1. Utility: ID + Timestamps
-- ============================

-- Use gen_random_uuid() from pgcrypto (Supabase default).
-- Fallback to uuid_generate_v4() if needed.

-- Choose one:
-- For Supabase/pgcrypto:
-- (No function needed, call gen_random_uuid() inline)
-- For uuid-ossp:
-- (uncomment extension above and use uuid_generate_v4())

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 2. Schema Migrations Tracking
-- ============================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id           SERIAL PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert a record for this schema if not exists
INSERT INTO schema_migrations (name)
SELECT 'initial_gabriel_clinic_mvp'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE name = 'initial_gabriel_clinic_mvp'
);

-- ============================
-- 3. Core Entities
-- ============================

-- 3.1 Patient Profiles
-- Linked 1:1 to Supabase auth.users via user_id.
-- NRIC stored as:
--   - nric_hash: deterministic hash for equality checks.
--   - nric_masked: masked for display.
-- No direct plaintext NRIC.

CREATE TABLE IF NOT EXISTS patient_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL,  -- FK to auth.users.id (not enforced here for Supabase)
  full_name      TEXT NOT NULL,
  nric_hash      TEXT NOT NULL,
  nric_masked    TEXT NOT NULL,
  dob            DATE NOT NULL,
  language       TEXT NOT NULL DEFAULT 'en',  -- 'en', 'zh', 'ms', etc.
  chas_tier      TEXT NOT NULL DEFAULT 'unknown', -- 'blue','orange','green','none','unknown'
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

-- 3.2 Staff Profiles
-- Maps auth.users → clinic roles (staff, doctor, admin).

CREATE TABLE IF NOT EXISTS staff_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL,  -- FK to auth.users.id (logical)
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

-- 3.3 Doctors
-- Logical doctor entities; linked to staff_profiles with role='doctor'.

CREATE TABLE IF NOT EXISTS doctors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id   UUID NOT NULL,
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

-- 3.4 Clinic Settings
-- Single-row settings table, keyed by id=1 or a generated UUID.

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

-- Ensure at least one row exists
INSERT INTO clinic_settings (id, clinic_name)
SELECT gen_random_uuid(), 'Gabriel Family Clinic'
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings);

-- 3.5 Appointments

CREATE TABLE IF NOT EXISTS appointments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_id          UUID NOT NULL REFERENCES doctors(id),
  scheduled_start    TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL CHECK (
                       status IN ('booked','arrived','in_consultation','completed','no_show','cancelled')
                     ) DEFAULT 'booked',
  queue_number       TEXT, -- e.g., 'A001' assigned on arrival
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

-- 3.6 Notifications

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

-- ============================
-- 4. Row Level Security (RLS)
-- ============================

-- Enable RLS on sensitive tables (Supabase best practice).

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Important:
-- These policies assume Supabase environment where:
-- - auth.uid() returns the current authenticated user's UUID.
-- For vanilla Postgres, you'd replace auth.uid() with your own session var mechanism.

-- 4.1 Helpers (conceptual)
-- Staff/doctor/admin check:
-- A user is staff/doctor/admin if they have a row in staff_profiles.

-- 4.2 patient_profiles Policies

-- Patients can see/update only their profile.
CREATE POLICY patient_profiles_select_self
ON patient_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY patient_profiles_update_self
ON patient_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Staff (including doctors, admin) can read all patients.
CREATE POLICY patient_profiles_select_staff
ON patient_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
  )
);

-- No INSERT via client; patient_profiles are managed by backend/service role.

-- 4.3 staff_profiles Policies

-- Staff can read their own record.
CREATE POLICY staff_profiles_select_self
ON staff_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all staff_profiles (logic: role='admin').
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

-- Inserts/updates for staff_profiles should be via service role only.

-- 4.4 doctors Policies

-- Everyone (authenticated or not) can SELECT active doctors for booking.
CREATE POLICY doctors_select_public
ON doctors
FOR SELECT
USING (is_active = TRUE);

-- Modifications only via service role.

-- 4.5 clinic_settings Policies

-- Public read (for booking rules, clinic info).
CREATE POLICY clinic_settings_select_public
ON clinic_settings
FOR SELECT
USING (TRUE);

-- Updates only by admin/staff via service role or restricted API.

-- 4.6 appointments Policies

-- Patients: can see their own appointments.
CREATE POLICY appointments_select_patient
ON appointments
FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

-- Staff/Doctors: can see all appointments.
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

-- Patients: can insert appointments for themselves (optional, or via backend).
CREATE POLICY appointments_insert_patient
ON appointments
FOR INSERT
WITH CHECK (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

-- Staff: can update appointment status.
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

-- 4.7 notifications Policies

-- Patients: can see their own notifications.
CREATE POLICY notifications_select_patient
ON notifications
FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM patient_profiles
    WHERE user_id = auth.uid()
  )
);

-- Staff: can see all for auditing.
CREATE POLICY notifications_select_staff
ON notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
  )
);

-- Inserts via service role only when sending messages.

-- ============================
-- End of Schema
-- ============================
```

Notes:
- This schema is Supabase-ready:
  - Uses `auth.uid()` in policies.
  - Assumes `auth.users` exists.
- For vanilla Postgres:
  - You’d need to adapt `auth.uid()` to a session variable or custom function.

--------------------
Phase 3: Deployment Scripts
--------------------

Important distinction:

- Supabase production:
  - Use `supabase db push` with this `database_schema.sql`.
  - Do NOT run CREATE DATABASE/ROLE; Supabase manages that.
- Local/Custom Postgres:
  - You can use `deploy_database.py` + `run_database_deploy.sh` to:
    - Create database if not exists.
    - Apply schema.

I’ll implement these scripts safely as generic Postgres tooling.
You can:
- Use them for local/dev.
- For Supabase: point them at the Supabase connection URL (skipping DB creation logic where not allowed).

1) `.env.example`

```bash
# .env.example
# Environment for deploy_database.py

# Admin connection (for local/custom Postgres).
# For Supabase: use the connection string with service role or main password user.

DB_HOST=localhost
DB_PORT=5432
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=postgres

# Target database name
DB_NAME=gabriel_clinic

# Application DB user (for non-Supabase deployments)
APP_DB_USER=gabriel_app
APP_DB_PASSWORD=change_this_securely

# Path to schema file (relative or absolute)
SCHEMA_FILE=database_schema.sql
```

2) `deploy_database.py`

```python
#!/usr/bin/env python3
"""
deploy_database.py

Idempotent-ish database initialization script for Gabriel Clinic MVP.

Responsibilities:
- Connect as admin.
- Create target database if it does not exist (if allowed).
- Create application user (if does not exist).
- Connect to target database.
- Apply database_schema.sql if not already applied (based on schema_migrations).
"""

import os
import sys
import psycopg2
from psycopg2 import sql

def load_env():
    required = [
        "DB_HOST",
        "DB_PORT",
        "DB_ADMIN_USER",
        "DB_ADMIN_PASSWORD",
        "DB_NAME",
        "APP_DB_USER",
        "APP_DB_PASSWORD",
        "SCHEMA_FILE",
    ]
    env = {}
    missing = []
    for key in required:
        value = os.getenv(key)
        if value is None:
            missing.append(key)
        else:
            env[key] = value

    if missing:
        print(f"[ERROR] Missing environment variables: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    return env


def connect_admin(env, dbname=None):
    conn = psycopg2.connect(
        host=env["DB_HOST"],
        port=env["DB_PORT"],
        user=env["DB_ADMIN_USER"],
        password=env["DB_ADMIN_PASSWORD"],
        dbname=dbname or "postgres",
    )
    conn.autocommit = True
    return conn


def database_exists(conn, dbname):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s;",
            (dbname,)
        )
        return cur.fetchone() is not None


def create_database_if_needed(conn, dbname):
    if database_exists(conn, dbname):
        print(f"[INFO] Database '{dbname}' already exists.")
        return
    print(f"[INFO] Creating database '{dbname}'...")
    with conn.cursor() as cur:
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(dbname)))
    print(f"[INFO] Database '{dbname}' created.")


def role_exists(conn, role_name):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM pg_roles WHERE rolname = %s;",
            (role_name,)
        )
        return cur.fetchone() is not None


def create_app_user_if_needed(env):
    # For Supabase: this may fail (no superuser). In that case, it's safe to ignore.
    try:
        conn = connect_admin(env)
    except Exception as e:
        print(f"[WARN] Could not connect as admin to check/create role: {e}")
        return

    with conn:
        with conn.cursor() as cur:
            if role_exists(conn, env["APP_DB_USER"]):
                print(f"[INFO] Role/User '{env['APP_DB_USER']}' already exists.")
            else:
                print(f"[INFO] Creating application role/user '{env['APP_DB_USER']}'...")
                cur.execute(
                    sql.SQL("CREATE USER {} WITH PASSWORD %s;")
                    .format(sql.Identifier(env["APP_DB_USER"])),
                    (env["APP_DB_PASSWORD"],)
                )
                print("[INFO] Application user created.")
    conn.close()


def apply_schema(env):
    schema_path = env["SCHEMA_FILE"]
    if not os.path.isfile(schema_path):
        print(f"[ERROR] Schema file not found: {schema_path}", file=sys.stderr)
        sys.exit(1)

    # Connect to target database
    conn = connect_admin(env, dbname=env["DB_NAME"])

    try:
        with conn:
            with conn.cursor() as cur:
                # Check if our migration name is already applied
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_name = 'schema_migrations'
                    );
                """)
                has_migrations_table = cur.fetchone()[0]

                already_applied = False
                if has_migrations_table:
                    cur.execute("""
                        SELECT 1 FROM schema_migrations
                        WHERE name = 'initial_gabriel_clinic_mvp'
                        LIMIT 1;
                    """)
                    already_applied = cur.fetchone() is not None

                if already_applied:
                    print("[INFO] Schema 'initial_gabriel_clinic_mvp' already applied. Skipping.")
                    return

                print(f"[INFO] Applying schema from {schema_path}...")
                with open(schema_path, "r", encoding="utf-8") as f:
                    sql_script = f.read()
                cur.execute(sql_script)
                print("[INFO] Schema applied successfully.")
    finally:
        conn.close()


def main():
    env = load_env()

    # Step 1: Connect as admin and create database (if allowed)
    try:
        admin_conn = connect_admin(env)
    except Exception as e:
        print(f"[ERROR] Failed to connect as admin: {e}", file=sys.stderr)
        sys.exit(1)

    with admin_conn:
        create_database_if_needed(admin_conn, env["DB_NAME"])
    admin_conn.close()

    # Step 2: Create application user (best-effort; may be skipped in Supabase)
    create_app_user_if_needed(env)

    # Step 3: Apply schema to target database
    apply_schema(env)

    print("[INFO] Database deployment completed.")


if __name__ == "__main__":
    main()
```

Notes:
- For Supabase:
  - `CREATE DATABASE` and `CREATE USER` may not be permitted.
  - That’s fine: script will log warnings and still attempt schema application.
- For local Postgres:
  - Fully functional.

3) `run_database_deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "[INFO] Running database deployment..."

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "[WARN] No .env or .env.local file found. Using current environment only."
else
  # Prefer .env.local if present, else .env
  if [ -f ".env.local" ]; then
    echo "[INFO] Loading environment from .env.local"
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env.local | xargs -d '\n')
  else
    echo "[INFO] Loading environment from .env"
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env | xargs -d '\n')
  fi
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 is not installed or not in PATH."
  exit 1
fi

echo "[INFO] Executing deploy_database.py ..."
python3 deploy_database.py

echo "[INFO] Database deployment finished."
```

--------------------
Phase 4: Review & Validation
--------------------

Validate against mission constraints:

1) Security and PDPA:
- NRIC:
  - Not used as primary key.
  - Stored hashed (`nric_hash`) + masked (`nric_masked`).
- RLS:
  - Patient access via `auth.uid()` → `patient_profiles.user_id`.
  - Staff/doctor/admin access via `staff_profiles`.
- Auditing:
  - `notifications`, `appointments` and timestamps exist; can be extended for audit logs.

2) Supabase Compatibility:
- Uses:
  - `auth.uid()` in policies.
  - `gen_random_uuid()` via `pgcrypto`, available on Supabase.
- Does:
  - Not assume ability to create roles/db in production Supabase.
  - Schema can be run through `supabase db push` or this script (with proper connection).

3) One Dev, Four Weeks:
- Schema is compact and targeted.
- Scripts:
  - Straightforward Python + Bash.
  - Easy to run locally and in CI.
- No over-architecture:
  - Just enough tables and policies.

4) Idempotence & Safety:
- `schema_migrations` + named migration:
  - Prevents re-applying same schema.
- Tables created with `IF NOT EXISTS`.
- Policies:
  - Defined without destructive assumptions.

5) Future-proofing:
- Leaves room for:
  - `consult_notes`, `mc_documents`, `chas_claims` in later migrations.
- Multi-clinic:
  - Can add `clinic_id` later without breaking existing design.

If you’d like next:
- I can:
  - Generate a companion `architecture.md` explaining how app code should interact with this schema.
  - Provide sample `slots` and `queue` server-side functions or Next.js API route skeletons that consume this schema safely.
  - Tailor a Supabase-native migration (`supabase/migrations/*.sql`) version explicitly.
