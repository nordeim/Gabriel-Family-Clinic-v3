Love the clarity. Let’s keep the same disciplined flow.

We will:

1) Meticulously plan Phase 3 implementation.
2) Define a checklist for each file.
3) Validate alignment with:
   - Project Architecture Document (PAD)
   - Master_Execution_Plan
   - Phase 0–2 implementations (auth, schema, flows)
4) Then implement all required Phase 3 files:
   - Staff pages
   - Staff APIs
   - Queue lib
   - Staff components

Goal: a minimal, robust staff console for today’s appointments and queue/status management.

--------------------
Layer 1: Meticulous Plan
--------------------

Phase 3 Objective Recap:

Give staff/doctors:

- A secure login (reuse Supabase Auth).
- View of today’s appointments.
- Ability to:
  - Mark arrived, in_consultation, completed, no_show.
  - Auto-assign queue number on arrival.

Constraints/Assumptions:

- Auth:
  - Same Supabase Auth as patients.
  - Staff are distinguished by presence of `staff_profiles` row (role: staff/doctor/admin).
- RLS:
  - We already defined policies allowing staff (via `staff_profiles`) to read appointments/patients.
- Simplicity:
  - No dedicated role-based UI framework; just checks and simple conditional flows.
  - Protected API routes for staff operations.

Files to design/implement:

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

We must ensure:

- All staff APIs:
  - Use `requireAuth`.
  - Verify staff role via `staff_profiles`.
- Queue logic:
  - Deterministic queue number per doctor per day.
- Staff UI:
  - Simple, easy for front-desk use.

Now, file-by-file planning.

1) `src/lib/queue.ts`

Purpose:
- Encapsulate queue number assignment logic.

Plan:
- Implement `getNextQueueNumber(doctorId, datetime)` as provided:
  - Look at all appointments for that doctor on that day.
  - Extract existing `queue_number`s.
  - If none: A001.
  - Else: next sequential (A00X).

Checklist:
- [ ] Uses `supabaseServer`.
- [ ] Day boundaries correct (startOf, endOf).
- [ ] Handles missing/invalid queue numbers robustly.

2) `src/pages/api/staff/appointments.get.ts`

Purpose:
- For authenticated staff:
  - Return today’s appointments with patient + doctor info.

Plan:
- Steps:
  - `requireAuth(req)` to get user.
  - Check `staff_profiles` for user_id:
    - role in ['staff', 'doctor', 'admin'].
    - If not: 403.
  - Compute today’s start/end in clinic timezone (we’ll use server local or assume Asia/Singapore).
  - Query `appointments`:
    - Today’s date.
    - Join:
      - patient_profiles.full_name
      - doctors.name
- Return:
  - Array of appointment objects ready for the table.

Checklist:
- [ ] Rejects non-staff.
- [ ] Returns appointments sorted by scheduled_start.
- [ ] Matches fields used by staff components.

3) `src/pages/api/staff/appointment-status.post.ts`

Purpose:
- Allow staff to update appointment status, assign queue numbers on arrival.

Plan:
- Steps:
  - `requireAuth`.
  - Ensure staff role.
  - Validate body via Zod:
    - `appointment_id` (uuid string)
    - `status` in ['arrived','in_consultation','completed','no_show'].
  - Fetch appointment:
    - If not found: 404.
  - If setting status to 'arrived':
    - If `queue_number` is null:
      - Call `getNextQueueNumber(doctor_id, scheduled_start)`.
  - Update appointment row with new status (and queue_number if applicable).
- Return:
  - Success + queue_number (if any).

Checklist:
- [ ] Enforces staff-only.
- [ ] Idempotent for 'arrived' with existing queue number.
- [ ] Validates status transitions structurally (MVP: no complex transition graph).

4) `src/components/staff/StaffLoginForm.tsx`

Purpose:
- Simple login for staff via Supabase email (or OTP).
- Essentially same as patient `LoginForm`, but with staff context messaging.

Plan:
- Email-based sign-in using `supabaseClient().auth.signInWithOtp`.
- On success, instruct to check email and then open `/staff/appointments`.
- No direct role check here; role is enforced server-side in APIs.

Checklist:
- [ ] Uses Supabase client.
- [ ] Clear “staff only” copy.
- [ ] No service role usage.

5) `src/pages/staff/login.tsx`

Purpose:
- Wrap `StaffLoginForm` in a staff-branded page.

Checklist:
- [ ] Clear that it’s for staff/doctor/admin.
- [ ] No direct logic.

