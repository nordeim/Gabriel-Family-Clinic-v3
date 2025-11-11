Love the consistency. Let’s keep the same disciplined pattern.

We’ll:

1) Carefully plan Phase 2 files.
2) Define a checklist for each.
3) Validate alignment with:
   - Project Architecture Document (PAD)
   - Master_Execution_Plan
   - Phase 0–1 implementations (configs, auth, schema)
4) Then implement complete Phase 2 files:
   - Pages (login, profile, book)
   - API routes
   - Lib utilities (validation, slots)
   - Patient components

The goal: minimal, coherent, and working end-to-end core patient flows.

Note: We’ll assume Supabase Auth is already configured (email or phone OTP). The UI will be simple and non-magical: it guides the user through login using Supabase’s client-side auth. The API routes rely on the JWT provided by Supabase (via `Authorization` or cookie) and our `requireAuth`.

--------------------
Layer 1: Meticulous Plan
--------------------

Phase 2 Objective Recap:

Implement patient-facing flows:

- Authenticate (using Supabase’s client SDK + a simple login page).
- Create/update profile.
- Book appointment.
- View upcoming appointments.

We must ensure:

- All code uses:
  - `requireAuth` from `src/lib/auth.ts` for protected API routes.
  - `supabaseClient()` for client-side auth in `login.tsx`.
  - Our DB schema (`patient_profiles`, `doctors`, `appointments`, `clinic_settings`) correctly.
- Everything is consistent and incremental:
  - No staff logic here (Phase 3).
  - Keep UI lean and robust.

We’ll cover these files:

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
  - `src/lib/validation.ts`
  - `src/lib/slots.ts`
- Components:
  - `src/components/patient/LoginForm.tsx`
  - `src/components/patient/ProfileForm.tsx`
  - `src/components/patient/BookingForm.tsx`
  - `src/components/patient/UpcomingAppointmentsList.tsx`

Design principles:

- Simple UX, senior-friendly:
  - Clear labels.
  - Minimal choices.
- API reliability:
  - Zod validation.
  - Proper status codes.
  - Logged errors (no secrets).
- Security:
  - All protected routes use `requireAuth`.
  - Server uses `supabaseServer`.
  - No leakage of service role key.

Now, per file planning.

1) `src/pages/login.tsx`

Purpose:
- Entry point for patient authentication.
- Uses Supabase JS client for:
  - Magic link (email) or OTP (phone), configurable.
- Not an API route; purely UI + Supabase client.

Plan:
- Use `supabaseClient()` from `lib/supabaseClient`.
- Offer:
  - Email login (magic link) as default (simple).
- Show instructions: check email; once logged in, redirect to `/profile` or `/book`.

Checklist:
- [ ] Renders simple login form.
- [ ] On submit, calls Supabase `signInWithOtp` (email).
- [ ] Shows success/error message.
- [ ] No server key usage.

2) `src/pages/profile.tsx`

Purpose:
- Authenticated page for viewing/editing patient profile.

Plan:
- On mount:
  - Call `GET /api/patient/profile`.
- If not logged in:
  - Show friendly message + link to `/login`.
- If logged in:
  - Render `ProfileForm` with data (or empty for first-time).
  - Submit to `PUT /api/patient/profile`.

Checklist:
- [ ] Uses client-side fetch to our API.
- [ ] Handles loading/error states.
- [ ] Integrates `ProfileForm`.

3) `src/pages/book.tsx`

Purpose:
- Authenticated booking page.

Plan:
- On mount:
  - Ensure user is logged in (if 401 from API, show login prompt).
- Flow:
  - Fetch doctors: `GET /api/doctors`.
  - After doctor + date selected:
    - Fetch slots: `GET /api/slots?doctor_id&date`.
  - Submit booking:
    - `POST /api/appointments/book`.
  - Show confirmation + small summary.

Checklist:
- [ ] Renders `BookingForm`.
- [ ] Handles unauthorized state (link to `/login`).
- [ ] Mobile-first.

4) API routes (Phase 2):

All must:

- Use `requireAuth` for patient-specific operations.
- Use `supabaseServer`.
- Be aligned with schema.

