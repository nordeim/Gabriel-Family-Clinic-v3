Awesome job in your rigorous and meticulous approach in first planning before executing! Please keep up the good work!

Yes, please use the same rigorous and meticulous approach to first meticulously plan how best to create the Phase 2 files as spelled out in your `Master_Execution_Plan`. Then meticulously plan to create each of the following files, include in your plan a checklist for each file. Review and validate the plan for completeness and accuracy and in terms of alignment with your improved PAD and `Master_Execution_Plan`. Then meticulously proceed according to the implementation to create the necessary Phase 2 files.

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
