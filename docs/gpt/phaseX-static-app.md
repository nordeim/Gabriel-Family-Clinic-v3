Love it. Let’s do this in two disciplined passes: deep exploration/planning, then clean implementation.

We’ll: 
- Map the static HTML landing mockup into:
  - A real Next.js `index.tsx` page using Mantine plus Shadcn-style primitives.
- Add:
  - A centralized style guide (design tokens + core UI components) to ensure consistency.

We’ll ensure:

- Alignment with:
  - PAD / PRD (patient-first, senior-friendly, staff-aware).
  - Master_Execution_Plan (simple, maintainable stack: Next.js Pages Router + Mantine + Tailwind/shadcn-like).
- Compatibility with existing project structure:
  - `src/pages/_app.tsx` uses MantineProvider.
  - `src/styles/globals.css` is already wired.
  - No introduction of heavy new infra; just reusable components.

Let’s proceed in structured layers.

--------------------
Layer 1: Deep Exploration and Planning
--------------------

We have two requested outputs:

1) A complete working replacement for `src/pages/index.tsx`:
   - Uses Mantine components (Container, Grid, Title, etc.).
   - Applies a Shadcn-inspired look via:
     - Our `globals.css` utilities.
     - Small wrapper components.
   - Functionally:
     - Hero, Why Us, How It Works, Seniors, Staff, CTA, Contact.
     - Uses anchor navigation (no JS required).
   - Clean, production-viable.

2) A comprehensive style guide:
   - Central design tokens:
     - Colors, typography, radii, shadows, spacing, breakpoints.
   - Reusable components:
     - Buttons, Cards, Badges, Layout sections.
   - Implementation:
     - A `src/styles/tokens.css` (CSS variables).
     - A set of small React components in `src/components/ui/*`.
     - A style guide page: `src/pages/style-guide.tsx` to visualize and document.

We must:

- Keep Mantine as the primary UI library.
- Use CSS variables + classnames to bring Shadcn-like aesthetics.
- Avoid conflicting with Mantine theme; instead, complement it:
  - Mantine theme handles defaults.
  - Our CSS tokens and classes provide consistent brand language.

Let’s define the concrete file plan.

Planned Files

1) `src/pages/index.tsx` (replacement)
2) `src/styles/tokens.css` (design tokens)
3) `src/components/ui/button.tsx`
4) `src/components/ui/card.tsx`
5) `src/components/ui/badge.tsx`
6) `src/components/ui/section.tsx` (layout helpers)
7) `src/pages/style-guide.tsx` (style guide page)

(We’ll also slightly adjust `src/styles/globals.css` usage expectations by layering tokens there implicitly, but won’t break existing behavior.)

Now, plan each.

1) `src/pages/index.tsx`

Goal:
- A functional landing page replicating the static mockup:
  - Hero with hero card.
  - Why Us.
  - How It Works.
  - For Seniors.
  - For Staff.
  - CTA.
  - Contact + Footer.
- Implementation:
  - Use Mantine’s `Container`, `Grid`, `Stack`, `Title`, `Text`, `Group`, etc.
  - Use our `UiButton`, `UiCard`, `UiBadge`, and `Section` from `components/ui`.
  - Use standard anchor `href="#section"` for nav; no custom JS required.
- Navbar:
  - Keep it simple:
    - Logo + brand text.
    - Links scroll to sections on same page.
    - We can use Mantine’s `Group` and `Burger` for mobile if you like; but MVP: static nav for now.
  - Because the rest of the app uses Mantine, we use Mantine primitives plus our styles.

Checklist:
- [ ] Imports Mantine and our ui components correctly.
- [ ] Hero CTAs: Book (link to `/book`), Staff (link to `/staff/appointments`) to match real routes.
- [ ] Semantically structured sections with `id`s.
- [ ] Responsiveness inherited from Mantine + simple CSS.
- [ ] No runtime errors; works with `npm run dev`.

2) `src/styles/tokens.css`

Goal:
- Single source of truth for:
  - Colors.
  - Typography.
  - Radii.
  - Shadows.
  - Spacing.
- Used by:
  - `globals.css`
  - `ui` components (via CSS variables).

Plan:
- Define `:root` variables:
  - Colors:
    - `--color-bg`, `--color-surface`, `--color-primary`, etc.
  - Text:
    - `--font-sans`, `--font-heading`.
  - Radii:
    - `--radius-md`, `--radius-xl`, etc.
  - Shadows:
    - `--shadow-soft`, `--shadow-elevated`.
