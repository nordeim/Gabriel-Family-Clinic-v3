Executive Summary

We’re now designing the “how to build it” blueprint: a Master Execution Plan that a single meticulous developer can follow to get from zero to a working, production-ready MVP codebase.

You asked for:

- A validated, stepwise implementation plan.
- Logical, mostly independent phases.
- Integrated checklists and file lists per phase.
- Alignment with our improved PRD, PAD, and database schema.
- A complete `package.json` in the scaffolding phase.
- Using the same Node package versions (where relevant) as your current codebase.
- The final output as `Master_Execution_Plan.md`.

Below:

1) I first outline the implementation plan structure and validate it.
2) Then I present the fully realized `Master_Execution_Plan.md`.

Layer 1: Implementation Plan (Meta-Plan)

Goals

- Make it executable for a solo developer in 4–6 weeks.
- Ensure each phase:
  - Has clear objectives.
  - Produces testable artifacts.
  - Minimizes cross-phase coupling.
- Ensure all artifacts:
  - Match the final database schema.
  - Are consistent with our architecture.
  - Are realistic: no overbuilding.

Phase Overview (High-Level)

- Phase 0: Foundations & Scaffolding
  - Initialize Next.js app, dependencies, base configs, `package.json`.
- Phase 1: Database & Auth Baseline
  - Apply `database_schema.sql`, set up Supabase, RLS sanity.
- Phase 2: Core Patient Flows
  - Login, profile, booking APIs & UI.
- Phase 3: Staff Portal & Queue
  - Staff roles, today’s appointments, status/queue handling.
- Phase 4: Notifications & Background Jobs
  - Twilio integration, confirmation, and (optional) reminders.
- Phase 5: Testing, Hardening & Observability
  - Tests, logging, error-handling, guardrails.
- Phase 6: Deployment & Runbook
  - Vercel + Supabase deploy, Docker image, operational docs.
- Phase 7: Post-MVP Enhancements (Optional)
  - MC PDFs, notes, roadmap items.

Each phase will:
- List target files and their responsibilities.
- Include a checklist (must-pass gates).
- Be aligned with the minimal but robust architecture.

Validation Checkpoints (Before Writing the Plan)

We confirm:

- Database:
  - Uses our last `database_schema.sql` with `patient_profiles`, `staff_profiles`, `doctors`, `appointments`, `notifications`, RLS.
- Stack:
  - Next.js 14 (as per provided versions).
  - Mantine.
  - Supabase JS 2.80.0.
  - Twilio 5.10.4.
  - Zod, React Hook Form, Playwright, etc.
- Simplicity:
  - Ignore tRPC, Prisma, NextAuth, Stripe, etc., even if versions exist in the old list, unless needed.
- Accuracy:
  - `package.json` compatible with Next 14.2.33 / React 18.3.1.
  - Scripts: dev, build, start, lint, test.

Now we execute: the `Master_Execution_Plan.md`.

==================================================
Master_Execution_Plan.md
==================================================

# Master Execution Plan – Gabriel Family Clinic MVP

Author: Polaris Alpha (AI Technical Partner)  
Audience: Solo/full-stack developer building the MVP

Purpose:
This document is the step-by-step, implementation-ready guide to build the Gabriel Family Clinic MVP codebase from scratch, aligned with:

- The improved PRD.
- The Project Architecture Document.
- The finalized `database_schema.sql`.

Follow this sequentially. Do not overbuild. Each phase has:

- Objectives
- Deliverables
- File list
- Checklist (must be green before moving on)

If in doubt: simplify.

---

## Phase 0 – Foundations & Scaffolding

Objective:
Create a clean, minimal Next.js + TypeScript + Mantine + Supabase project with a solid `package.json` and base configs.

Key Decisions:
- Next.js Pages Router (not App Router) for simplicity.
- Use only necessary dependencies (no Prisma, no tRPC for MVP).
- Align versions with your existing environment where they make sense.

### Files & Structure Introduced

- `package.json`
- `tsconfig.json`
- `next.config.js`
- `.env.example`
- `src/pages/_app.tsx`
- `src/pages/index.tsx`
- `src/styles/globals.css`
- Basic `src/lib` folder.

