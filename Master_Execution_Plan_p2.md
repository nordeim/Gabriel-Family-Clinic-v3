```markdown
## Day 11: Queue Backend (continued)

- [ ] Create src/pages/api/queue/next.ts
  ```typescript
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const { doctorId } = req.body;
    
    // Get next patient in queue
    const { data: nextAppointment } = await supabase
      .from('appointments')
      .select('*, patients(*)')
      .eq('doctor_id', doctorId)
      .eq('status', 'arrived')
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('queue_sequence')
      .limit(1)
      .single();
    
    if (!nextAppointment) {
      return res.status(404).json({ error: 'No patients in queue' });
    }
    
    // Update queue status
    await supabase
      .from('queue_status')
      .update({
        current_queue_number: nextAppointment.queue_number,
        current_patient_id: nextAppointment.patient_id,
        current_sequence: nextAppointment.queue_sequence,
        last_updated: new Date().toISOString(),
      })
      .eq('doctor_id', doctorId);
    
    // Update appointment status
    await supabase
      .from('appointments')
      .update({ 
        status: 'in_consultation',
        actual_start_time: new Date().toISOString()
      })
      .eq('id', nextAppointment.id);
    
    // Send notification to patient
    await sendQueueNotification(nextAppointment);
    
    res.json({ 
      queueNumber: nextAppointment.queue_number,
      patient: nextAppointment.patients 
    });
  }
  ```

- [ ] Create src/lib/realtime.ts
  ```typescript
  import { RealtimeChannel } from '@supabase/supabase-js';
  import { supabase } from './supabase';
  
  export class QueueRealtimeManager {
    private channel: RealtimeChannel | null = null;
    
    subscribe(doctorId: string, onUpdate: (data: any) => void) {
      this.channel = supabase
        .channel(`queue:${doctorId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'queue_status',
            filter: `doctor_id=eq.${doctorId}`,
          },
          (payload) => {
            onUpdate(payload.new);
          }
        )
        .subscribe();
      
      return () => {
        this.unsubscribe();
      };
    }
    
    unsubscribe() {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    }
  }
  ```

## Day 12: Queue Frontend

### Queue Display Components
- [ ] Create src/components/queue/QueueDisplay.tsx
  ```typescript
  import { Card, Text, Title, Badge, Stack } from '@mantine/core';
  import { useEffect, useState } from 'react';
  import { QueueRealtimeManager } from '@/lib/realtime';
  
  export function QueueDisplay({ doctorId }: { doctorId: string }) {
    const [currentNumber, setCurrentNumber] = useState<string>('--');
    const [waitingCount, setWaitingCount] = useState(0);
    const [myNumber, setMyNumber] = useState<string | null>(null);
    
    useEffect(() => {
      const manager = new QueueRealtimeManager();
      
      // Initial fetch
      fetchQueueStatus();
      
      // Subscribe to updates
      const unsubscribe = manager.subscribe(doctorId, (data) => {
        setCurrentNumber(data.current_queue_number || '--');
        updateWaitingCount(data.current_sequence);
      });
      
      return unsubscribe;
    }, [doctorId]);
    
    const fetchQueueStatus = async () => {
      const res = await fetch(`/api/queue/status?doctorId=${doctorId}`);
      const data = await res.json();
      setCurrentNumber(data.currentNumber || '--');
      setWaitingCount(data.waitingCount);
    };
    
    return (
      <Card shadow="sm" padding="lg" radius="md">
        <Stack align="center" spacing="lg">
          <Title order={3}>Current Queue Number</Title>
          
          <Text size={72} weight={700} color="blue">
            {currentNumber}
          </Text>
          
          {myNumber && (
            <Badge size="xl" color={myNumber === currentNumber ? 'green' : 'gray'}>
              Your Number: {myNumber}
            </Badge>
          )}
          
          <Text size="sm" color="dimmed">
            {waitingCount} patients waiting • ~{waitingCount * 15} min wait
          </Text>
        </Stack>
      </Card>
    );
  }
  ```

- [ ] Create src/components/queue/QueueManagement.tsx
  ```typescript
  import { Button, Card, Stack, Group, Text } from '@mantine/core';
  import { useState } from 'react';
  import { notifications } from '@mantine/notifications';
  
  export function QueueManagement({ doctorId }: { doctorId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentPatient, setCurrentPatient] = useState<any>(null);
    
    const callNextPatient = async () => {
      setIsLoading(true);
      
      try {
        const res = await fetch('/api/queue/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctorId }),
        });
        
        if (!res.ok) throw new Error('No patients waiting');
        
        const data = await res.json();
        setCurrentPatient(data.patient);
        
        notifications.show({
          title: 'Next Patient Called',
          message: `Queue ${data.queueNumber}: ${data.patient.full_name}`,
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'No Patients',
          message: 'No patients in queue',
          color: 'yellow',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const completeConsultation = async () => {
      const res = await fetch('/api/queue/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          doctorId,
          appointmentId: currentPatient.appointment_id 
        }),
      });
      
      if (res.ok) {
        setCurrentPatient(null);
        notifications.show({
          title: 'Consultation Complete',
          message: 'Ready for next patient',
          color: 'blue',
        });
      }
    };
    
    return (
      <Card>
        <Stack>
          {currentPatient ? (
            <>
              <Text size="lg" weight={500}>
                Current Patient: {currentPatient.full_name}
              </Text>
              <Text size="sm" color="dimmed">
                Queue: {currentPatient.queue_number}
              </Text>
              <Group>
                <Button 
                  onClick={completeConsultation}
                  color="green"
                >
                  Complete Consultation
                </Button>
              </Group>
            </>
          ) : (
            <Button
              onClick={callNextPatient}
              loading={isLoading}
              size="lg"
              fullWidth
            >
              Call Next Patient
            </Button>
          )}
        </Stack>
      </Card>
    );
  }
  ```

## Day 13: Queue Pages

### Patient Queue Page
- [ ] Create src/pages/portal/queue.tsx
  ```typescript
  import { Container, Title } from '@mantine/core';
  import { QueueDisplay } from '@/components/queue/QueueDisplay';
  import { useRouter } from 'next/router';
  
  export default function QueuePage() {
    const router = useRouter();
    const { doctorId, queueNumber } = router.query;
    
    return (
      <Container size="sm" py="xl">
        <Title order={2} mb="xl" align="center">
          Queue Status
        </Title>
        
        <QueueDisplay 
          doctorId={doctorId as string}
          myNumber={queueNumber as string}
        />
      </Container>
    );
  }
  ```

### Doctor Queue Page
- [ ] Create src/pages/doctor/queue.tsx
  ```typescript
  import { Container, Grid, Title } from '@mantine/core';
  import { QueueDisplay } from '@/components/queue/QueueDisplay';
  import { QueueManagement } from '@/components/queue/QueueManagement';
  import { TodayAppointments } from '@/components/queue/TodayAppointments';
  import { useAuth } from '@/hooks/useAuth';
  
  export default function DoctorQueuePage() {
    const { user } = useAuth();
    const doctorId = user?.doctorId;
    
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Queue Management
        </Title>
        
        <Grid>
          <Grid.Col span={6}>
            <QueueDisplay doctorId={doctorId} />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <QueueManagement doctorId={doctorId} />
          </Grid.Col>
          
          <Grid.Col span={12}>
            <TodayAppointments doctorId={doctorId} />
          </Grid.Col>
        </Grid>
      </Container>
    );
  }
  ```

### Validation
- [ ] Test real-time updates
- [ ] Verify queue advancement
- [ ] Check patient notifications
- [ ] Test edge cases (no patients)
```

### Files Created (8 files)
1. `src/pages/api/queue/status.ts`
2. `src/pages/api/queue/next.ts`
3. `src/pages/api/queue/complete.ts`
4. `src/lib/realtime.ts`
5. `src/components/queue/QueueDisplay.tsx`
6. `src/components/queue/QueueManagement.tsx`
7. `src/pages/portal/queue.tsx`
8. `src/pages/doctor/queue.tsx`

---

## Phase 5: Medical Records System (Days 14-16)

### Objective
Implement SOAP notes, MC generation, and prescription management.

### Success Criteria
- [ ] SOAP notes entry working
- [ ] MC PDF generation functional
- [ ] Prescription tracking implemented
- [ ] Medical history viewable

### Implementation Checklist

```markdown
## Day 14: Medical Records Backend

### Medical Records API
- [ ] Create src/pages/api/medical/create-record.ts
  ```typescript
  import { supabase } from '@/lib/supabase';
  import { z } from 'zod';
  
  const recordSchema = z.object({
    appointmentId: z.string().uuid(),
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
    prescriptions: z.array(z.object({
      drug: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
    })).optional(),
    mcDays: z.number().optional(),
  });
  
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const data = recordSchema.parse(req.body);
    
    // Get appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id')
      .eq('id', data.appointmentId)
      .single();
    
    // Create medical record
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        appointment_id: data.appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        prescriptions: data.prescriptions,
        mc_days: data.mcDays,
        mc_start_date: data.mcDays ? new Date() : null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Generate MC if needed
    if (data.mcDays) {
      const mcUrl = await generateMC(record);
      await supabase
        .from('medical_records')
        .update({ mc_pdf_url: mcUrl })
        .eq('id', record.id);
    }
    
    res.json({ record });
  }
  ```

- [ ] Create src/lib/mc-generator.ts
  ```typescript
  import PDFDocument from 'pdfkit';
  import QRCode from 'qrcode';
  import { supabase } from './supabase';
  
  export async function generateMC(record: any): Promise<string> {
    const doc = new PDFDocument({ size: 'A4' });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Header
    doc.fontSize(20).text('MEDICAL CERTIFICATE', { align: 'center' });
    doc.fontSize(14).text('Gabriel Family Clinic', { align: 'center' });
    doc.moveDown();
    
    // Patient info
    doc.fontSize(12);
    doc.text(`Patient: ${record.patient.full_name}`);
    doc.text(`NRIC: ${maskNRIC(record.patient.nric)}`);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`);
    doc.moveDown();
    
    // MC details
    doc.text('This is to certify that the above-named patient is unfit for duty');
    doc.text(`for ${record.mc_days} day(s) from ${format(record.mc_start_date, 'dd/MM/yyyy')}`);
    doc.moveDown();
    
    // QR code for verification
    const verificationCode = generateVerificationCode();
    const qrDataUrl = await QRCode.toDataURL(
      `https://gabrielfamilyclinic.sg/verify/${verificationCode}`
    );
    doc.image(qrDataUrl, { width: 100 });
    
    // Doctor signature
    doc.text(`Dr. ${record.doctor.full_name}`);
    doc.text(`MCR: ${record.doctor.registration_number}`);
    
    doc.end();
    
    // Upload to Supabase Storage
    const buffer = Buffer.concat(chunks);
    const fileName = `mc/${record.id}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
      });
    
    return data?.path || '';
  }
  ```

## Day 15: Medical Records Frontend

### SOAP Notes Components
- [ ] Create src/components/medical/SOAPForm.tsx
  ```typescript
  import { Textarea, Stack, Button, NumberInput } from '@mantine/core';
  import { useForm } from '@mantine/form';
  
  export function SOAPForm({ 
    appointmentId, 
    onSubmit 
  }: { 
    appointmentId: string;
    onSubmit: (data: any) => void;
  }) {
    const form = useForm({
      initialValues: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        mcDays: 0,
      },
    });
    
    return (
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <Textarea
            label="Subjective (Chief Complaint)"
            placeholder="Patient complains of..."
            minRows={3}
            {...form.getInputProps('subjective')}
          />
          
          <Textarea
            label="Objective (Examination Findings)"
            placeholder="BP: 120/80, Temp: 36.5°C..."
            minRows={3}
            {...form.getInputProps('objective')}
          />
          
          <Textarea
            label="Assessment (Diagnosis)"
            placeholder="Upper respiratory tract infection"
            minRows={2}
            {...form.getInputProps('assessment')}
          />
          
          <Textarea
            label="Plan (Treatment)"
            placeholder="Rest, fluids, paracetamol..."
            minRows={3}
            {...form.getInputProps('plan')}
          />
          
          <NumberInput
            label="MC Days (0 if not needed)"
            min={0}
            max={14}
            {...form.getInputProps('mcDays')}
          />
          
          <Button type="submit" size="lg">
            Save & Generate MC
          </Button>
        </Stack>
      </form>
    );
  }
  ```

- [ ] Create src/components/medical/PrescriptionForm.tsx
  ```typescript
  import { TextInput, Select, Button, Card, Stack, Group } from '@mantine/core';
  import { useState } from 'react';
  
  const commonDrugs = [
    { value: 'paracetamol', label: 'Paracetamol 500mg' },
    { value: 'ibuprofen', label: 'Ibuprofen 400mg' },
    { value: 'amoxicillin', label: 'Amoxicillin 500mg' },
    { value: 'loratadine', label: 'Loratadine 10mg' },
  ];
  
  const frequencies = [
    { value: 'OD', label: 'Once daily' },
    { value: 'BD', label: 'Twice daily' },
    { value: 'TDS', label: 'Three times daily' },
    { value: 'QDS', label: 'Four times daily' },
    { value: 'PRN', label: 'As needed' },
  ];
  
  export function PrescriptionForm({ 
    onAdd 
  }: { 
    onAdd: (prescription: any) => void 
  }) {
    const [prescription, setPrescription] = useState({
      drug: '',
      dosage: '',
      frequency: '',
      duration: '',
    });
    
    const handleAdd = () => {
      onAdd(prescription);
      setPrescription({
        drug: '',
        dosage: '',
        frequency: '',
        duration: '',
      });
    };
    
    return (
      <Card>
        <Stack>
          <Select
            label="Drug"
            data={commonDrugs}
            searchable
            value={prescription.drug}
            onChange={(value) => 
              setPrescription({ ...prescription, drug: value || '' })
            }
          />
          
          <TextInput
            label="Dosage"
            placeholder="e.g., 500mg"
            value={prescription.dosage}
            onChange={(e) => 
              setPrescription({ ...prescription, dosage: e.target.value })
            }
          />
          
          <Select
            label="Frequency"
            data={frequencies}
            value={prescription.frequency}
            onChange={(value) => 
              setPrescription({ ...prescription, frequency: value || '' })
            }
          />
          
          <TextInput
            label="Duration"
            placeholder="e.g., 3 days"
            value={prescription.duration}
            onChange={(e) => 
              setPrescription({ ...prescription, duration: e.target.value })
            }
          />
          
          <Button onClick={handleAdd}>
            Add Prescription
          </Button>
        </Stack>
      </Card>
    );
  }
  ```

## Day 16: Medical History View

### Patient Medical History
- [ ] Create src/pages/portal/medical-history.tsx
  ```typescript
  import { Container, Timeline, Card, Text, Badge } from '@mantine/core';
  import { useQuery } from 'react-query';
  import { useAuth } from '@/hooks/useAuth';
  
  export default function MedicalHistoryPage() {
    const { user } = useAuth();
    
    const { data: records } = useQuery(
      ['medical-records', user?.id],
      () => fetch(`/api/medical/records/${user?.id}`).then(r => r.json())
    );
    
    return (
      <Container size="md" py="xl">
        <Title order={2} mb="xl">
          Medical History
        </Title>
        
        <Timeline active={0}>
          {records?.map((record: any) => (
            <Timeline.Item 
              key={record.id}
              title={record.assessment}
              bullet={<IconStethoscope />}
            >
              <Card mt="sm">
                <Text size="sm" color="dimmed">
                  {format(new Date(record.created_at), 'dd MMM yyyy')}
                </Text>
                
                <Text mt="xs">
                  <strong>Symptoms:</strong> {record.subjective}
                </Text>
                
                <Text mt="xs">
                  <strong>Diagnosis:</strong> {record.assessment}
                </Text>
                
                <Text mt="xs">
                  <strong>Treatment:</strong> {record.plan}
                </Text>
                
                {record.mc_days > 0 && (
                  <Badge mt="xs">
                    MC: {record.mc_days} days
                  </Badge>
                )}
                
                {record.prescriptions?.length > 0 && (
                  <Stack mt="md" spacing="xs">
                    <Text size="sm" weight={500}>Medications:</Text>
                    {record.prescriptions.map((p: any, i: number) => (
                      <Text key={i} size="sm">
                        • {p.drug} - {p.dosage} {p.frequency} for {p.duration}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Container>
    );
  }
  ```

### Validation
- [ ] Test SOAP note entry
- [ ] Verify MC PDF generation
- [ ] Check prescription saving
- [ ] Confirm history display
```

### Files Created (8 files)
1. `src/pages/api/medical/create-record.ts`
2. `src/pages/api/medical/records/[id].ts`
3. `src/lib/mc-generator.ts`
4. `src/components/medical/SOAPForm.tsx`
5. `src/components/medical/PrescriptionForm.tsx`
6. `src/components/medical/MCViewer.tsx`
7. `src/pages/portal/medical-history.tsx`
8. `src/pages/doctor/consultation.tsx`

---

## Phase 6: Notification Pipeline (Days 17-18)

### Objective
Implement WhatsApp and SMS notifications.

### Success Criteria
- [ ] WhatsApp notifications working
- [ ] SMS fallback functional
- [ ] Queue alerts sent
- [ ] Appointment reminders scheduled

### Implementation Checklist

```markdown
## Day 17: Notification Backend

### Twilio Integration
- [ ] Create src/lib/twilio.ts
  ```typescript
  import twilio from 'twilio';
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const client = twilio(accountSid, authToken);
  
  export async function sendWhatsApp(
    to: string, 
    message: string
  ): Promise<boolean> {
    try {
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        to: `whatsapp:${to}`,
        body: message,
      });
      return true;
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      // Fallback to SMS
      return sendSMS(to, message);
    }
  }
  
  export async function sendSMS(
    to: string, 
    message: string
  ): Promise<boolean> {
    try {
      await client.messages.create({
        from: process.env.TWILIO_SMS_FROM,
        to,
        body: message,
      });
      return true;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }
  
  export async function sendOTP(
    phone: string, 
    code: string
  ): Promise<boolean> {
    const message = `Your Gabriel Family Clinic OTP is: ${code}. Valid for 5 minutes.`;
    return sendSMS(phone, message);
  }
  ```

- [ ] Create src/lib/notification-templates.ts
  ```typescript
  export const templates = {
    appointmentConfirmation: (data: any) => 
      `✅ Appointment Confirmed!\n\n` +
      `Doctor: ${data.doctorName}\n` +
      `Date: ${data.date}\n` +
      `Time: ${data.time}\n` +
      `Queue: ${data.queueNumber}\n\n` +
      `📍 Gabriel Family Clinic\n` +
      `123 Tampines St 11, #01-456\n\n` +
      `Reply CANCEL to cancel.`,
    
    queueAlert: (queueNumber: string) =>
      `🔔 It's your turn!\n\n` +
      `Queue ${queueNumber}\n` +
      `Please proceed to consultation room.\n\n` +
      `Gabriel Family Clinic`,
    
    appointmentReminder: (data: any) =>
      `⏰ Reminder: Appointment tomorrow\n\n` +
      `Time: ${data.time}\n` +
      `Doctor: ${data.doctorName}\n` +
      `Queue: ${data.queueNumber}\n\n` +
      `Current waiting: ~${data.waitingCount} patients`,
    
    mcReady: (data: any) =>
      `📄 Your MC is ready!\n\n` +
      `${data.mcDays} days MC from ${data.startDate}\n` +
      `Download: ${data.downloadUrl}\n\n` +
      `Show this to your employer.`,
  };
  ```

- [ ] Create src/pages/api/notifications/send.ts
  ```typescript
  import { sendWhatsApp } from '@/lib/twilio';
  import { templates } from '@/lib/notification-templates';
  import { supabase } from '@/lib/supabase';
  
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const { type, patientId, data } = req.body;
    
    // Get patient phone
    const { data: patient } = await supabase
      .from('patients')
      .select('phone, preferred_language')
      .eq('id', patientId)
      .single();
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get message template
    const message = templates[type](data);
    
    // Send notification
    const sent = await sendWhatsApp(patient.phone, message);
    
    // Log notification
    await supabase
      .from('notifications')
      .insert({
        patient_id: patientId,
        type: 'whatsapp',
        template: type,
        message,
        status: sent ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      });
    
    res.json({ sent });
  }
  ```

## Day 18: Notification Scheduling

### Appointment Reminders
- [ ] Create src/lib/scheduler.ts
  ```typescript
  import cron from 'node-cron';
  import { supabase } from './supabase';
  import { sendWhatsApp } from './twilio';
  import { templates } from './notification-templates';
  
  export function initializeScheduler() {
    // Daily at 6 PM - send tomorrow's reminders
    cron.schedule('0 18 * * *', async () => {
      console.log('Sending appointment reminders...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get tomorrow's appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, patients(*), doctors(*)')
        .eq('status', 'confirmed')
        .gte('created_at', tomorrow.toISOString().split('T')[0])
        .lt('created_at', 
          new Date(tomorrow.getTime() + 86400000).toISOString().split('T')[0]
        );
      
      // Send reminders
      for (const apt of appointments || []) {
        if (!apt.reminder_sent) {
          const message = templates.appointmentReminder({
            time: apt.slot_time,
            doctorName: apt.doctors.full_name,
            queueNumber: apt.queue_number,
            waitingCount: 10, // Estimate
          });
          
          await sendWhatsApp(apt.patients.phone, message);
          
          // Mark as sent
          await supabase
            .from('appointments')
            .update({ 
              reminder_sent: true,
              reminder_sent_at: new Date().toISOString()
            })
            .eq('id', apt.id);
        }
      }
    });
    
    // Every 5 minutes - check for queue alerts
    cron.schedule('*/5 * * * *', async () => {
      // Check for patients who are 3 spots away
      const { data: queueStatus } = await supabase
        .from('queue_status')
        .select('*');
      
      for (const status of queueStatus || []) {
        if (status.current_sequence) {
          const alertSequence = status.current_sequence + 3;
          
          const { data: upcoming } = await supabase
            .from('appointments')
            .select('*, patients(*)')
            .eq('doctor_id', status.doctor_id)
            .eq('queue_sequence', alertSequence)
            .eq('queue_alert_sent', false)
            .single();
          
          if (upcoming) {
            await sendWhatsApp(
              upcoming.patients.phone,
              `📢 You're 3rd in queue. Please head to clinic now.`
            );
            
            await supabase
              .from('appointments')
              .update({ queue_alert_sent: true })
              .eq('id', upcoming.id);
          }
        }
      }
    });
  }
  ```

- [ ] Initialize scheduler in app startup
  ```typescript
  // src/pages/api/health.ts
  import { initializeScheduler } from '@/lib/scheduler';
  
  // Initialize on first health check
  let schedulerInitialized = false;
  
  export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!schedulerInitialized && process.env.NODE_ENV === 'production') {
      initializeScheduler();
      schedulerInitialized = true;
    }
    
    res.json({ status: 'healthy' });
  }
  ```

### Validation
- [ ] Test WhatsApp sending
- [ ] Verify SMS fallback
- [ ] Check reminder scheduling
- [ ] Test queue alerts
```