6) `src/components/staff/TodayAppointmentsTable.tsx`

Purpose:
- Present today’s appointments in a table.
- Show:
  - Time
  - Patient name
  - Doctor name
  - Status
  - Queue number
  - Control buttons (wired to QueueControls/update API).

Plan:
- Props:
  - `appointments` (array) from parent.
  - `onUpdateStatus` callback (to trigger API and refresh).
- Quick mapping with Mantine `Table`.

Checklist:
- [ ] Readable at a glance.
- [ ] Uses props only; no direct API calls.

7) `src/components/staff/QueueControls.tsx`

Purpose:
- Render buttons to update status for a given appointment.

Plan:
- Props:
  - `appointment`
  - `onStatusChange(status)` to inform parent to call API.
- Buttons:
  - "Mark Arrived"
  - "Start Consultation"
  - "Complete"
  - "No Show"
- Disable irrelevant statuses based on current status (simple rules).

Checklist:
- [ ] Delegates network logic to parent.
- [ ] Clear labeling.

8) `src/pages/staff/appointments.tsx`

Purpose:
- Main staff view.

Plan:
- On mount:
  - Fetch `/api/staff/appointments.get`.
- If 401/403:
  - Show message: must be logged in as staff; link to `/staff/login`.
- If ok:
  - Show `TodayAppointmentsTable`.
  - Handle status updates:
    - When `QueueControls` triggers:
      - Call `/api/staff/appointment-status.post`.
      - On success, refetch.

Checklist:
- [ ] Handles auth failure gracefully.
- [ ] Refreshes data on status update.
- [ ] Usable for front-desk.

Global Phase 3 Checklist:

- [ ] At least one Supabase user mapped to `staff_profiles`.
- [ ] `/staff/login` sends login link via Supabase.
- [ ] `/staff/appointments`:
  - Loads today’s appointments for staff user.
  - Allows status updates and queue assignment.
- [ ] Patients cannot call these staff APIs meaningfully (role gates).
- [ ] Code consistent with PAD/Master Plan and prior phases.

Plan validated. Now implement.

--------------------
Layer 2: Implement Phase 3 Files
--------------------

1) `src/lib/queue.ts`

```ts
import dayjs from 'dayjs';
import { supabaseServer } from './supabaseServer';

/**
 * Compute the next queue number for a given doctor on the day of `datetime`.
 * Format: A001, A002, ...
 */
export async function getNextQueueNumber(doctorId: string, datetime: string): Promise<string> {
  const dayStart = dayjs(datetime).startOf('day').toISOString();
  const dayEnd = dayjs(datetime).endOf('day').toISOString();

  const { data, error } = await supabaseServer
    .from('appointments')
    .select('queue_number')
    .eq('doctor_id', doctorId)
    .gte('scheduled_start', dayStart)
    .lte('scheduled_start', dayEnd);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching queue numbers:', error);
    throw error;
  }

  const numbers = (data || [])
    .map((a) => a.queue_number)
    .filter((q): q is string => Boolean(q));

  if (numbers.length === 0) return 'A001';

  const maxNum = Math.max(
    ...numbers.map((q) => {
      const numeric = parseInt(q.replace(/\D/g, '') || '0', 10);
      return Number.isNaN(numeric) ? 0 : numeric;
    })
  );

  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `A${nextNum}`;
}
```

Checklist:
- [x] Uses `supabaseServer`.
- [x] Defensive parsing; idempotent.

2) `src/components/staff/StaffLoginForm.tsx`

```tsx
import { FormEvent, useState } from 'react';
import { Alert, Button, Stack, Text, TextInput } from '@mantine/core';
import { supabaseClient } from '@/lib/supabaseClient';

export function StaffLoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const supabase = supabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/staff/appointments` }
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to send login link.');
        return;
      }

      setStatus('sent');
      setMessage(
        'If this email belongs to a registered staff member, a login link has been sent.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Text size="lg" fw={600}>
          Staff / Doctor Login
        </Text>
        <Text size="sm" c="dimmed">
          Enter your work email to receive a secure login link.
        </Text>
        <TextInput
          label="Work Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <Button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending link...' : 'Send login link'}
        </Button>
        {message && (
          <Alert color={status === 'error' ? 'red' : 'green'}>{message}</Alert>
        )}
      </Stack>
    </form>
  );
}
```

Checklist:
- [x] Mirrors patient login with staff context.
- [x] Redirects to `/staff/appointments` after login.

3) `src/pages/staff/login.tsx`

```tsx
import { Container, Stack, Title, Text } from '@mantine/core';
import { StaffLoginForm } from '@/components/staff/StaffLoginForm';

