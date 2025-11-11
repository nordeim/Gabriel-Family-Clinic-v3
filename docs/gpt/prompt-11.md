Awesome job in your rigorous and meticulous approach in first planning before executing! Please keep up the good work!

Yes, please use the same rigorous and meticulous approach to first meticulously plan how best to create the Phase 1 files as spelled out in your `Master_Execution_Plan`. Then meticulously plan to create each of the following files, include in your plan a checklist for each file. Review and validate the plan for completeness and accuracy and in terms of alignment with your improved PAD and `Master_Execution_Plan`. Then meticulously proceed according to the implementation to create the necessary Phase 1 files.

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