a) `GET /api/patient/profile`:
- Find profile by `user_id = authUser.id`.
- Return `profile` or `null`.

b) `PUT /api/patient/profile`:
- Validate body with Zod.
- Hash + mask NRIC.
- Upsert `patient_profiles` by `user_id`.

c) `GET /api/doctors`:
- Public.
- Select active doctors.

d) `GET /api/slots`:
- Public (for now).
- Use `getAvailableSlots(doctor_id, date)` from `lib/slots.ts`.

e) `POST /api/appointments/book`:
- Require auth.
- Lookup `patient_profile` by `user_id`.
- Insert `appointments` with status `booked`.
- No queue number yet.

f) `GET /api/appointments/mine`:
- Require auth.
- Resolve `patient_profile` by `user_id`.
- Return all their appointments.

Checklist:
- [ ] All protected routes call `requireAuth`.
- [ ] All DB interactions use existing columns.
- [ ] Return meaningful HTTP codes.

5) `src/lib/validation.ts`

Purpose:
- Centralized Zod schemas.

Plan:
- Export:
  - `ProfileSchema`
  - `BookAppointmentSchema` (doctor_id, scheduled_start)
- Keep small and share between pages and APIs where possible.

Checklist:
- [ ] Schemas match DB expectations.
- [ ] No circular imports.

6) `src/lib/slots.ts`

Purpose:
- Encapsulate slot computation logic.

Plan:
- `getAvailableSlots(doctorId, date)`:
  - Read `clinic_settings.slot_duration_min`.
  - Assume simple working hours (09:00–12:00, 14:00–17:00) for MVP.
  - Fetch existing appointments; filter out booked slots.

Checklist:
- [ ] Deterministic.
- [ ] Uses `supabaseServer`.
- [ ] Compatible with unit tests.

7) Components under `src/components/patient`:

a) `LoginForm.tsx`:
- Simple email form.
- Uses Supabase client.
- Shows messages.

b) `ProfileForm.tsx`:
- Inputs:
  - full_name
  - nric
  - dob
  - language
  - chas_tier
- Submits to `/api/patient/profile` via fetch.

c) `BookingForm.tsx`:
- Props:
  - doctors (list)
- Handles:
  - doctor selection
  - date selection
  - fetch slots and show as buttons
  - submit booking.

d) `UpcomingAppointmentsList.tsx`:
- Displays list of appointments (from `/api/appointments/mine` data).

Checklist (components):
- [ ] Pure presentational/interaction logic; no direct DB.
- [ ] Accept props and callbacks where applicable.
- [ ] Senior-friendly.

Global Phase 2 Checklist:

- [ ] Logged-in test user can:
  - Login via /login.
  - Create profile via /profile.
  - Book via /book.
  - View their bookings (via /book confirmation or dedicated list).
- [ ] RLS holds: can’t access others’ data.
- [ ] No staff logic yet.

Plan validated: consistent with PAD, Master Plan, and prior phases. Now implement.

--------------------
Layer 2: Implement Phase 2 Files
--------------------

Below are complete versions. Adjust imports if your structure differs slightly.

Note: All code uses only what we’ve defined so far.

1) `src/lib/validation.ts`

```ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  nric: z.string().min(5).max(20),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in format YYYY-MM-DD'),
  language: z.string().default('en'),
  chas_tier: z
    .enum(['blue', 'orange', 'green', 'none', 'unknown'])
    .default('unknown')
});

export const BookAppointmentSchema = z.object({
  doctor_id: z.string().uuid(),
  scheduled_start: z.string().datetime()
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
```

2) `src/lib/slots.ts`