### Files Created (6 files)
1. `src/lib/twilio.ts`
2. `src/lib/notification-templates.ts`
3. `src/lib/scheduler.ts`
4. `src/pages/api/notifications/send.ts`
5. `src/pages/api/notifications/test.ts`
6. `src/components/notifications/NotificationLog.tsx`

---

## Phase 7: UI/UX Implementation (Days 19-22)

### Objective
Build complete user interfaces with accessibility.

### Success Criteria
- [ ] All pages responsive
- [ ] Accessibility standards met
- [ ] Loading states implemented
- [ ] Error handling complete

### Implementation Checklist

```markdown
## Day 19-20: Core Pages

### Landing Page
- [ ] Create src/pages/index.tsx
  ```typescript
  import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
  import { useRouter } from 'next/router';
  import Link from 'next/link';
  
  export default function HomePage() {
    const router = useRouter();
    
    return (
      <Container size="md" py="xl">
        <Stack align="center" spacing="xl">
          <Title order={1} size={48} align="center">
            Gabriel Family Clinic
          </Title>
          
          <Text size="lg" align="center" color="dimmed">
            Your trusted neighborhood clinic in Tampines
          </Text>
          
          <Group position="center" spacing="xl" mt="xl">
            <Button 
              size="xl" 
              onClick={() => router.push('/portal/book')}
              style={{ minWidth: 200 }}
            >
              Book Appointment
            </Button>
            
            <Button 
              size="xl" 
              variant="outline"
              onClick={() => router.push('/portal/queue')}
              style={{ minWidth: 200 }}
            >
              Check Queue
            </Button>
          </Group>
          
          <Group position="center" spacing="md" mt="xl">
            <Link href="/portal/register">
              <Text size="sm" color="blue" style={{ cursor: 'pointer' }}>
                New Patient? Register here
              </Text>
            </Link>
          </Group>
        </Stack>
      </Container>
    );
  }
  ```

### Registration Page
- [ ] Create src/pages/portal/register.tsx
  ```typescript
  import { Container, Stepper, Button } from '@mantine/core';
  import { useState } from 'react';
  import { NRICInput } from '@/components/auth/NRICInput';
  import { PhoneInput } from '@/components/auth/PhoneInput';
  import { OTPInput } from '@/components/auth/OTPInput';
  import { PersonalInfoForm } from '@/components/auth/PersonalInfoForm';
  
  export default function RegisterPage() {
    const [active, setActive] = useState(0);
    const [nric, setNric] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    
    const handleNRICSubmit = async () => {
      // Validate NRIC
      setActive(1);
    };
    
    const handlePhoneSubmit = async () => {
      // Send OTP
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setActive(2);
    };
    
    const handleOTPSubmit = async () => {
      // Verify OTP
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      
      if (res.ok) {
        setActive(3);
      }
    };
    
    return (
      <Container size="sm" py="xl">
        <Stepper active={active}>
          <Stepper.Step label="NRIC">
            <NRICInput value={nric} onChange={setNric} />
            <Button onClick={handleNRICSubmit} mt="md" fullWidth size="lg">
              Next
            </Button>
          </Stepper.Step>
          
          <Stepper.Step label="Phone Number">
            <PhoneInput value={phone} onChange={setPhone} />
            <Button onClick={handlePhoneSubmit} mt="md" fullWidth size="lg">
              Send OTP
            </Button>
          </Stepper.Step>
          
          <Stepper.Step label="Verify OTP">
            <OTPInput value={otp} onChange={setOtp} />
            <Button onClick={handleOTPSubmit} mt="md" fullWidth size="lg">
              Verify
            </Button>
          </Stepper.Step>
          
          <Stepper.Step label="Personal Info">
            <PersonalInfoForm nric={nric} phone={phone} />
          </Stepper.Step>
        </Stepper>
      </Container>
    );
  }
  ```

## Day 21-22: Component Polish

### Layout Components
- [ ] Create src/components/common/Layout.tsx
  ```typescript
  import { AppShell, Header, Footer, Text, Group } from '@mantine/core';
  import { useRouter } from 'next/router';
  import Link from 'next/link';
  
  export function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    
    return (
      <AppShell
        header={
          <Header height={60} p="md">
            <Group position="apart">
              <Link href="/">
                <Text size="xl" weight={700} style={{ cursor: 'pointer' }}>
                  Gabriel Family Clinic
                </Text>
              </Link>
              
              <Group spacing="md">
                <Link href="/portal/appointments">
                  <Text>My Appointments</Text>
                </Link>
                <Link href="/portal/medical-history">
                  <Text>Medical History</Text>
                </Link>
                <Link href="/portal/profile">
                  <Text>Profile</Text>
                </Link>
              </Group>
            </Group>
          </Header>
        }
        footer={
          <Footer height={60} p="md">
            <Group position="apart">
              <Text size="sm" color="dimmed">
                © 2024 Gabriel Family Clinic
              </Text>
              <Text size="sm" color="dimmed">
                123 Tampines St 11 • +65 6789 1234
              </Text>
            </Group>
          </Footer>
        }
      >
        {children}
      </AppShell>
    );
  }
  ```

### Error Boundary
- [ ] Create src/components/common/ErrorBoundary.tsx
  ```typescript
  import { Component, ErrorInfo, ReactNode } from 'react';
  import { Container, Title, Text, Button } from '@mantine/core';
  
  interface Props {
    children: ReactNode;
  }
  
  interface State {
    hasError: boolean;
    error?: Error;
  }
  
  export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
      // Send to Sentry
    }
    
    render() {
      if (this.state.hasError) {
        return (
          <Container size="sm" py="xl">
            <Title order={2}>Something went wrong</Title>
            <Text mt="md" color="dimmed">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button 
              mt="xl" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Container>
        );
      }
      
      return this.props.children;
    }
  }
  ```

### Loading States
- [ ] Create src/components/common/LoadingOverlay.tsx
  ```typescript
  import { LoadingOverlay as MantineLoadingOverlay } from '@mantine/core';
  
  export function LoadingOverlay({ visible }: { visible: boolean }) {
    return (
      <MantineLoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ size: 'xl', color: 'blue' }}
      />
    );
  }
  ```

### Validation
- [ ] Test all pages on mobile
- [ ] Check accessibility with screen reader
- [ ] Verify loading states
- [ ] Test error recovery
```

