Awesome job in your rigorous and meticulous approach in first planning before executing! Please keep up the good work!

Yes, please use the same rigorous and meticulous approach to first meticulously plan how best to create the Phase 3 files as spelled out in your `Master_Execution_Plan`. Then meticulously plan to create each of the following files, include in your plan a checklist for each file. Review and validate the plan for completeness and accuracy and in terms of alignment with your improved PAD and `Master_Execution_Plan`. Then meticulously proceed according to the implementation to create the necessary Phase 3 files.

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