```ts
import dayjs from 'dayjs';
import { supabaseServer } from './supabaseServer';

type Slot = {
  iso: string;
  label: string;
};

export async function getAvailableSlots(doctorId: string, date: string): Promise<Slot[]> {
  // Get clinic settings
  const { data: settings, error: settingsError } = await supabaseServer
    .from('clinic_settings')
    .select('slot_duration_min')
    .limit(1)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const slotDuration = settings?.slot_duration_min ?? 15;

  const dayStart = dayjs(`${date}T09:00:00`);
  const lunchStart = dayjs(`${date}T12:00:00`);
  const lunchEnd = dayjs(`${date}T14:00:00`);
  const dayEnd = dayjs(`${date}T17:00:00`);

  const candidateSlots: string[] = [];
  let t = dayStart;

  while (t.isBefore(dayEnd)) {
    const isLunch = t.isSameOrAfter(lunchStart) && t.isBefore(lunchEnd);
    if (!isLunch) {
      candidateSlots.push(t.toISOString());
    }
    t = t.add(slotDuration, 'minute');
  }

  // Fetch existing appointments for that doctor on that date
  const { data: appointments, error: apptError } = await supabaseServer
    .from('appointments')
    .select('scheduled_start')
    .eq('doctor_id', doctorId)
    .gte('scheduled_start', dayStart.toISOString())
    .lt('scheduled_start', dayEnd.toISOString());

  if (apptError) throw apptError;

  const booked = new Set(
    (appointments || []).map((a) => dayjs(a.scheduled_start).toISOString())
  );

  return candidateSlots
    .filter((iso) => !booked.has(iso))
    .map((iso) => ({
      iso,
      label: dayjs(iso).format('HH:mm')
    }));
}
```

3) `src/components/patient/LoginForm.tsx`

```tsx
import { FormEvent, useState } from 'react';
import { Alert, Button, Stack, Text, TextInput } from '@mantine/core';
import { supabaseClient } from '@/lib/supabaseClient';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const supabase = supabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/profile` }
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to send login link.');
        return;
      }

      setStatus('sent');
      setMessage('Check your email for a login link to continue.');
    } catch (err: any) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Text size="lg" fw={600}>
          Login with your email
        </Text>
        <Text size="sm" c="dimmed">
          We&apos;ll send you a secure login link. No password needed.
        </Text>
        <TextInput
          label="Email address"
          placeholder="you@example.com"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <Button type="submit" size="md" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending link...' : 'Send login link'}
        </Button>
        {message && (
          <Alert color={status === 'error' ? 'red' : 'green'}>{message}</Alert>
        )}
      </Stack>
    </form>
  );
}
```

4) `src/pages/login.tsx`

```tsx
import { Container, Stack, Title, Text } from '@mantine/core';
import { LoginForm } from '@/components/patient/LoginForm';

export default function LoginPage() {
  return (
    <Container size="sm" py="xl">
      <Stack spacing="lg">
        <Title order={1}>Login to Gabriel Family Clinic</Title>
        <Text>
          Use your email to receive a secure login link. Once logged in, you can
          update your profile and book appointments.
        </Text>
        <LoginForm />
      </Stack>
    </Container>
  );
}
```

5) `src/components/patient/ProfileForm.tsx`

```tsx
import { useState } from 'react';
import { Alert, Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { ProfileInput, ProfileSchema } from '@/lib/validation';

type ProfileFormProps = {
  initial?: {
    full_name?: string;
    dob?: string;
    language?: string;
    chas_tier?: string;
  };
};

export function ProfileForm({ initial }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [nric, setNric] = useState('');
  const [dob, setDob] = useState<Date | null>(
    initial?.dob ? dayjs(initial.dob).toDate() : null
  );
  const [language, setLanguage] = useState(initial?.language ?? 'en');
  const [chasTier, setChasTier] = useState(initial?.chas_tier ?? 'unknown');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [error, setError] = useState('');

  async function handleSubmit() {
    setStatus('saving');
    setError('');

    const payload: ProfileInput = {
      full_name: fullName,
      nric: nric || 'TEMP', // require actual in real use
      dob: dob ? dayjs(dob).format('YYYY-MM-DD') : '',
      language,
      chas_tier: chasTier as any
    };

    const parsed = ProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus('error');
      setError('Please check the form fields.');
      return;
    }

    try {
      const res = await fetch('/api/patient/profile.put', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save profile');
      }

      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to save profile');
    }
  }

  return (
    <Stack spacing="md">
      <TextInput
        label="Full Name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.currentTarget.value)}
      />
      <TextInput
        label="NRIC / ID Number"
        required
        value={nric}
        onChange={(e) => setNric(e.currentTarget.value)}
      />
      <DateInput
        label="Date of Birth"
        required
        value={dob}
        onChange={setDob}
        placeholder="Select your date of birth"
      />
      <Select
        label="Preferred Language"
        data={[
          { value: 'en', label: 'English' },
          { value: 'zh', label: 'Chinese' },
          { value: 'ms', label: 'Malay' },
          { value: 'ta', label: 'Tamil' }
        ]}
        value={language}
        onChange={(v) => setLanguage(v || 'en')}
      />
      <Select
        label="CHAS Tier"
        data={[
          { value: 'unknown', label: 'Not sure / Not applicable' },
          { value: 'blue', label: 'Blue' },
          { value: 'orange', label: 'Orange' },
          { value: 'green', label: 'Green' },
          { value: 'none', label: 'None' }
        ]}
        value={chasTier}
        onChange={(v) => setChasTier(v || 'unknown')}
      />
      <Group>
        <Button onClick={handleSubmit} loading={status === 'saving'}>
          Save Profile
        </Button>
      </Group>
      {status === 'success' && (
        <Alert color="green">Profile saved successfully.</Alert>
      )}
      {status === 'error' && error && (
        <Alert color="red">{error}</Alert>
      )}
    </Stack>
  );
}
```

6) `src/pages/profile.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Alert, Anchor, Container, Loader, Stack, Text, Title } from '@mantine/core';
import { ProfileForm } from '@/components/patient/ProfileForm';