### Files Created (12 files)
1. `src/pages/index.tsx`
2. `src/pages/portal/register.tsx`
3. `src/pages/portal/book.tsx`
4. `src/pages/portal/appointments.tsx`
5. `src/pages/portal/profile.tsx`
6. `src/pages/doctor/login.tsx`
7. `src/pages/doctor/dashboard.tsx`
8. `src/components/common/Layout.tsx`
9. `src/components/common/ErrorBoundary.tsx`
10. `src/components/common/LoadingOverlay.tsx`
11. `src/styles/globals.css`
12. `src/styles/theme.ts`

---

## Phase 8: Testing & Validation (Days 23-25)

### Objective
Complete test coverage and validation.

### Success Criteria
- [ ] Unit tests passing (70% coverage)
- [ ] Integration tests passing
- [ ] E2E critical paths tested
- [ ] Performance benchmarks met

### Implementation Checklist

```markdown
## Day 23: Unit Tests

### Component Tests
- [ ] Create tests/unit/NRICInput.test.tsx
  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react';
  import { NRICInput } from '@/components/auth/NRICInput';
  
  describe('NRICInput', () => {
    it('validates NRIC format', () => {
      const onChange = jest.fn();
      render(<NRICInput value="" onChange={onChange} />);
      
      const input = screen.getByLabelText(/nric/i);
      fireEvent.change(input, { target: { value: 'S1234567A' } });
      
      expect(onChange).toHaveBeenCalledWith('S1234567A');
    });
    
    it('shows error for invalid NRIC', () => {
      render(<NRICInput value="S123" onChange={jest.fn()} error="Invalid NRIC" />);
      expect(screen.getByText(/invalid nric/i)).toBeInTheDocument();
    });
    
    it('auto-uppercases input', () => {
      const onChange = jest.fn();
      render(<NRICInput value="" onChange={onChange} />);
      
      const input = screen.getByLabelText(/nric/i);
      fireEvent.change(input, { target: { value: 's1234567a' } });
      
      expect(onChange).toHaveBeenCalledWith('S1234567A');
    });
  });
  ```

