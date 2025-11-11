Love this brief. Let’s treat this landing page as a “design beacon” for the whole project: beautiful, senior-friendly, fast, and aligned with the PAD/PRD.

We’ll:

1) Meticulously plan:
   - Overall goals and constraints.
   - Files to create.
   - Structure, content, behavior.
2) Define a checklist for each file.
3) Validate alignment with:
   - PRD (patient-first, neighborhood-first).
   - PAD (Next.js + Mantine + Shadcn-style + Tailwind utility layer).
   - Master_Execution_Plan (simplicity, accessibility).
4) Then implement:
   - `static/index.html`
   - `static/styles/globals.css` (importing and compatible with our main `src/styles/globals.css`)
   - `static/js/landing.js`

Note:
- This is a static mockup: no real Supabase, no real auth. But visually “production-level”.
- You asked to:
  - Use Google Fonts.
  - Use Shadcn-UI components style.
  - Use the `globals.css` concept we already defined.
  - Keep JS in a separate file for performance and adaptability.

I’ll keep everything framework-agnostic (pure HTML/CSS/JS), but design the structure so it maps nicely to your Next.js/Design System later.

--------------------
Layer 1: Meticulous Plan
--------------------

A. Objectives for the Static Landing Page

- Visually represent:
  - Gabriel Family Clinic brand: trustworthy, warm, modern.
  - “One clinic, one simple system, one happy patient.”
- UX goals:
  - Large, clear typography (elderly-friendly).
  - High contrast, clean layout.
  - Prominent CTAs:
    - “Book an Appointment”
    - “View Queue & Updates”
    - “Staff Login”
- Technical goals:
  - Single static HTML page.
  - Shared styles with our app’s `globals.css` philosophy.
  - Use Shadcn-inspired component classes (cards, buttons, sections).
  - Minimal JS in separate file:
    - Smooth scroll.
    - Mobile nav toggle.
    - Light interactive touches (no heavy frameworks).

B. Files To Create

We’ll create a small `static/` directory as a design artifact:

1) `static/index.html`
2) `static/styles/globals.css`
3) `static/js/landing.js`

(You can later adapt this into `src/pages/index.tsx` + CSS.)

C. Detailed Plan per File

1) `static/index.html`

Purpose:
- The main landing page mockup.

Content/Sections:

- Head:
  - `<title>Gabriel Family Clinic</title>`
  - Meta viewport.
  - Meta description.
  - Google Fonts:
    - “Inter” for body.
    - “DM Sans” or “Nunito” for headings (friendly).
  - Link `static/styles/globals.css`.
  - No inline JS other than `defer` script tag.

- Body structure:

  - Sticky top navigation:
    - Logo text: “Gabriel Family Clinic”
    - Links:
      - “Home”
      - “Why Us”
      - “How It Works”
      - “For Seniors”
      - “Contact”
    - Right-side CTA: “Book Now”
    - Mobile hamburger toggling.

  - Hero section:
    - Left:
      - H1: “Clinic care, made simple for everyone.”
      - Supporting text with emphasis on seniors / caregivers.
      - Primary CTA: “Book an Appointment”
      - Secondary CTA: “View Today’s Queue”
    - Right:
      - A Shadcn-style “card” mockup:
        - Simulated booking widget (Doctor select, Date, Time, Confirm button).
        - Shows the visual tone of final app.

  - “Why Gabriel Family Clinic” section:
    - 3–4 feature cards:
      - “Senior-friendly online booking”
      - “Real-time queue updates”
      - “Built with privacy and safety in mind”

  - “How It Works” (3-step timeline):
    - Step 1: Tap “Book” on your phone.
    - Step 2: Receive confirmation & queue updates.
    - Step 3: See doctor with less waiting.

  - “For Seniors & Families”:
    - Large text.
    - Bulleted benefits.
    - Icons/emphasis via simple shapes (no bundles).

  - “For Our Clinic Team”:
    - Explains staff portal and simple queue view.

  - “Call-to-Action” band:
    - Big button: “Start Booking in Under 2 Minutes”.

  - Footer:
    - Clinic address, phone.
    - Simple nav.
    - Copyright.

Styling approach:
- Tailwind/Shadcn-inspired utility classes baked into CSS:
  - Buttons:
    - `btn`, `btn-primary`, `btn-outline`.
  - Cards:
    - `card`, `card-elevated`.
  - Layout helpers:
    - `container`, `section`, `grid`, etc.

Accessibility:
- High contrast.
- Clear focus states.
- Large targets for CTAs.

Checklist for `index.html`:
- [ ] Includes proper meta tags and fonts.
- [ ] References `styles/globals.css` and `js/landing.js`.
- [ ] Uses semantic HTML (header, main, section, footer).
- [ ] Visually matches PAD tone: warm, modern, trusted, senior-friendly.
- [ ] CTAs clearly visible and logically placed.

2) `static/styles/globals.css`

Purpose:
- Standalone CSS for this static mockup.
- Compatible conceptually with `src/styles/globals.css`:
  - Similar variables/colors/typography.
- Provide Shadcn-style utility/component classes.

Content plan:

- CSS Reset / base:
  - Box-sizing.
  - Body font, background, text color.
- Color palette:
  - Primary: #2563eb / #3b82f6 (clinic blue).
  - Accent green.
  - Soft background (#f9fafb).
- Typography:
  - `body` → Inter.
  - `h1,h2,h3` → DM Sans.
- Core utilities:
  - `.container`
  - `.section`
  - `.grid`
  - `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`
  - `.card`, `.card-elevated`
  - `.badge`, `.tag`
- Layout:
  - Responsive nav.
  - Mobile-first hero.
- Transitions:
  - Subtle hover/focus, no heavy animations.

Checklist for `globals.css`:
- [ ] No framework-specific dependencies.
- [ ] Matches branding and accessibility goals.
- [ ] Supplies the classes used in `index.html`.
- [ ] Simple enough to port into Next.js later.

3) `static/js/landing.js`

Purpose:
- Keep HTML static; JS only enhances UX.

Behaviors:

- Mobile nav toggle:
  - On small screens, hamburger toggles nav links visibility.
- Smooth scrolling:
  - For internal anchor links (#why, #how, etc).
- CTA enhancements:
  - Hook “Book Now” hero button to scroll to a “mock booking” section.
- No heavy dependencies:
  - Pure vanilla JS