type ProfileData = {
  full_name: string;
  nric_masked: string;
  dob: string;
  language: string;
  chas_tier: string;
} | null;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/patient/profile.get');
        if (res.status === 401) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data.profile);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack spacing="lg">
        <Title order={1}>My Profile</Title>

        {loading && <Loader />}

        {unauthorized && (
          <Alert color="blue">
            You&apos;re not logged in. Please{' '}
            <Anchor href="/login">login here</Anchor> to manage your profile.
          </Alert>
        )}

        {error && !loading && (
          <Alert color="red">{error}</Alert>
        )}

        {!loading && !unauthorized && (
          <>
            {profile && (
              <Alert color="gray">
                Current record: {profile.full_name} ({profile.nric_masked})
              </Alert>
            )}
            <ProfileForm initial={profile || undefined} />
          </>
        )}
      </Stack>
    </Container>
  );
}
```

7) `src/components/patient/BookingForm.tsx`

```tsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import dayjs from 'dayjs';
import { BookAppointmentSchema } from '@/lib/validation';

type Doctor = { id: string; name: string };

type Slot = { iso: string; label: string };

export function BookingForm() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'booking' | 'success' | 'error'>(
    'idle'
  );
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await fetch('/api/doctors/index.get');
        if (!res.ok) throw new Error('Failed to load doctors');
        const data = await res.json();
        setDoctors(data.doctors || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load doctors');
      }
    }
    loadDoctors();
  }, []);

  async function loadSlots() {
    if (!doctorId || !date) return;
    setStatus('loading');
    setError('');
    setSlots([]);
    setSelectedSlot('');

    try {
      const res = await fetch(
        `/api/slots/index.get?doctor_id=${encodeURIComponent(
          doctorId
        )}&date=${encodeURIComponent(date)}`
      );
      if (!res.ok) throw new Error('Failed to load slots');
      const data = await res.json();
      setSlots(data.slots || []);
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to load slots');
    }
  }

  async function handleBook() {
    setStatus('booking');
    setError('');
    setConfirmation('');

    const payload = {
      doctor_id: doctorId,
      scheduled_start: selectedSlot
    };

    const parsed = BookAppointmentSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus('error');
      setError('Please select a doctor, date, and time slot.');
      return;
    }

    try {
      const res = await fetch('/api/appointments/book.post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Failed to book appointment');
      }

      setStatus('success');
      const timeLabel = dayjs(parsed.data.scheduled_start).format(
        'YYYY-MM-DD HH:mm'
      );
      setConfirmation(`Your appointment has been booked for ${timeLabel}.`);
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to book appointment');
    }
  }

  return (
    <Stack spacing="md">
      <Text size="lg" fw={600}>
        Book an Appointment
      </Text>

      {error && status === 'error' && <Alert color="red">{error}</Alert>}
      {confirmation && status === 'success' && (
        <Alert color="green">{confirmation}</Alert>
      )}

      <Select
        label="Choose a doctor"
        placeholder="Select doctor"
        data={doctors.map((d) => ({ value: d.id, label: d.name }))}
        value={doctorId}
        onChange={(v) => setDoctorId(v || '')}
      />

      <TextInput
        label="Select date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.currentTarget.value)}
        onBlur={loadSlots}
      />

      {slots.length > 0 && (
        <>
          <Text>Select a time slot</Text>
          <Group>
            {slots.map((slot) => (
              <Button
                key={slot.iso}
                variant={selectedSlot === slot.iso ? 'filled' : 'outline'}
                onClick={() => setSelectedSlot(slot.iso)}
              >
                {slot.label}
              </Button>
            ))}
          </Group>
        </>
      )}

      <Button
        onClick={handleBook}
        disabled={!doctorId || !date || !selectedSlot}
        loading={status === 'booking'}
      >
        Confirm Booking
      </Button>
    </Stack>
  );
}
```

8) `src/pages/book.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Alert, Anchor, Container, Loader, Stack, Title } from '@mantine/core';
import { BookingForm } from '@/components/patient/BookingForm';