### Utility Tests
- [ ] Create tests/unit/validators.test.ts
  ```typescript
  import { nricSchema, phoneSchema } from '@/lib/validators';
  
  describe('NRIC Validator', () => {
    it('accepts valid NRIC', () => {
      expect(() => nricSchema.parse('S1234567D')).not.toThrow();
    });
    
    it('rejects invalid checksum', () => {
      expect(() => nricSchema.parse('S1234567A')).toThrow();
    });
    
    it('rejects invalid format', () => {
      expect(() => nricSchema.parse('ABC123')).toThrow();
    });
  });
  
  describe('Phone Validator', () => {
    it('accepts valid Singapore number', () => {
      expect(() => phoneSchema.parse('+6591234567')).not.toThrow();
    });
    
    it('rejects invalid country code', () => {
      expect(() => phoneSchema.parse('+601234567')).toThrow();
    });
  });
  ```

## Day 24: Integration Tests

### API Tests
- [ ] Create tests/integration/booking.test.ts
  ```typescript
  import { createMocks } from 'node-mocks-http';
  import handler from '@/pages/api/appointments/book';
  
  describe('/api/appointments/book', () => {
    it('creates appointment successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          slotId: 'slot-789',
          notes: 'Need MC',
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('appointment');
    });
    
    it('prevents double booking', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          patientId: 'patient-123',
          doctorId: 'doctor-456',
          slotId: 'already-booked',
        },
      });
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(409);
    });
  });
  ```