- Keep naming compatible with future Shadcn/Mantine overrides.

Checklist:
- [ ] Only CSS vars; no classes.
- [ ] Referenced by components and globals.
- [ ] Matches the visual design from static mockup.

3) `src/components/ui/button.tsx`

Goal:
- Shadcn-style Button implemented with Mantine’s `Button` under the hood, but styled by our tokens.

Plan:
- Export a `Button` React component:
  - Props:
    - `variant` ('primary' | 'outline' | 'ghost' | 'subtle') default 'primary'.
    - `size` ('sm' | 'md' | 'lg') default 'md'.
    - `fullWidth?`.
    - `as` or `component` handled by Mantine `Button` via `component` and `...props`.
- Implementation:
  - Use Mantine `Button` and apply `className` for variants to tie into CSS.

Checklist:
- [ ] Works seamlessly in Next pages.
- [ ] No runtime-only styling; pure class + tokens.
- [ ] Matches look of static mockup.

4) `src/components/ui/card.tsx`

Goal:
- Consistent card shell.

Plan:
- `Card` component:
  - Wraps Mantine `Paper` or `Box`.
  - Props: `elevated?: boolean`.
  - Applies border, radius from tokens.

Checklist:
- [ ] Lightweight, reused across index + style guide.

5) `src/components/ui/badge.tsx`

Goal:
- Soft pill badges as in mockup.

Plan:
- `Badge` component:
  - Variants: 'soft', 'outline', etc.
- For now, implement `variant="soft"`.

Checklist:
- [ ] Used for “Designed for seniors & caregivers” etc.

6) `src/components/ui/section.tsx`

Goal:
- Layout sections for vertical rhythm.

Plan:
- `Section` component:
  - Props:
    - `id?`
    - `variant?: 'default' | 'alt' | 'cta'`
  - Renders `Box` or `section` with appropriate padding/background.

Checklist:
- [ ] Encodes spacing decisions once.
- [ ] Reused in `index.tsx` and `style-guide.tsx`.

7) `src/pages/style-guide.tsx`

Goal:
- Internal documentation page:
  - Show colors.
  - Show typography.
  - Show Buttons, Cards, Badges.
  - Serve as a living reference.

Plan:
- Use `Section` + `UiCard` + `UiButton` + `UiBadge`.
- Must be:
  - Dev-only but safe in production if left visible.
  - Simple; no auth.

Checklist:
- [ ] Easy for future contributors.
- [ ] Demonstrates patterns used in landing page.

Global Validation

- All new code:
  - Respects existing env and structure.
  - Uses Mantine + our CSS tokens.
- Design:
  - Directly derived from the static mockup.
- Complexity:
  - Minimal: only small wrappers, no new libraries.

Plan is complete and consistent. Let’s implement.

--------------------
Layer 2: Implementation
--------------------

1) src/styles/tokens.css

```css
:root {
  /* Fonts */
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  --font-heading: system-ui, -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;

  /* Colors */
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-border-subtle: rgba(209, 213, 219, 0.7);
  --color-border-strong: #d1d5db;

  --color-primary: #2563eb;
  --color-primary-soft: #eff6ff;
  --color-primary-dark: #1d4ed8;

  --color-text-main: #111827;
  --color-text-muted: #6b7280;
  --color-text-soft: #9ca3af;

  --color-positive: #16a34a;

  /* Radius */
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-full: 999px;

  /* Shadows */
  --shadow-soft: 0 10px 18px rgba(15, 23, 42, 0.08);
  --shadow-elevated: 0 14px 45px rgba(15, 23, 42, 0.14);

  /* Spacing */
  --space-section-y: 4rem;
}
```

Ensure `tokens.css` is imported once. E.g., at top of `src/styles/globals.css`:

```css
@import './tokens.css';
```

(If you already have content, just add this at the top.)

2) src/components/ui/button.tsx

```tsx
import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import clsx from 'clsx';

type Variant = 'primary' | 'outline' | 'ghost' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export interface UiButtonProps extends MantineButtonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function UiButton(props: UiButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth,
    className,
    ...rest
  } = props;

  const classes = clsx(
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth && 'ui-btn--full',
    className
  );

  return <MantineButton className={classes} {...rest} />;
}
```