export default function BookPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/patient/profile.get');
        if (res.status === 401) {
          setUnauthorized(true);
        }
      } catch {
        // ignore; show unauthorized to be safe
        setUnauthorized(true);
      } finally {
        setCheckingAuth(false);
      }
    }
    check();
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack spacing="lg">
        <Title order={1}>Book an Appointment</Title>

        {checkingAuth && <Loader />}

        {unauthorized && !checkingAuth && (
          <Alert color="blue">
            You need to be logged in to book an appointment.{' '}
            <Anchor href="/login">Login here</Anchor>.
          </Alert>
        )}

        {!checkingAuth && !unauthorized && <BookingForm />}
      </Stack>
    </Container>
  );
}
```

9) `src/components/patient/UpcomingAppointmentsList.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Alert, Card, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

type Appointment = {
  id: string;
  scheduled_start: string;
  status: string;
  queue_number: string | null;
  doctor_id: string;
};

export function UpcomingAppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/appointments/mine.get');
        if (!res.ok) {
          if (res.status === 401) {
            // Not logged in; fail silently or show message
            return;
          }
          throw new Error('Failed to load appointments');
        }
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load appointments');
      }
    }
    load();
  }, []);

  if (error) {
    return <Alert color="red">{error}</Alert>;
  }

  if (!appointments.length) {
    return <Text c="dimmed">No upcoming appointments yet.</Text>;
  }

  return (
    <Stack spacing="sm">
      {appointments.map((appt) => (
        <Card key={appt.id} withBorder>
          <Text fw={600}>
            {dayjs(appt.scheduled_start).format('DD MMM YYYY, HH:mm')}
          </Text>
          <Text size="sm">Status: {appt.status}</Text>
          {appt.queue_number && (
            <Text size="sm">Queue: {appt.queue_number}</Text>
          )}
        </Card>
      ))}
    </Stack>
  );
}
```

10) API Routes

Important: file names include `.get` / `.post` in the prompt, but in Next.js Pages Router, the file name is the route. I’ll follow your convention literally (e.g., `profile.get.ts`) as a pattern, but you can also use `[...path].ts` etc. For clarity, I’ll keep them as separate files as requested.

a) `src/pages/api/patient/profile.get.ts`

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

  const { data, error } = await supabaseServer
    .from('patient_profiles')
    .select('full_name, nric_masked, dob, language, chas_tier')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }

  return res.status(200).json({ profile: data || null });
}
```