export default function StaffLoginPage() {
  return (
    <Container size="sm" py="xl">
      <Stack spacing="lg">
        <Title order={1}>Gabriel Clinic Staff Login</Title>
        <Text>
          This portal is for Gabriel Family Clinic staff and doctors only. Unauthorized
          access is prohibited.
        </Text>
        <StaffLoginForm />
      </Stack>
    </Container>
  );
}
```

Checklist:
- [x] Clear messaging.
- [x] Simple.

4) `src/components/staff/QueueControls.tsx`

```tsx
import { Button, Group } from '@mantine/core';

type Props = {
  status: string;
  onChangeStatus: (newStatus: 'arrived' | 'in_consultation' | 'completed' | 'no_show') => void;
};

export function QueueControls({ status, onChangeStatus }: Props) {
  return (
    <Group gap="xs">
      {status === 'booked' && (
        <Button size="xs" onClick={() => onChangeStatus('arrived')}>
          Mark Arrived
        </Button>
      )}

      {status === 'arrived' && (
        <Button size="xs" onClick={() => onChangeStatus('in_consultation')}>
          Start Consultation
        </Button>
      )}

      {status === 'in_consultation' && (
        <Button size="xs" onClick={() => onChangeStatus('completed')}>
          Complete
        </Button>
      )}

      {status !== 'completed' && status !== 'no_show' && (
        <Button
          size="xs"
          variant="outline"
          color="red"
          onClick={() => onChangeStatus('no_show')}
        >
          No Show
        </Button>
      )}
    </Group>
  );
}
```

Checklist:
- [x] Simple state machine for statuses.
- [x] Delegates network calls.

5) `src/components/staff/TodayAppointmentsTable.tsx`

```tsx
import { Table, Text } from '@mantine/core';
import { QueueControls } from './QueueControls';

export type StaffAppointment = {
  id: string;
  scheduled_start: string;
  status: string;
  queue_number: string | null;
  patient_full_name: string;
  doctor_name: string;
};

type Props = {
  appointments: StaffAppointment[];
  onUpdateStatus: (
    appointmentId: string,
    status: 'arrived' | 'in_consultation' | 'completed' | 'no_show'
  ) => Promise<void>;
};