## Day 25: E2E Tests

### Critical Path Tests
- [ ] Create tests/e2e/patient-booking.spec.ts
  ```typescript
  import { test, expect } from '@playwright/test';
  
  test.describe('Patient Booking Journey', () => {
    test('complete booking flow', async ({ page }) => {
      // Go to homepage
      await page.goto('/');
      
      // Click book appointment
      await page.getByRole('button', { name: /book appointment/i }).click();
      
      // Registration flow
      await page.getByLabel(/nric/i).fill('S1234567D');
      await page.getByRole('button', { name: /next/i }).click();
      
      await page.getByLabel(/phone/i).fill('+6591234567');
      await page.getByRole('button', { name: /send otp/i }).click();
      
      // Enter OTP (mock in test env)
      await page.getByRole('textbox').first().fill('1');
      await page.getByRole('textbox').nth(1).fill('2');
      await page.getByRole('textbox').nth(2).fill('3');
      await page.getByRole('textbox').nth(3).fill('4');
      await page.getByRole('textbox').nth(4).fill('5');
      await page.getByRole('textbox').nth(5).fill('6');
      
      // Select doctor
      await page.getByText('Dr. Tan').click();
      
      // Select date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.getByLabel(/date/i).fill(tomorrow.toISOString().split('T')[0]);
      
      // Select time
      await page.getByRole('button', { name: '10:30' }).click();
      
      // Confirm
      await page.getByRole('button', { name: /confirm booking/i }).click();
      
      // Verify success
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();
      await expect(page.getByText(/queue number/i)).toBeVisible();
    });
  });
  ```