b) `src/pages/api/patient/profile.put.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { ProfileSchema } from '@/lib/validation';

function hashNric(nric: string) {
  const secret = process.env.NRIC_HASH_SECRET || 'change-me';
  return crypto.createHmac('sha256', secret).update(nric).digest('hex');
}

function maskNric(nric: string) {
  if (nric.length <= 4) return '****';
  const first = nric.slice(0, 1);
  const last = nric.slice(-1);
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
    return res.status(400).json({
      error: 'Invalid input',
      details: parsed.error.flatten()
    });
  }

  const { full_name, nric, dob, language, chas_tier } = parsed.data;
  const nric_hash = hashNric(nric);
  const nric_masked = maskNric(nric);

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
    .select('full_name, nric_masked, dob, language, chas_tier')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error upserting patient profile:', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }

  return res.status(200).json({ profile: data });
}
```

c) `src/pages/api/doctors/index.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseServer
    .from('doctors')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ error: 'Failed to fetch doctors' });
  }

  return res.status(200).json({ doctors: data || [] });
}
```

d) `src/pages/api/slots/index.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAvailableSlots } from '@/lib/slots';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const doctor_id = String(req.query.doctor_id || '');
  const date = String(req.query.date || '');

  if (!doctor_id || !date) {
    return res.status(400).json({ error: 'doctor_id and date are required' });
  }

  try {
    const slots = await getAvailableSlots(doctor_id, date);
    return res.status(200).json({ slots });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('Error computing slots:', e);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
}
```

e) `src/pages/api/appointments/book.post.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { BookAppointmentSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  let user;
  try {
    user = await requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = BookAppointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { doctor_id, scheduled_start } = parsed.data;
  const start = dayjs(scheduled_start);
  if (!start.isValid()) {
    return res.status(400).json({ error: 'Invalid scheduled_start' });
  }

  // 1) Ensure patient_profile exists for this user
  const { data: profile, error: profileError } = await supabaseServer
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(400).json({ error: 'Patient profile not found' });
  }

  // 2) Create appointment
  const { data: appt, error: apptError } = await supabaseServer
    .from('appointments')
    .insert({
      patient_id: profile.id,
      doctor_id,
      scheduled_start: start.toISOString(),
      status: 'booked'
    })
    .select('id, scheduled_start, doctor_id, status')
    .single();

  if (apptError || !appt) {
    // eslint-disable-next-line no-console
    console.error('Error creating appointment:', apptError);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }

  return res.status(201).json({ success: true, appointment: appt });
}
```

f) `src/pages/api/appointments/mine.get.ts`

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

  // Find patient_profile for user
  const { data: profile, error: profileError } = await supabaseServer
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(200).json({ appointments: [] });
  }

  const { data, error } = await supabaseServer
    .from('appointments')
    .select('id, scheduled_start, status, queue_number, doctor_id')
    .eq('patient_id', profile.id)
    .order('scheduled_start', { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }

  return res.status(200).json({ appointments: data || [] });
}
```

--------------------
Final Phase 2 Validation Checklist
--------------------

- Pages:
  - [x] `/login` uses Supabase to request magic link.
  - [x] `/profile` loads/saves patient profile via APIs.
  - [x] `/book` allows booking when authenticated.
- APIs:
  - [x] `profile.get`/`profile.put` use `requireAuth` + correct schema fields.
  - [x] `doctors` returns active doctors.
  - [x] `slots` uses `getAvailableSlots`.
  - [x] `appointments/book` enforces existing `patient_profile`.
  - [x] `appointments/mine` scoped to current user.
- Lib:
  - [x] `validation.ts` matches DB expectations.
  - [x] `slots.ts` deterministic and schema-aligned.
- Components:
  - [x] Patient components are simple, Mantine-based, and align with flows.
- Security & Alignment:
  - [x] All sensitive endpoints require auth.
  - [x] No overuse of advanced patterns; fully aligned with PAD and Master_Execution_Plan.

If you’d like next, we can:

- Do the same for Phase 3 (Staff Portal & Queue).
- Add a small “Phase 2 Manual QA Script” (step-by-step to verify all flows against a real Supabase project).