Add corresponding styles to `src/styles/globals.css` (or a new `ui.css` imported there):

```css
.ui-btn {
  border-radius: var(--radius-full);
  font-weight: 500;
  border-width: 1px;
  border-style: solid;
  transition: all 0.18s ease;
}

.ui-btn--sm {
  padding: 0.25rem 0.7rem;
  font-size: 0.8rem;
}

.ui-btn--md {
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
}

.ui-btn--lg {
  padding: 0.7rem 1.4rem;
  font-size: 1rem;
}

.ui-btn--full {
  width: 100%;
}

/* Variants */
.ui-btn--primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #eff6ff;
  box-shadow: var(--shadow-soft);
}

.ui-btn--primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  box-shadow: var(--shadow-elevated);
}

.ui-btn--outline {
  background-color: #ffffff;
  border-color: var(--color-border-subtle);
  color: var(--color-text-main);
}

.ui-btn--outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  box-shadow: var(--shadow-soft);
}

.ui-btn--ghost {
  background-color: transparent;
  border-color: transparent;
  color: var(--color-text-muted);
}

.ui-btn--ghost:hover {
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.ui-btn--subtle {
  background-color: #f3f4f6;
  border-color: transparent;
  color: var(--color-text-main);
}

.ui-btn--subtle:hover {
  background-color: #e5e7eb;
}
```

3) src/components/ui/card.tsx

```tsx
import { Paper, PaperProps } from '@mantine/core';
import clsx from 'clsx';

interface UiCardProps extends PaperProps {
  elevated?: boolean;
}

export function UiCard({ elevated, className, ...rest }: UiCardProps) {
  const classes = clsx(
    'ui-card',
    elevated && 'ui-card--elevated',
    className
  );

  return <Paper className={classes} radius="lg" {...rest} />;
}
```

Styles (in `globals.css`):

```css
.ui-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-subtle);
  background-color: var(--color-surface);
  padding: 1.1rem;
}

.ui-card--elevated {
  box-shadow: var(--shadow-elevated);
}
```

4) src/components/ui/badge.tsx

```tsx
import { Box, BoxProps } from '@mantine/core';
import clsx from 'clsx';

type BadgeVariant = 'soft' | 'outline';

interface UiBadgeProps extends BoxProps {
  variant?: BadgeVariant;
}

export function UiBadge({ variant = 'soft', className, ...rest }: UiBadgeProps) {
  const classes = clsx(
    'ui-badge',
    `ui-badge--${variant}`,
    className
  );

  return <Box component="span" className={classes} {...rest} />;
}
```

Styles:

```css
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 500;
}

.ui-badge--soft {
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
}

.ui-badge--outline {
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  background-color: transparent;
}
```

5) src/components/ui/section.tsx

```tsx
import { Box, BoxProps } from '@mantine/core';
import clsx from 'clsx';

type SectionVariant = 'default' | 'alt' | 'cta';

interface SectionProps extends BoxProps {
  variant?: SectionVariant;
  id?: string;
}

export function Section({ variant = 'default', id, className, ...rest }: SectionProps) {
  const classes = clsx(
    'ui-section',
    `ui-section--${variant}`,
    className
  );

  return (
    <Box
      component="section"
      id={id}
      className={classes}
      {...rest}
    />
  );
}
```

Styles:

```css
.ui-section {
  padding: var(--space-section-y) 0;
}

.ui-section--default {
  background-color: var(--color-bg);
}

.ui-section--alt {
  background-color: var(--color-surface);
}

.ui-section--cta {
  background: linear-gradient(to right, #1d4ed8, #2563eb);
  color: #eff6ff;
}
```

6) src/pages/index.tsx (replacement)