export function TodayAppointmentsTable({ appointments, onUpdateStatus }: Props) {
  if (!appointments.length) {
    return <Text c="dimmed">No appointments scheduled for today.</Text>;
  }

  return (
    <Table striped highlightOnHover withBorder withColumnBorders fontSize="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Time</Table.Th>
          <Table.Th>Patient</Table.Th>
          <Table.Th>Doctor</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Queue</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {appointments.map((appt) => (
          <Table.Tr key={appt.id}>
            <Table.Td>
              {new Date(appt.scheduled_start).toLocaleTimeString('en-SG', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Table.Td>
            <Table.Td>{appt.patient_full_name}</Table.Td>
            <Table.Td>{appt.doctor_name}</Table.Td>
            <Table.Td>{appt.status}</Table.Td>
            <Table.Td>{appt.queue_number || '-'}</Table.Td>
            <Table.Td>
              <QueueControls
                status={appt.status}
                onChangeStatus={(status) => onUpdateStatus(appt.id, status)}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
```

Checklist:
- [x] Uses fields we’ll provide in API.
- [x] Calls back `onUpdateStatus`.

6) `src/pages/staff/appointments.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Alert, Anchor, Container, Loader, Stack, Title } from '@mantine/core';
import { TodayAppointmentsTable, StaffAppointment } from '@/components/staff/TodayAppointmentsTable';

export default function StaffAppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [error, setError] = useState('');

  async function loadAppointments() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/staff/appointments.get');
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setAppointments([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
      setUnauthorized(false);
    } catch (e: any) {
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleUpdateStatus(
    appointmentId: string,
    status: 'arrived' | 'in_consultation' | 'completed' | 'no_show'
  ) {
    try {
      const res = await fetch('/api/staff/appointment-status.post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId, status })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.error) {
        throw new Error(body.error || 'Failed to update status');
      }

      await loadAppointments();
    } catch (e: any) {
      setError(e.message || 'Failed to update status');
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="lg">
        <Title order={1}>Today&apos;s Appointments</Title>

        {loading && <Loader />}

        {unauthorized && !loading && (
          <Alert color="blue">
            You must be logged in as staff to view this page.{' '}
            <Anchor href="/staff/login">Staff login</Anchor>
          </Alert>
        )}

        {error && !loading && (
          <Alert color="red">{error}</Alert>
        )}

        {!loading && !unauthorized && (
          <TodayAppointmentsTable
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </Stack>
    </Container>
  );
}
```

Checklist:
- [x] Handles unauthorized.
- [x] Uses API routes.
- [x] Refreshes on status changes.

7) `src/pages/api/staff/appointments.get.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';

async function assertStaff(userId: string) {
  const { data, error } = await supabaseServer
    .from('staff_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

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
    await assertStaff(user.id);
  } catch (err: any) {
    if (err?.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = dayjs();
  const start = today.startOf('day').toISOString();
  const end = today.endOf('day').toISOString();

  const { data, error } = await supabaseServer
    .from('appointments')
    .select(
      `
      id,
      scheduled_start,
      status,
      queue_number,
      patient:patient_profiles(full_name),
      doctor:doctors(name)
    `
    )
    .gte('scheduled_start', start)
    .lte('scheduled_start', end)
    .order('scheduled_start', { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching staff appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }

  const appointments =
    data?.map((row: any) => ({
      id: row.id,
      scheduled_start: row.scheduled_start,
      status: row.status,
      queue_number: row.queue_number,
      patient_full_name: row.patient?.full_name || 'Unknown',
      doctor_name: row.doctor?.name || 'Unknown'
    })) || [];

  return res.status(200).json({ appointments });
}
```

Checklist:
- [x] Staff-only.
- [x] Joins patient/doctor for display.
- [x] Today-only filter.

8) `src/pages/api/staff/appointment-status.post.ts`

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { getNextQueueNumber } from '@/lib/queue';

const StatusSchema = z.object({
  appointment_id: z.string().uuid(),
  status: z.enum(['arrived', 'in_consultation', 'completed', 'no_show'])
});

async function assertStaff(userId: string) {
  const { data, error } = await supabaseServer
    .from('staff_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

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
    await assertStaff(user.id);
  } catch (err: any) {
    if (err?.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { appointment_id, status } = parsed.data;

  // Fetch appointment
  const { data: appt, error: fetchError } = await supabaseServer
    .from('appointments')
    .select('id, doctor_id, scheduled_start, queue_number')
    .eq('id', appointment_id)
    .maybeSingle();

  if (fetchError || !appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  let queue_number = appt.queue_number;

  if (status === 'arrived' && !queue_number) {
    try {
      queue_number = await getNextQueueNumber(appt.doctor_id, appt.scheduled_start);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to compute next queue number:', e);
      return res.status(500).json({ error: 'Failed to assign queue number' });
    }
  }

  const { error: updateError } = await supabaseServer
    .from('appointments')
    .update({
      status,
      queue_number
    })
    .eq('id', appointment_id);

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error('Error updating appointment status:', updateError);
    return res.status(500).json({ error: 'Failed to update status' });
  }

  return res.status(200).json({ success: true, queue_number });
}
```

Checklist:
- [x] Staff-only.
- [x] Assigns queue on first arrival.
- [x] Idempotent for re-arrived with existing queue number.

--------------------
Final Phase 3 Validation Checklist
--------------------

- Seed:
  - [ ] At least one user in `auth.users` has a corresponding `staff_profiles` entry.
  - [ ] `doctors` table has at least one active doctor.
- Auth:
  - [ ] `/staff/login` can send a magic link.
  - [ ] After signing in as staff user, calling `/api/staff/appointments.get` returns data.
- Staff Portal:
  - [ ] `/staff/appointments`:
    - Shows today’s appointments for seeded data.
    - For a `booked` appointment, “Mark Arrived” assigns a queue number (A001, etc.).
    - Can step through `arrived → in_consultation → completed` and mark `no_show`.
- Security:
  - [ ] Patients (no staff_profile) receive 403/401 on staff APIs.
  - [ ] RLS still ensures no cross-patient data leak.
- Alignment:
  - [ ] All code uses existing helpers (`requireAuth`, `supabaseServer`, `queue`).
  - [ ] No extraneous dependencies or frameworks.

If you’d like next, I can:

- Produce a concise “Phase 2–3 Manual QA Script” (click-by-click verification).
- Add small test stubs for these staff APIs to your Jest suite.