### package.json (Complete)

```json
{
  "name": "gabriel-clinic-mvp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest --config jest.config.cjs",
    "test:unit": "jest --config jest.config.cjs --runInBand",
    "test:integration": "jest --config jest.config.cjs --runInBand --selectProjects integration",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@mantine/core": "7.17.8",
    "@mantine/hooks": "7.17.8",
    "@supabase/supabase-js": "2.80.0",
    "@supabase/ssr": "0.7.0",
    "@hookform/resolvers": "5.2.2",
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
    "@playwright/test": "1.56.1",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/jest": "29.5.14",
    "@types/node": "20.19.24",
    "@types/react": "18.3.26",
    "@types/react-dom": "18.3.7",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.33",
    "eslint-config-prettier": "9.1.2",
    "jest": "29.7.0",
    "playwright": "1.56.1",
    "prettier": "3.6.2",
    "typescript": "5.9.3"
  }
}
```

Notes:
- Excludes Prisma, tRPC, NextAuth, Stripe, Tailwind from dependencies to keep MVP minimal.
- Uses versions aligned with your existing environment where relevant.

### Checklist

- [ ] `npm install` runs without errors.
- [ ] `npm run dev` starts Next.js on `http://localhost:3000`.
- [ ] `src/pages/index.tsx` renders a simple landing page.
- [ ] `.env.example` created with placeholders for Supabase and Twilio (will fill in later).

Do not proceed until this is stable.

---

## Phase 1 – Database & Auth Baseline

Objective:
Establish Supabase project, apply finalized schema, ensure RLS and auth model are correct.

Artifacts:
- `database_schema.sql` (finalized).
- `supabase/schema.sql` if using Supabase migrations.
- `src/lib/supabaseClient.ts`
- `src/lib/supabaseServer.ts`
- `src/lib/auth.ts` (basic).

Key Points:
- Use Supabase Auth for user identity (`auth.uid()`).
- `patient_profiles.user_id` and `staff_profiles.user_id` link to `auth.users.id`.
- RLS as defined.

### Files

1) `database_schema.sql`
- As defined in previous step:
  - `patient_profiles`, `staff_profiles`, `doctors`, `clinic_settings`, `appointments`, `notifications`, `schema_migrations`.
  - RLS policies using `auth.uid()`.

2) `src/lib/supabaseClient.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);
```

3) `src/lib/supabaseServer.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});
```

4) `src/lib/auth.ts` (minimal pattern; will refine with your auth flow)

```ts
import type { NextApiRequest } from 'next';
import { supabaseServer } from './supabaseServer';

export async function getUserFromRequest(req: NextApiRequest) {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies['sb-access-token'];

  if (!token) return null;

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuth(req: NextApiRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
```

### Checklist

- [ ] Supabase project created.
- [ ] `database_schema.sql` applied successfully (no errors).
- [ ] RLS enabled on target tables.
- [ ] Test user can sign up via Supabase UI (for now).
- [ ] Can query tables in Supabase Studio and confirm structure.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set only in server-side env, not exposed to client.

Only proceed once schema + auth are sound.

---

## Phase 2 – Core Patient Flows

Objective:
Implement the minimal flows for a patient to:

- Authenticate.
- Create/update profile.
- Book an appointment.
- View their upcoming appointments.

This is the heart of the MVP.

### Scope

- Pages:
  - `src/pages/login.tsx`
  - `src/pages/profile.tsx`
  - `src/pages/book.tsx`
- API:
  - `src/pages/api/patient/profile.get.ts`
  - `src/pages/api/patient/profile.put.ts`
  - `src/pages/api/doctors/index.get.ts`
  - `src/pages/api/slots/index.get.ts`
  - `src/pages/api/appointments/book.post.ts`
  - `src/pages/api/appointments/mine.get.ts`
- Lib:
  - `src/lib/validation.ts` (Zod schemas)
  - `src/lib/slots.ts` (basic slot computation)
  - `src/components/patient/*` (forms & booking UI)

### File Highlights

1) `src/pages/profile.tsx`
- Shows profile form if no profile.
- Loads via `GET /api/patient/profile`.
- Submits to `PUT /api/patient/profile`.