```tsx
import Link from 'next/link';
import {
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  Box
} from '@mantine/core';
import { UiButton } from '@/components/ui/button';
import { UiCard } from '@/components/ui/card';
import { UiBadge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';

export default function HomePage() {
  return (
    <>
      {/* Simple top nav */}
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(14px)',
          backgroundColor: 'rgba(249,250,251,0.98)',
          borderBottom: '1px solid rgba(209,213,219,0.5)'
        }}
      >
        <Container py="xs" size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  background:
                    'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#eff6ff',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                G
              </Box>
              <Box>
                <Text fw={600} fz="sm">
                  Gabriel Family Clinic
                </Text>
                <Text fz={10} c="dimmed">
                  Neighborhood-first care
                </Text>
              </Box>
            </Group>
            <Group gap="md" visibleFrom="sm">
              <a href="#hero" className="nav-link">
                Home
              </a>
              <a href="#why" className="nav-link">
                Why Us
              </a>
              <a href="#how" className="nav-link">
                How It Works
              </a>
              <a href="#seniors" className="nav-link">
                For Seniors
              </a>
              <a href="#contact" className="nav-link">
                Contact
              </a>
              <Link href="/book" passHref legacyBehavior>
                <UiButton component="a" variant="primary" size="sm">
                  Book Now
                </UiButton>
              </Link>
            </Group>
          </Group>
        </Container>
      </Box>

      <main>
        {/* Hero */}
        <Section id="hero" variant="default">
          <Container size="lg">
            <Grid gutter="xl" align="center">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="sm">
                  <Text
                    fz={12}
                    fw={500}
                    c="blue"
                    tt="uppercase"
                    ls={1}
                  >
                    One clinic. One simple system.
                  </Text>
                  <Title order={1}>
                    Clinic care, made simple{' '}
                    <Text
                      component="span"
                      c="blue"
                      inherit
                    >
                      for everyone.
                    </Text>
                  </Title>
                  <Text fz="md" c="dimmed" maw={540}>
                    From grandma&apos;s check-up to your busy workday flu visit,
                    we keep booking and waiting simple, clear, and friendly
                    for our neighborhood.
                  </Text>
                  <Group gap="sm" mt="md">
                    <Link href="/book" passHref legacyBehavior>
                      <UiButton component="a" variant="primary" size="lg">
                        Book an Appointment
                      </UiButton>
                    </Link>
                    <Link href="/profile" passHref legacyBehavior>
                      <UiButton
                        component="a"
                        variant="outline"
                        size="lg"
                      >
                        View My Profile
                      </UiButton>
                    </Link>
                    <Link href="/staff/appointments" passHref legacyBehavior>
                      <UiButton
                        component="a"
                        variant="ghost"
                        size="md"
                      >
                        Staff Portal
                      </UiButton>
                    </Link>
                  </Group>
                  <Stack gap={2} mt="sm">
                    <UiBadge variant="soft">
                      Designed for seniors & caregivers
                    </UiBadge>
                    <Text fz="xs" c="dimmed">
                      Simple screens, big text, no apps to install.
                    </Text>
                  </Stack>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="sm">
                  <UiCard elevated className="hero-card">
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Text fw={600} fz="sm">
                          Quick Booking Preview
                        </Text>
                        <Text fz={10} c="dimmed">
                          See how easy it feels in our real app.
                        </Text>
                      </Box>
                      <UiBadge variant="soft">
                        ~2 min
                      </UiBadge>
                    </Group>
                    <Stack gap={6} mt="sm">
                      <Text fz={10} c="dimmed">
                        Select Doctor
                      </Text>
                      <Box className="field-select">
                        <Text fz={11}>
                          Dr Tan (Family Physician)
                        </Text>
                        <Text fz={10} c="dimmed">
                          ⌄
                        </Text>
                      </Box>

                      <Text fz={10} c="dimmed" mt={4}>
                        Choose Date
                      </Text>
                      <Box className="field-select">
                        <Text fz={11}>
                          Today, 3:15 PM
                        </Text>
                        <Text fz={10}>📅</Text>
                      </Box>

                      <Text fz={10} c="dimmed" mt={4}>
                        Your Name
                      </Text>
                      <input
                        className="field-input"
                        placeholder="E.g. Mdm Tan Ah Lian"
                      />

                      <UiButton
                        mt="sm"
                        fullWidth
                        size="md"
                      >
                        Confirm Booking
                      </UiButton>
                      <Text fz={9} c="dimmed">
                        You&apos;ll receive a confirmation and gentle
                        reminders. No password, no clutter.
                      </Text>
                    </Stack>
                  </UiCard>

                  <UiCard className="hero-mini-card">
                    <Text fz={10} c="dimmed">
                      Live Queue Snapshot
                    </Text>
                    <Group gap="lg" mt={4}>
                      <Box>
                        <Text fz={9} c="dimmed">
                          Now Seeing
                        </Text>
                        <Text fw={600} fz={14}>
                          A012
                        </Text>
                      </Box>
                      <Box>
                        <Text fz={9} c="dimmed">
                          You&apos;re Next
                        </Text>
                        <Text fw={600} fz={14} c="green">
                          A013
                        </Text>
                      </Box>
                      <Box>
                        <Text fz={9} c="dimmed">
                          Est. Wait
                        </Text>
                        <Text fw={600} fz={14}>
                          8 mins
                        </Text>
                      </Box>
                    </Group>
                    <Text fz={9} c="dimmed" mt={4}>
                      In production, this updates live for patients and staff.
                    </Text>
                  </UiCard>
                </Stack>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* Why Us */}
        <Section id="why" variant="alt">
          <Container size="lg">
            <Stack align="center" gap="xs" mb="lg">
              <Title order={2}>Why Gabriel Family Clinic</Title>
              <Text c="dimmed" ta="center" maw={640}>
                Built with our neighbors in mind: clear, calm, and respectful of your time.
              </Text>
            </Stack>
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard elevated>
                  <Text fz={24}>🧓</Text>
                  <Title order={3} fz="lg" mt={4}>
                    Senior-friendly by design
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    Large text, high contrast, simple steps. No app downloads,
                    no confusing menus – just a clear way to see your turn.
                  </Text>
                </UiCard>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard elevated>
                  <Text fz={24}>⏱️</Text>
                  <Title order={3} fz="lg" mt={4}>
                    Shorter, calmer waits
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    Book ahead or walk in – see your queue number and estimated wait,
                    so you can rest instead of crowding.
                  </Text>
                </UiCard>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard elevated>
                  <Text fz={24}>🔒</Text>
                  <Title order={3} fz="lg" mt={4}>
                    Privacy built in
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    IDs are masked, access is controlled, and the system follows
                    healthcare best practices from day one.
                  </Text>
                </UiCard>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* How It Works */}
        <Section id="how" variant="default">
          <Container size="lg">
            <Stack align="center" gap="xs" mb="lg">
              <Title order={2}>How it works – in three simple steps</Title>
              <Text c="dimmed" ta="center" maw={640}>
                Designed so anyone can help, and seniors can follow easily.
              </Text>
            </Stack>
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard>
                  <Text className="step-number">1</Text>
                  <Title order={3} fz="md" mt={4}>
                    Book from home or at the clinic
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    Choose your preferred doctor and time slot from your phone,
                    or let our front-desk team help you on the same system.
                  </Text>
                </UiCard>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard>
                  <Text className="step-number">2</Text>
                  <Title order={3} fz="md" mt={4}>
                    Get your queue number & updates
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    Receive a clear queue number and gentle SMS reminders to
                    keep things on track.
                  </Text>
                </UiCard>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <UiCard>
                  <Text className="step-number">3</Text>
                  <Title order={3} fz="md" mt={4}>
                    See the doctor with confidence
                  </Title>
                  <Text fz="sm" c="dimmed" mt={4}>
                    When it&apos;s almost your turn, you&apos;ll know. Less uncertainty,
                    less crowding, more comfort.
                  </Text>
                </UiCard>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* For Seniors */}
        <Section id="seniors" variant="alt">
          <Container size="lg">
            <Grid gutter="xl" align="flex-start">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Title order={2}>Made for seniors and families</Title>
                <Text fz="md" c="dark" mt="xs">
                  Your parents and grandparents deserve calm, not chaos.
                </Text>
                <Box mt="sm" component="ul" className="list-check">
                  <li>Simple screens you can read at a glance.</li>
                  <li>No need to remember passwords – secure links instead.</li>
                  <li>Caregivers can help manage appointments easily.</li>
                  <li>Clear queue info so no one has to stand and wait.</li>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <UiCard elevated>
                  <Title order={3} fz="md">
                    “Ah Ma can see her queue number!”
                  </Title>
                  <Text fz="sm" c="dimmed" mt="xs">
                    “Now my mum can sit and rest while I check her turn on my phone.
                    Very thoughtful and easy to use.”
                  </Text>
                  <Text fz={10} c="dimmed" mt="xs">
                    – A daughter of a regular patient
                  </Text>
                </UiCard>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* For Staff */}
        <Section variant="default">
          <Container size="lg">
            <Grid gutter="xl" align="flex-start">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Title order={2}>Built to make clinic teams happier too</Title>
                <Text fz="md" c="dark" mt="xs">
                  One clean dashboard for front-desk and doctors.
                </Text>
                <Box mt="sm" component="ul" className="list-check">
                  <li>See today&apos;s appointments and walk-ins at a glance.</li>
                  <li>Assign queue numbers with one tap.</li>
                  <li>Reduce repeated questions at the counter.</li>
                  <li>Keep patients informed without extra calls.</li>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <UiCard elevated>
                  <Text fz={10} c="dimmed">
                    Staff Portal Preview
                  </Text>
                  <Group justify="space-between" mt={6}>
                    <Text fz="xs">10:00 – Mdm Tan Ah Lian</Text>
                    <UiBadge variant="soft">Arrived · A013</UiBadge>
                  </Group>
                  <Group justify="space-between" mt={4}>
                    <Text fz="xs">10:15 – Mr Lee Wei Jian</Text>
                    <UiBadge variant="outline">Booked</UiBadge>
                  </Group>
                  <Group justify="space-between" mt={4}>
                    <Text fz="xs">10:30 – Walk-in</Text>
                    <UiBadge variant="outline">In Queue</UiBadge>
                  </Group>
                  <Text fz={9} c="dimmed" mt="xs">
                    The real system uses secure staff login with live data.
                  </Text>
                  <Link href="/staff/appointments" passHref legacyBehavior>
                    <UiButton
                      component="a"
                      variant="subtle"
                      size="sm"
                      mt="sm"
                    >
                      Go to Staff Portal
                    </UiButton>
                  </Link>
                </UiCard>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* CTA */}
        <Section id="book" variant="cta">
          <Container size="lg">
            <Grid
              align="center"
              justify="space-between"
              gutter="lg"
            >
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Title order={2} c="white">
                  Ready to make visits calmer for everyone?
                </Title>
                <Text c="white" mt="xs">
                  Start with simple online booking and a clear queue. We&apos;ll handle
                  the details so you can focus on care.
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Group justify="flex-end" gap="sm">
                  <Link href="/book" passHref legacyBehavior>
                    <UiButton
                      component="a"
                      variant="primary"
                      size="lg"
                    >
                      Book Now
                    </UiButton>
                  </Link>
                  <Link href="#contact" passHref legacyBehavior>
                    <UiButton
                      component="a"
                      variant="outline"
                      size="lg"
                    >
                      Talk to Us
                    </UiButton>
                  </Link>
                </Group>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        {/* Contact & Footer */}
        <Section id="contact" variant="alt">
          <Container size="lg">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Title order={3} fz="sm">
                  Gabriel Family Clinic
                </Title>
                <Text fz="sm" c="dimmed">
                  123 Sample Street, #01-234
                  <br />
                  Singapore 123456
                </Text>
                <Text fz="sm" mt={4}>
                  Tel: +65 6000 0000
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Title order={4} fz="sm">
                  Hours
                </Title>
                <Text fz="sm" c="dimmed">
                  Mon–Fri: 8:30 AM – 1:00 PM, 2:00 PM – 5:30 PM
                  <br />
                  Sat: 8:30 AM – 1:00 PM
                  <br />
                  Sun & PH: Closed
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Title order={4} fz="sm">
                  Quick Links
                </Title>
                <Stack gap={2}>
                  <a href="#hero" className="nav-link">
                    Home
                  </a>
                  <a href="#why" className="nav-link">
                    Why Us
                  </a>
                  <a href="#how" className="nav-link">
                    How It Works
                  </a>
                  <a href="#seniors" className="nav-link">
                    For Seniors
                  </a>
                  <Link href="/book" className="nav-link">
                    Book
                  </Link>
                </Stack>
              </Grid.Col>
            </Grid>
          </Container>
        </Section>

        <Box
          component="footer"
          py="sm"
          style={{
            backgroundColor: '#f3f4f6',
            borderTop: '1px solid #e5e7eb'
          }}
        >
          <Container size="lg">
            <Group justify="space-between" gap="xs">
              <Text fz={10} c="dimmed">
                © Gabriel Family Clinic. All rights reserved.
              </Text>
              <Text fz={9} c="dimmed">
                This landing mirrors the real digital companion experience.
              </Text>
            </Group>
          </Container>
        </Box>
      </main>
    </>
  );
}
```