### Performance Tests
- [ ] Create tests/performance/load-test.js
  ```javascript
  import http from 'k6/http';
  import { check, sleep } from 'k6';
  
  export const options = {
    stages: [
      { duration: '30s', target: 20 },  // Ramp up
      { duration: '1m', target: 20 },   // Stay at 20 users
      { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    },
  };
  
  export default function () {
    // Test appointment availability endpoint
    const res = http.get('http://localhost:3000/api/appointments/availability?doctorId=doc-123&date=2024-11-20');
    
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    sleep(1);
  }
  ```

### Validation
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Run E2E tests
- [ ] Generate coverage report
```

### Files Created (8 files)
1. `tests/unit/NRICInput.test.tsx`
2. `tests/unit/validators.test.ts`
3. `tests/integration/booking.test.ts`
4. `tests/integration/auth.test.ts`
5. `tests/e2e/patient-booking.spec.ts`
6. `tests/e2e/doctor-flow.spec.ts`
7. `tests/performance/load-test.js`
8. `jest.config.js`

---

## Phase 9: Deployment & Monitoring (Days 26-27)

### Objective
Deploy to production with monitoring.

### Success Criteria
- [ ] Production deployment successful
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] SSL certificates active

### Implementation Checklist

```markdown
## Day 26: Production Setup