2) `src/pages/book.tsx`
- Uses:
  - `GET /api/doctors`.
  - `GET /api/slots`.
  - `POST /api/appointments/book`.
- Large buttons, mobile-first.

3) `src/pages/api/patient/profile.get.ts` / `.put.ts`
- Use `requireAuth`.
- Map `auth.uid()` → `patient_profiles`.

4) `src/pages/api/appointments/book.post.ts`
- Use `requireAuth`.
- Resolve `patient_profiles` by `user_id`.
- Insert `appointments` row.
- No queue number yet (assigned on arrival in Phase 3).

### Checklist

- [ ] Logged-in test user can create `patient_profile`.
- [ ] `GET /api/doctors` returns dummy seed doctors.
- [ ] `GET /api/slots` returns sensible time slots (hard-coded or based on `clinic_settings`).
- [ ] `POST /api/appointments/book` creates an appointment tied to `patient_profiles.id`.
- [ ] `GET /api/appointments/mine` returns only that user’s appointments.
- [ ] RLS verified: one patient cannot see another patient’s data.

If any RLS or identity ambiguity appears, fix now. Don’t proceed with broken auth.

---

## Phase 3 – Staff Portal & Queue Management

Objective:
Give clinic staff and doctors a simple operational console:

- View today’s appointments.
- Update statuses.
- Assign queue numbers on arrival.

### Scope

- Pages:
  - `src/pages/staff/login.tsx`
  - `src/pages/staff/appointments.tsx`
- API:
  - `src/pages/api/staff/appointments.get.ts`
  - `src/pages/api/staff/appointment-status.post.ts`
- Lib:
  - `src/lib/queue.ts`
- Components:
  - `src/components/staff/StaffLoginForm.tsx`
  - `src/components/staff/TodayAppointmentsTable.tsx`
  - `src/components/staff/QueueControls.tsx`

### File Highlights

1) `src/lib/queue.ts`

```ts
import { supabaseServer } from './supabaseServer';
import dayjs from 'dayjs';

export async function getNextQueueNumber(doctorId: string, datetime: string) {
  const dayStart = dayjs(datetime).startOf('day').toISOString();
  const dayEnd = dayjs(datetime).endOf('day').toISOString();

  const { data, error } = await supabaseServer
    .from('appointments')
    .select('queue_number')
    .eq('doctor_id', doctorId)
    .gte('scheduled_start', dayStart)
    .lte('scheduled_start', dayEnd);

  if (error) throw error;

  const numbers = (data || [])
    .map((a) => a.queue_number)
    .filter(Boolean) as string[];

  if (numbers.length === 0) return 'A001';

  const maxNum = Math.max(
    ...numbers.map((q) => parseInt(q.replace(/\D/g, '') || '0', 10))
  );
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `A${nextNum}`;
}
```

2) `src/pages/api/staff/appointments.get.ts`
- Use `requireAuth`.
- Ensure user is in `staff_profiles` with role in `['staff','doctor','admin']`.
- Query today’s `appointments` plus join `patient_profiles.full_name` and `doctors.name`.

3) `src/pages/api/staff/appointment-status.post.ts`
- Verify staff role.
- For `status='arrived'`:
  - If no `queue_number`, call `getNextQueueNumber`.
  - Update row.

### Checklist

- [ ] Seed `staff_profiles` and `doctors` for at least one staff and one doctor.
- [ ] Staff login (through Supabase) works.
- [ ] `/staff/appointments` shows today’s appointments.
- [ ] Staff can mark:
  - `booked → arrived` and see queue number assigned.
  - `arrived → in_consultation → completed` or `no_show`.
- [ ] RLS: staff can see appointments; patients cannot see others.

---

## Phase 4 – Notifications & Background Tasks

Objective:
Add best-effort SMS/WhatsApp confirmations and optional reminders.

### Scope

- Lib:
  - `src/lib/notifications.ts`
- API:
  - `src/pages/api/cron/reminders.post.ts` (manual trigger / scheduled)

### File Highlights

1) `src/lib/notifications.ts`

```ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromSms = process.env.TWILIO_SMS_FROM!;
const client = twilio(accountSid, authToken);

export async function sendBookingConfirmation(to: string, details: {
  doctorName: string;
  datetime: string;
}) {
  if (!accountSid || !authToken || !fromSms) return;

  const body =
    `✅ Gabriel Family Clinic Appointment Confirmed\n` +
    `Doctor: ${details.doctorName}\n` +
    `Time: ${details.datetime}\n` +
    `Reply to clinic if you need to change.`;

  try {
    await client.messages.create({
      from: fromSms,
      to,
      body
    });
  } catch (err) {
    console.error('Twilio send failed', err);
  }
}
```

2) Integrate into `book.post.ts`:
- After appointment creation, call `sendBookingConfirmation` (non-blocking / best-effort).

3) `reminders.post.ts`:
- Select appointments in next 24h.
- Send reminder SMS.
- Idempotent; to be triggered via external cron or Supabase scheduler.

### Checklist

- [ ] Twilio creds configured for staging.
- [ ] A test booking sends SMS successfully.
- [ ] If Twilio fails, booking still succeeds.
- [ ] Reminders endpoint tested manually (optional for v1 go-live).

---

## Phase 5 – Testing, Hardening & Observability

Objective:
Add minimum necessary tests and guardrails to sleep at night.

### Scope

- Configure Jest + Testing Library.
- Add:
  - Unit tests for slot and queue helpers.
  - Integration tests for booking and staff APIs.
  - E2E test for patient booking (Playwright).

### Files

- `jest.config.cjs`
- `playwright.config.ts`
- `tests/unit/queue.test.ts`
- `tests/integration/appointments.book.test.ts`
- `tests/e2e/patient-booking.spec.ts`

### Checklist

- [ ] `npm run test:unit` passes.
- [ ] `npm run test:integration` passes (with test DB or mocked Supabase).
- [ ] `npm run test:e2e` runs at least one happy path locally.
- [ ] Basic logging in APIs:
  - Errors logged with context.
  - No sensitive data in logs.

Don’t aim for 100% coverage; aim for confidence in core flows.

---

## Phase 6 – Deployment & Runbook

Objective:
Deploy to production-like environment and document how to operate.

### Scope

- Vercel deployment:
  - Set all env vars.
- Supabase:
  - Production project with schema applied.
- Docker (optional):
  - Multi-stage image for alternative hosting.
- Runbook:
  - `docs/runbook.md` with operational steps.

### Files

- `Dockerfile` (multi-stage as in README).
- `docs/runbook.md`:
  - How to:
    - Add staff.
    - Add doctors.
    - Validate RLS.
    - Handle downtime (fallback to phone & paper).

### Checklist

- [ ] Production app reachable via custom domain.
- [ ] Supabase project locked down (service role key only on server).
- [ ] At least one full E2E flow tested in production:
  - Patient sign-up → profile → booking → staff view → status updates.
- [ ] Runbook shared with clinic staff.

---

## Phase 7 – Post-MVP Enhancements (Optional)

Only after MVP is stable.

Examples:
- MC PDF generation with Supabase Storage.
- Simple SOAP notes per appointment.
- CHAS subsidy breakdown (UI).
- Multi-clinic support (add `clinic_id`).
- More detailed auditing and analytics.

Each enhancement:
- Must be a separate migration and phase.
- Must not break core flows.

---

## Final Validation Checklist (Master)

Before declaring success:

- Architecture:
  - [ ] Matches `Project_Architecture_Document.md`.
  - [ ] Single clinic, no accidental multi-tenancy.
- Database:
  - [ ] `database_schema.sql` fully applied.
  - [ ] RLS policies tested with multiple users.
- Core Features:
  - [ ] Patient can self-register, create profile, book.
  - [ ] Staff can see today’s appointments, update status, manage queue.
- Security:
  - [ ] No direct NRIC exposure; only masked.
  - [ ] Keys not exposed client-side.
- Operations:
  - [ ] README + Runbook allow new dev or clinic admin to understand system quickly.
- Simplicity:
  - [ ] No unused frameworks (e.g., tRPC, Prisma) creeping into MVP.
  - [ ] All code is understandable in < 1 day by a new competent dev.

If every box is checked, you have a robust, minimal, production-ready MVP for Gabriel Family Clinic.