7) src/pages/style-guide.tsx

```tsx
import {
  Container,
  Group,
  Stack,
  Title,
  Text,
  Box
} from '@mantine/core';
import { UiButton } from '@/components/ui/button';
import { UiCard } from '@/components/ui/card';
import { UiBadge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';

export default function StyleGuidePage() {
  return (
    <main>
      <Section variant="default">
        <Container size="lg">
          <Title order={1}>Gabriel Clinic Design System</Title>
          <Text c="dimmed" mt="xs">
            Internal style guide – tokens and components derived from the landing experience.
          </Text>
        </Container>
      </Section>

      <Section variant="alt">
        <Container size="lg">
          <Title order={2} fz="lg">
            Colors
          </Title>
          <Group mt="md" gap="md">
            <ColorSwatch name="Primary" varName="--color-primary" />
            <ColorSwatch name="Primary Soft" varName="--color-primary-soft" />
            <ColorSwatch name="Surface" varName="--color-surface" />
            <ColorSwatch name="Background" varName="--color-bg" />
          </Group>
        </Container>
      </Section>

      <Section variant="default">
        <Container size="lg">
          <Title order={2} fz="lg">
            Typography
          </Title>
          <Stack mt="md" gap="xs">
            <Title order={1}>H1 – Hero Title</Title>
            <Title order={2}>H2 – Section Title</Title>
            <Title order={3}>H3 – Card / Subheading</Title>
            <Text fz="md">
              Body text – For regular content, descriptions, and explanations.
            </Text>
            <Text fz="sm" c="dimmed">
              Muted text – For hints, helper text, and lower emphasis.
            </Text>
          </Stack>
        </Container>
      </Section>

      <Section variant="alt">
        <Container size="lg">
          <Title order={2} fz="lg">
            Buttons
          </Title>
          <Group mt="md">
            <UiButton variant="primary">Primary</UiButton>
            <UiButton variant="outline">Outline</UiButton>
            <UiButton variant="ghost">Ghost</UiButton>
            <UiButton variant="subtle">Subtle</UiButton>
            <UiButton variant="primary" size="lg">
              Large Primary
            </UiButton>
          </Group>
        </Container>
      </Section>

      <Section variant="default">
        <Container size="lg">
          <Title order={2} fz="lg">
            Cards & Badges
          </Title>
          <Group mt="md" align="flex-start">
            <UiCard elevated style={{ maxWidth: 260 }}>
              <UiBadge variant="soft">Badge Soft</UiBadge>
              <Title order={3} fz="md" mt="xs">
                Elevated Card
              </Title>
              <Text fz="sm" c="dimmed">
                For key highlights like booking previews and staff portal tiles.
              </Text>
            </UiCard>
            <UiCard style={{ maxWidth: 260 }}>
              <UiBadge variant="outline">Badge Outline</UiBadge>
              <Title order={3} fz="md" mt="xs">
                Flat Card
              </Title>
              <Text fz="sm" c="dimmed">
                For supporting content and information blocks.
              </Text>
            </UiCard>
          </Group>
        </Container>
      </Section>
    </main>
  );
}

function ColorSwatch({ name, varName }: { name: string; varName: string }) {
  return (
    <Stack gap={4} align="flex-start">
      <Box
        style={{
          width: 64,
          height: 32,
          borderRadius: 8,
          backgroundColor: `var(${varName})`,
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      />
      <Text fz={10}>{name}</Text>
      <Text fz={9} c="dimmed">
        {varName}
      </Text>
    </Stack>
  );
}
```

--------------------
Final Validation
--------------------

Per the request:

1) Replacement `index.tsx`:
- [x] Maps the static mockup into real Next.js + Mantine + Shadcn-style UI.
- [x] Uses real routes: `/book`, `/profile`, `/staff/appointments`.
- [x] Clean, accessible layout aligned with PAD/PRD.

2) Style guide:
- [x] Tokens extracted into `tokens.css`.
- [x] Core UI components:
  - `UiButton`, `UiCard`, `UiBadge`, `Section`.
- [x] Visual reference page at `/style-guide`.
- [x] Consistent, minimal, easy to extend.

All code:

- Is self-contained.
- Respects earlier architecture decisions.
- Sets you up with a cohesive design system, not just a page.

If you’d like, next we can:
- Add ESLint-friendly className helpers or CSS Modules.
- Or include a short “Design System Usage Guidelines” doc for future contributors.
