Excellent constraints and sequencing. Let’s do this methodically.

We will:

- First: Plan all three deliverables at a detailed level.
- Validate the plan against our architecture, schema, and MVP scope.
- Then: Execute item (1) only (exact API handler code for Phase 2 and 3).
- Next rounds (per your instruction, “one by one in sequence”):
  - Implement (2) Jest + Playwright configs.
  - Implement (3) migrations + seed files.

Layer 1: Meticulous Plan (for 1–3)

Assumptions (re-validated)

- Runtime:
  - Next.js 14 (Pages Router).
  - Node 18+.
- Backend:
  - Next.js API Routes under `src/pages/api`.
  - Server-side Supabase client (`supabaseServer`) using `SUPABASE_SERVICE_ROLE_KEY`.
- Auth:
  - Supabase Auth for user identities.
  - API routes:
    - Read auth token from:
      - `Authorization: Bearer <token>` or
      - `sb-access-token` cookie (adjust per your integration).
    - `auth.uid()` in RLS is for client inserts; for server-side we can:
      - Use service role and manually enforce user constraints, OR
      - Use user-scoped clients.
  - For clarity and safety here:
    - I’ll use service-role client plus explicit checks based on `user.id` from the token.
- DB Schema:
  - Using the `database_schema.sql` we defined:
    - `patient_profiles(id, user_id, ...)`
    - `staff_profiles(id, user_id, role, ...)`
    - `doctors(id, staff_profile_id, ...)`
    - `clinic_settings`
    - `appointments(id, patient_id, doctor_id, scheduled_start, status, queue_number, ...)`
    - `notifications`
    - RLS:
      - Patients: `auth.uid() = user_id` etc.
      - Staff: membership in `staff_profiles`.
- MVP Scope for these handlers:
  - Phase 2 (Patient):
    - `GET /api/patient/profile`
    - `PUT /api/patient/profile`
    - `GET /api/doctors`
    - `GET /api/slots`
    - `POST /api/appointments/book`
    - `GET /api/appointments/mine`
  - Phase 3 (Staff):
    - `GET /api/staff/appointments`
    - `POST /api/staff/appointment-status`

We also define small shared utilities:

- `getAuthUser(req)`:
  - Returns Supabase user (id, phone, etc.) or null.
- `requireAuth(req)`:
  - Throws or returns user; 401 if missing.
- `requireStaff(req)`:
  - Uses `staff_profiles` to assert staff/doctor/admin.
- `mapDbError`:
  - Log & normalize errors.

Plan for (1) Exact API Handlers

For each handler:

- Inputs:
  - Validate with Zod (no ambiguous shapes).
- Auth:
  - Use `requireAuth`.
- Ownership:
  - Look up `patient_profiles` or `staff_profiles` using `user.id`.
- DB access:
  - Use `supabaseServer` for simplicity.
  - Honor RLS and our own conditions.
- Responses:
  - Clear `4xx` for client errors, `5xx` for server.
- Logging:
  - Log server errors with context, not sensitive details.

List of handlers to implement now:

- `src/pages/api/patient/profile.get.ts`
- `src/pages/api/patient/profile.put.ts`
- `src/pages/api/doctors/index.get.ts`
- `src/pages/api/slots/index.get.ts`
- `src/pages/api/appointments/book.post.ts`
- `src/pages/api/appointments/mine.get.ts`
- `src/pages/api/staff/appointments.get.ts`
- `src/pages/api/staff/appointment-status.post.ts`

Plan for (2) Jest + Playwright Configs

(In next message, after handlers.)

- Jest:
  - `jest.config.cjs`:
    - `testEnvironment: node` (API) and `jsdom` (components via projects).
    - TS support via `ts-jest` or plain JS using `ts-node`/`swc` transforms.
  - Basic test scripts:
    - Unit: `lib/slots.ts`, `lib/queue.ts`.
    - Integration: `appointments.book` with mocked supabase.
- Playwright:
  - `playwright.config.ts`:
    - Base URL: `http://localhost:3000`.
    - Simple test:
      - Visit `/book`, mimic basic flow (with some mocking or seeded user).