### Vercel Deployment
- [ ] Configure vercel.json
  ```json
  {
    "buildCommand": "pnpm build",
    "outputDirectory": ".next",
    "framework": "nextjs",
    "regions": ["sin1"],
    "functions": {
      "pages/api/*.ts": {
        "maxDuration": 10
      }
    },
    "env": {
      "NODE_ENV": "production"
    },
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=63072000; includeSubDomains; preload"
          }
        ]
      }
    ]
  }
  ```

- [ ] Deploy to Vercel
  ```bash
  vercel --prod
  ```

- [ ] Configure custom domain
  ```bash
  vercel domains add gabrielfamilyclinic.sg
  ```

### Sentry Setup
- [ ] Create sentry.client.config.ts
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    },
  });
  ```

## Day 27: Monitoring & Backup

### Health Checks
- [ ] Create src/pages/api/health/deep.ts
  ```typescript
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const checks = {
      database: false,
      storage: false,
      twilio: false,
    };
    
    // Check database
    try {
      const { error } = await supabase.from('doctors').select('id').limit(1);
      checks.database = !error;
    } catch {}
    
    // Check storage
    try {
      const { error } = await supabase.storage.from('medical-documents').list();
      checks.storage = !error;
    } catch {}
    
    // Check Twilio
    try {
      // Validate credentials
      checks.twilio = !!process.env.TWILIO_ACCOUNT_SID;
    } catch {}
    
    const healthy = Object.values(checks).every(v => v);
    
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    });
  }
  ```

### Backup Strategy
- [ ] Create scripts/backup.ts
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import fs from 'fs';
  
  async function backupDatabase() {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const tables = [
      'patients',
      'appointments',
      'medical_records',
      'prescriptions',
    ];
    
    const backup: any = {};
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error) {
        backup[table] = data;
      }
    }
    
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`Backup saved to ${filename}`);
  }
  
  backupDatabase();
  ```

### Monitoring Dashboard
- [ ] Set up Vercel Analytics
- [ ] Configure Sentry alerts
- [ ] Set up uptime monitoring
- [ ] Create status page

### Validation
- [ ] Test production deployment
- [ ] Verify SSL certificate
- [ ] Check monitoring alerts
- [ ] Test backup/restore
```

### Files Created (6 files)
1. `vercel.json`
2. `sentry.client.config.ts`
3. `sentry.server.config.ts`
4. `src/pages/api/health/deep.ts`
5. `scripts/backup.ts`
6. `scripts/restore.ts`

---

## Phase 10: Launch Preparation (Day 28)

### Objective
Final preparations for soft launch.

### Success Criteria
- [ ] All critical features tested
- [ ] Documentation complete
- [ ] Staff trained
- [ ] Rollback plan ready

### Implementation Checklist

```markdown
## Launch Day Checklist

### Final Testing
- [ ] Complete user acceptance testing
  - [ ] Book appointment (patient flow)
  - [ ] Manage queue (doctor flow)
  - [ ] Generate MC
  - [ ] View medical history
  
