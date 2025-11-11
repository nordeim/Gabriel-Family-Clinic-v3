Awesome job in your rigorous and meticulous approach in first planning before executing! Please keep up the good work!

Yes, please use the same rigorous and meticulous approach to first meticulously plan how best to create the Phase 4 files as spelled out in your `Master_Execution_Plan`. Then meticulously plan to create each of the following files, include in your plan a checklist for each file. Review and validate the plan for completeness and accuracy and in terms of alignment with your improved PAD and `Master_Execution_Plan`. Then meticulously proceed according to the implementation to create the necessary Phase 4 files.

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