Plan for (3) Migrations + Seed Files

(In following message after (2).)

- Align with `database_schema.sql`.
- Supabase-style:
  - `supabase/migrations/0001_initial_schema.sql`.
- Seed script:
  - `supabase/seed.sql` or `scripts/seed.ts`:
    - Insert `clinic_settings`.
    - Insert one `staff_profile` mapped to known auth user id placeholder.
    - Insert `doctors` rows.

Validation of Plan Before Execution

- API handlers:
  - Directly implement MVP flows.
  - No unnecessary complexity.
  - Enforce auth and role checks explicitly.
- Jest/Playwright:
  - Simple, minimal, aligned with stack.
- Migrations:
  - Direct mapping of previous schema.
  - Seed only what UI needs to work.

All good. Now we execute Step 1 only: exact API handler code.

Layer 2: Exact API Handler Code (Phase 2 & 3)

Conventions:

- All code TypeScript.
- All handlers default export a function `(req, res)` at `src/pages/api/...`.
- Uses:
  - `supabaseServer` from `@/lib/supabaseServer`.
  - `getUserFromRequest`, `requireAuth` from `@/lib/auth`.
- Note:
  - Adjust import paths to your actual setup if needed.
  - These handlers assume you’ve integrated Supabase Auth on the frontend and are passing tokens.

1. `GET /api/patient/profile` – Get Current Patient Profile

File: `src/pages/api/patient/profile.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabaseServer
      .from('patient_profiles')
      .select('id, full_name, nric_masked, dob, language, chas_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching patient profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!data) {
      return res.status(200).json({ profile: null });
    }

    return res.status(200).json({ profile: data });
  } catch (e) {
    console.error('Unexpected error in profile.get:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

2. `PUT /api/patient/profile` – Create/Update Profile

File: `src/pages/api/patient/profile.put.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';
import crypto from 'crypto';

const ProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  nric: z.string().min(9).max(12), // You can add SG-specific regex
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  language: z.string().default('en'),
  chas_tier: z.enum(['blue', 'orange', 'green', 'none', 'unknown']).default('unknown')
});

function hashNric(nric: string) {
  const secret = process.env.NRIC_HASH_SECRET || 'change-me';
  return crypto.createHmac('sha256', secret).update(nric).digest('hex');
}