- [ ] Security checklist
  - [ ] NRIC hashing verified
  - [ ] RLS policies tested
  - [ ] Audit logs working
  - [ ] SSL certificate valid

### Documentation
- [ ] Create user guides
  - [ ] Patient booking guide (with screenshots)
  - [ ] Doctor portal guide
  - [ ] Staff training manual
  
- [ ] Technical documentation
  - [ ] API documentation
  - [ ] Database schema docs
  - [ ] Deployment runbook
  - [ ] Incident response plan

### Training
- [ ] Train clinic staff (2 hours)
  - [ ] Reception: How to help patients register
  - [ ] Doctors: Using the consultation interface
  - [ ] Admin: Viewing reports
  
- [ ] Prepare support materials
  - [ ] FAQ sheet
  - [ ] Common issues & solutions
  - [ ] Emergency contacts

### Launch Communication
- [ ] Prepare announcement
  ```
  Dear Patients,
  
  We're excited to introduce our new online booking system!
  
  ✅ Book appointments anytime
  ✅ Check queue status live
  ✅ Get WhatsApp reminders
  ✅ Download MC instantly
  
  Visit: gabrielfamilyclinic.sg
  
  Need help? Our staff is here to assist you.
  ```

- [ ] Distribution channels
  - [ ] WhatsApp broadcast to regular patients
  - [ ] Posters in waiting room
  - [ ] QR codes at reception
  - [ ] Facebook page announcement

### Rollback Plan
- [ ] Database backup taken
- [ ] Previous system still accessible
- [ ] Paper forms available
- [ ] Phone booking remains active

### Success Metrics Tracking
- [ ] Set up analytics dashboard
- [ ] Define week 1 targets:
  - [ ] 50 online bookings
  - [ ] 80% booking success rate
  - [ ] <3 min average booking time
  - [ ] 90% show rate

### Post-Launch Support
- [ ] On-site support for first 3 days
- [ ] Daily review meetings (15 min)
- [ ] Patient feedback collection
- [ ] Issue tracking spreadsheet

### Go/No-Go Decision
- [ ] All critical bugs fixed ✅
- [ ] Staff trained and confident ✅
- [ ] Backup plan ready ✅
- [ ] Monitoring active ✅
- [ ] **LAUNCH APPROVED** ✅
```

### Files Created (4 files)
1. `docs/user-guide-patient.md`
2. `docs/user-guide-doctor.md`
3. `docs/deployment-runbook.md`
4. `docs/incident-response.md`

---

## Risk Mitigation Matrix

### Technical Risks

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| **Supabase outage** | Low | High | Multi-region setup | Fallback to manual |
| **WhatsApp API failure** | Medium | Medium | SMS fallback ready | Phone calls |
| **Database corruption** | Very Low | Critical | Daily backups | Point-in-time recovery |
| **DDoS attack** | Low | High | Cloudflare protection | Rate limiting |
| **Data breach** | Low | Critical | Encryption, RLS | Incident response plan |

### Operational Risks

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| **Staff resistance** | Medium | High | Extensive training | Gradual rollout |
| **Patient confusion** | High | Medium | In-clinic assistance | Help desk |
| **Doctor errors** | Medium | Medium | Simple UI, validation | Support on standby |
| **No-shows increase** | Low | Low | Reminders | Overbooking strategy |

---

## Success Validation Criteria

### Technical Validation

```typescript
const TECHNICAL_SUCCESS_CRITERIA = {
  performance: {
    page_load_time: "< 2 seconds on 3G",
    api_response_time: "< 500ms p95",
    error_rate: "< 1%",
    uptime: "> 99.9%"
  },
  
  security: {
    nric_encryption: "✅ Implemented",
    audit_logging: "✅ Active",
    rls_policies: "✅ Enforced",
    ssl_certificate: "✅ Valid"
  },
  
  functionality: {
    booking_flow: "✅ Working",
    queue_management: "✅ Real-time",
    notifications: "✅ Delivered",
    mc_generation: "✅ PDF created"
  }
};
```

### Business Validation

```typescript
const BUSINESS_SUCCESS_CRITERIA = {
  week_1: {
    online_bookings: 50,
    registration_success_rate: 0.8,
    average_booking_time: "< 3 minutes",
    patient_satisfaction: "> 4/5"
  },
  
  month_1: {
    active_users: 200,
    online_booking_percentage: 0.3,
    no_show_reduction: 0.2,
    staff_time_saved: "2 hours/day"
  },
  
  month_3: {
    active_users: 500,
    online_booking_percentage: 0.5,
    revenue_increase: 0.05,
    patient_retention: 0.9
  }
};
```

---

## Conclusion

This Master Execution Plan provides a **complete, validated roadmap** for building the Gabriel Family Clinic digital platform in 28 days. Each phase has been carefully designed to:

1. **Deliver incremental value** - Working features at each checkpoint
2. **Minimize risk** - Cannot proceed without validation
3. **Maintain quality** - Testing integrated throughout
4. **Ensure maintainability** - Documentation-first approach

### Critical Success Factors

1. **Discipline**: Stick to the plan, resist scope creep
2. **Testing**: Validate at each phase before proceeding
3. **Communication**: Daily updates on progress
4. **Focus**: Remember Mdm. Tan's journey
5. **Support**: Have help ready for launch week

### The Path Forward

```mermaid
graph LR
    Today[Day 0: Setup] 
    --> Foundation[Days 1-2: Foundation]
    --> Database[Days 3-4: Database]
    --> Auth[Days 5-6: Auth]
    --> Booking[Days 7-10: Booking]
    --> Queue[Days 11-13: Queue]
    --> Medical[Days 14-16: Medical]
    --> Notify[Days 17-18