function maskNric(nric: string) {
  if (nric.length < 3) return '***';
  const first = nric[0];
  const last = nric[nric.length - 1];
  return `${first}******${last}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = ProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { full_name, nric, dob, language, chas_tier } = parsed.data;
  const nric_hash = hashNric(nric);
  const nric_masked = maskNric(nric);

  try {
    // Upsert patient profile for this user_id
    const { data, error } = await supabaseServer
      .from('patient_profiles')
      .upsert(
        {
          user_id: user.id,
          full_name,
          nric_hash,
          nric_masked,
          dob,
          language,
          chas_tier
        },
        { onConflict: 'user_id' }
      )
      .select('id, full_name, nric_masked, dob, language, chas_tier')
      .single();

    if (error) {
      console.error('Error upserting patient profile:', error);
      return res.status(500).json({ error: 'Failed to save profile' });
    }

    return res.status(200).json({ profile: data });
  } catch (e) {
    console.error('Unexpected error in profile.put:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

3. `GET /api/doctors` – List Active Doctors

File: `src/pages/api/doctors/index.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { data, error } = await supabaseServer
      .from('doctors')
      .select('id, name, photo_url, languages')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ error: 'Failed to fetch doctors' });
    }

    return res.status(200).json({ doctors: data ?? [] });
  } catch (e) {
    console.error('Unexpected error in doctors.get:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

4. `GET /api/slots` – Compute Available Slots

Uses `clinic_settings` and existing `appointments`.

File: `src/pages/api/slots/index.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAvailableSlots } from '@/lib/slots';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const doctor_id = String(req.query.doctor_id || '');
  const date = String(req.query.date || ''); // YYYY-MM-DD

  if (!doctor_id || !date) {
    return res.status(400).json({ error: 'doctor_id and date are required' });
  }

  try {
    const slots = await getAvailableSlots(doctor_id, date);
    return res.status(200).json({ slots });
  } catch (e) {
    console.error('Error computing slots:', e);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
}
```

Example `getAvailableSlots` (for reference in `src/lib/slots.ts`):

```ts
import { supabaseServer } from './supabaseServer';
import dayjs from 'dayjs';

// Simple: use clinic_settings.slot_duration_min and booking_window_days
export async function getAvailableSlots(doctorId: string, date: string) {
  // Fetch clinic settings
  const { data: settings, error: settingsErr } = await supabaseServer
    .from('clinic_settings')
    .select('slot_duration_min')
    .limit(1)
    .maybeSingle();

  if (settingsErr) throw settingsErr;

  const slotDuration = settings?.slot_duration_min ?? 15;

  // For MVP: assume working hours 09:00–12:00, 14:00–17:00
  const dayStart = dayjs(`${date}T09:00:00`);
  const breaks = [dayjs(`${date}T12:00:00`), dayjs(`${date}T14:00:00`)];
  const dayEnd = dayjs(`${date}T17:00:00`);

  const candidateSlots: string[] = [];
  let t = dayStart;
  while (t.isBefore(dayEnd)) {
    if (!(t.isAfter(breaks[0]) && t.isBefore(breaks[1]))) {
      candidateSlots.push(t.toISOString());
    }
    t = t.add(slotDuration, 'minute');
  }

  // Fetch existing appointments
  const { data: appts, error: apptsErr } = await supabaseServer
    .from('appointments')
    .select('scheduled_start')
    .eq('doctor_id', doctorId)
    .gte('scheduled_start', dayStart.toISOString())
    .lt('scheduled_start', dayEnd.toISOString());

  if (apptsErr) throw apptsErr;

  const bookedSet = new Set((appts || []).map((a) => dayjs(a.scheduled_start).toISOString()));

  // Available = candidates not booked
  const available = candidateSlots.filter((slot) => !bookedSet.has(slot));

  // Return simplified format: { start: 'HH:MM' }
  return available.map((iso) => ({
    iso,
    label: dayjs(iso).format('HH:mm')
  }));
}
```

5. `POST /api/appointments/book` – Create Appointment

File: `src/pages/api/appointments/book.post.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';
import dayjs from 'dayjs';
import { sendBookingConfirmation } from '@/lib/notifications';

const BookSchema = z.object({
  doctor_id: z.string().uuid(),
  scheduled_start: z.string().datetime() // ISO string
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = BookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { doctor_id, scheduled_start } = parsed.data;
  const start = dayjs(scheduled_start);
  if (!start.isValid()) {
    return res.status(400).json({ error: 'Invalid scheduled_start' });
  }

  try {
    // 1) Find patient_profile
    const { data: profile, error: profileErr } = await supabaseServer
      .from('patient_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(400).json({ error: 'Patient profile not found' });
    }

    // 2) Optional: check slot is still available (best-effort).
    // Could re-use logic, or rely on DB uniqueness in future.

    // 3) Insert appointment
    const { data: appt, error: apptErr } = await supabaseServer
      .from('appointments')
      .insert({
        patient_id: profile.id,
        doctor_id,
        scheduled_start: start.toISOString(),
        status: 'booked'
      })
      .select('id, scheduled_start, doctor_id')
      .single();

    if (apptErr || !appt) {
      console.error('Error creating appointment:', apptErr);
      return res.status(500).json({ error: 'Failed to create appointment' });
    }

    // 4) Fetch doctor name for message
    const { data: doctor, error: docErr } = await supabaseServer
      .from('doctors')
      .select('name')
      .eq('id', doctor_id)
      .single();

    if (docErr || !doctor) {
      console.warn('Doctor lookup failed; continuing without name');
    }

    // 5) Best-effort confirmation
    try {
      const datetimeLabel = start.format('YYYY-MM-DD HH:mm');
      await sendBookingConfirmation(user.phone ?? '', {
        doctorName: doctor?.name ?? 'Your Doctor',
        datetime: datetimeLabel
      });
    } catch (notifyErr) {
      console.warn('Booking confirmation failed:', notifyErr);
    }

    return res.status(201).json({
      success: true,
      appointment: appt
    });
  } catch (e) {
    console.error('Unexpected error in appointments/book:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

Note:
- `user.phone` depends on how Supabase Auth is configured; adjust accordingly.
- For strictness, you can store phone in `patient_profiles` and use that.

6. `GET /api/appointments/mine` – List Patient’s Appointments

File: `src/pages/api/appointments/mine.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get patient_profile id
    const { data: profile, error: profileErr } = await supabaseServer
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(400).json({ error: 'Patient profile not found' });
    }

    const { data, error } = await supabaseServer
      .from('appointments')
      .select('id, scheduled_start, status, queue_number, doctor_id')
      .eq('patient_id', profile.id)
      .order('scheduled_start', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    return res.status(200).json({ appointments: data ?? [] });
  } catch (e) {
    console.error('Unexpected error in appointments/mine:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

7. `GET /api/staff/appointments` – Today’s Appointments

File: `src/pages/api/staff/appointments.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import dayjs from 'dayjs';

async function requireStaff(userId: string) {
  const { data, error } = await supabaseServer
    .from('staff_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data || !['staff', 'doctor', 'admin'].includes(data.role)) {
    throw new Error('FORBIDDEN');
  }
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
    await requireStaff(user.id);
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = dayjs();
    const start = today.startOf('day').toISOString();
    const end = today.endOf('day').toISOString();

    const { data, error } = await supabaseServer
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        status,
        queue_number,
        patient:patient_profiles(full_name),
        doctor:doctors(name)
      `)
      .gte('scheduled_start', start)
      .lte('scheduled_start', end)
      .order('scheduled_start', { ascending: true });

    if (error) {
      console.error('Error fetching staff appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    return res.status(200).json({ appointments: data ?? [] });
  } catch (e) {
    console.error('Unexpected error in staff/appointments:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

8. `POST /api/staff/appointment-status` – Update Status & Queue

File: `src/pages/api/staff/appointment-status.post.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';
import { getNextQueueNumber } from '@/lib/queue';

const StatusSchema = z.object({
  appointment_id: z.string().uuid(),
  status: z.enum(['arrived', 'in_consultation', 'completed', 'no_show'])
});

async function requireStaff(userId: string) {
  const { data, error } = await supabaseServer
    .from('staff_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data || !['staff', 'doctor', 'admin'].includes(data.role)) {
    throw new Error('FORBIDDEN');
  }
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
    await requireStaff(user.id);
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { appointment_id, status } = parsed.data;

  try {
    // Load appointment
    const { data: appt, error: apptErr } = await supabaseServer
      .from('appointments')
      .select('id, doctor_id, scheduled_start, queue_number')
      .eq('id', appointment_id)
      .single();

    if (apptErr || !appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    let queue_number = appt.queue_number;

    if (status === 'arrived' && !queue_number) {
      queue_number = await getNextQueueNumber(appt.doctor_id, appt.scheduled_start);
    }

    const { error: updErr } = await supabaseServer
      .from('appointments')
      .update({
        status,
        queue_number
      })
      .eq('id', appointment_id);

    if (updErr) {
      console.error('Error updating appointment status:', updErr);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    return res.status(200).json({
      success: true,
      queue_number
    });
  } catch (e) {
    console.error('Unexpected error in staff/appointment-status:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

At this point:

- Core Phase 2/3 APIs are fully specified.
- They align with the schema and architecture.
- They are pragmatic and enforce basic auth/role rules.

Next Steps (per your sequence)

If you confirm this is aligned with your expectations, I will next:

2) Provide example Jest and Playwright configs and minimal tests aligned with these handlers.

3) Provide all database migrations (split from `database_schema.sql` into migration files if desired) and seed scripts for:
   - `clinic_settings`
   - `staff_profiles`
   - `doctors`

All with the same meticulous, production-minded rigor.
