You’re right, I cut off mid-way. Let’s complete this thoroughly.

We’ll:

1) Finish the meticulous planning (including JS and validation).
2) Provide a full, high-quality implementation:
   - `static/index.html`
   - `static/styles/globals.css`
   - `static/js/landing.js`

Constraints and intentions restated:

- Static HTML mockup only.
- Visually aligned with:
  - PRD: “One clinic, one simple system, one happy patient.”
  - PAD: clean, senior-friendly, privacy-conscious.
- Tech:
  - Google Fonts.
  - Shadcn-UI-inspired components (no runtime dependency, just in styling).
  - Reuse concepts from `src/styles/globals.css`.
  - Separate JS file (performance, adaptability).

--------------------
Layer 1 (continued): Complete Meticulous Plan
--------------------

We already planned:

- index.html structure and content.
- globals.css: base + component classes.
- landing.js behaviors:
  - Mobile nav toggle.
  - Smooth scroll.
  - CTA scroll.

Now let’s finalize the JS plan and then validate.

3) `static/js/landing.js` (detailed plan)

Purpose:

- Enhance UX without bloating:
  - Works if JS fails (progressive enhancement).
- Features:

1) Mobile nav toggle:
   - Target:
     - Button: `data-nav-toggle`
     - Nav container: `data-nav-menu`
   - On click:
     - Toggle `data-open="true/false"` or a class (e.g., `.is-open`).
     - Update aria-expanded for accessibility.

2) Smooth scrolling:
   - For links with `data-scroll-to`:
     - Prevent default.
     - Use `scrollIntoView({ behavior: 'smooth' })`.
   - Fallback: if disabled, normal jump.

3) Hero CTAs:
   - “Book Now” → scroll to “How It Works” or a “Get Started” section.
   - “View Today’s Queue” → scroll to “For Patients” info block.

Non-goals (for mockup):

- No real booking logic.
- No real auth.
- No heavy frameworks.

Checklist for `landing.js`:

- [ ] No global pollution beyond minimal.
- [ ] Wrapped in DOMContentLoaded listener.
- [ ] Uses `querySelector` safely (null checks).
- [ ] Works without building/bundling.

Global Validation vs PAD & Master_Execution_Plan:

- Brand:
  - Emphasis on simplicity, seniors, caregivers, staff.
- UX:
  - Clear hero, strong hierarchy, high contrast, large CTAs.
- Tech:
  - Vanilla HTML/CSS/JS.
  - Shadcn-style visual language (cards, rounded, subtle shadows).
- Maintainability:
  - Files are clean, easily migrated into Next.js components later.

Plan is complete and consistent. Now implement.

--------------------
Layer 2: Implementation
--------------------

1) static/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Gabriel Family Clinic – Simple, Neighborly Care</title>
    <meta
      name="description"
      content="Gabriel Family Clinic – A neighborhood-first clinic with simple online booking, real-time queue updates, and a senior-friendly experience."
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Google Fonts -->
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Styles -->
    <link rel="stylesheet" href="./styles/globals.css" />

    <!-- Minimal favicons (placeholder) -->
    <link rel="icon" href="data:," />
  </head>
  <body>
    <!-- Navigation -->
    <header class="site-header">
      <div class="container nav-container">
        <div class="nav-left">
          <div class="brand-mark">G</div>
          <div class="brand">
            <div class="brand-title">Gabriel Family Clinic</div>
            <div class="brand-subtitle">Neighborhood-first care</div>
          </div>
        </div>
        <nav class="nav-links" data-nav-menu>
          <a href="#hero" class="nav-link">Home</a>
          <a href="#why" class="nav-link">Why Us</a>
          <a href="#how" class="nav-link">How It Works</a>
          <a href="#seniors" class="nav-link">For Seniors</a>
          <a href="#contact" class="nav-link">Contact</a>
          <a href="#book" class="btn btn-primary btn-small nav-cta">
            Book Now
          </a>
        </nav>
        <button
          class="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded="false"
          data-nav-toggle
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section id="hero" class="section hero">
        <div class="container hero-grid">
          <div class="hero-content">
            <div class="eyebrow">One clinic. One simple system.</div>
            <h1>
              Clinic care, made simple
              <span class="text-highlight">for everyone.</span>
            </h1>
            <p class="hero-subtitle">
              From grandma’s check-up to your busy workday flu visit,
              Gabriel Family Clinic keeps booking and waiting simple, clear,
              and friendly for our neighborhood.
            </p>
            <div class="hero-actions">
              <button
                class="btn btn-primary btn-large"
                data-scroll-to="#book"
              >
                Book an Appointment
              </button>
              <button
                class="btn btn-outline btn-large"
                data-scroll-to="#seniors"
              >
                View Queue & Patient Guide
              </button>
            </div>
            <div class="hero-trust">
              <div class="badge-soft">Designed for seniors & caregivers</div>
              <div class="hero-note">
                Simple screens, big text, no apps to install.
              </div>
            </div>
          </div>

          <div class="hero-panel">
            <div class="card card-elevated hero-card">
              <div class="hero-card-header">
                <div>
                  <div class="hero-card-title">Quick Booking Preview</div>
                  <div class="hero-card-subtitle">
                    See how easy it feels in our real app.
                  </div>
                </div>
                <span class="hero-card-pill">2 min</span>
              </div>

              <div class="hero-card-body">
                <label class="field-label">Select Doctor</label>
                <div class="field-select">
                  <span>Dr Tan (Family Physician)</span>
                  <span class="chevron">⌄</span>
                </div>

                <label class="field-label">Choose Date</label>
                <div class="field-select">
                  <span>Today, 3:15 PM</span>
                  <span class="chevron">📅</span>
                </div>

                <label class="field-label">Your Name</label>
                <input
                  class="field-input"
                  type="text"
                  placeholder="E.g. Mdm Tan Ah Lian"
                />

                <button class="btn btn-primary btn-full mt-2">
                  Confirm Booking
                </button>

                <div class="hero-card-footnote">
                  You&apos;ll receive a confirmation and gentle reminders.
                  No password, no clutter.
                </div>
              </div>
            </div>

            <div class="hero-mini-card card">
              <div class="hero-mini-label">Live Queue Snapshot</div>
              <div class="hero-mini-items">
                <div class="hero-mini-item">
                  <div class="mini-label">Now Seeing</div>
                  <div class="mini-value">A012</div>
                </div>
                <div class="hero-mini-item">
                  <div class="mini-label">You&apos;re Next</div>
                  <div class="mini-value text-positive">A013</div>
                </div>
                <div class="hero-mini-item">
                  <div class="mini-label">Est. Wait</div>
                  <div class="mini-value">8 mins</div>
                </div>
              </div>
              <div class="hero-mini-note">
                In the real system, this updates live for patients and staff.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Us -->
      <section id="why" class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>Why Gabriel Family Clinic</h2>
            <p>
              Built with our neighbors in mind: clear, calm, and respectful of your time.
            </p>
          </div>
          <div class="grid-three">
            <div class="card card-elevated feature-card">
              <div class="feature-icon">🧓</div>
              <h3>Senior-friendly by design</h3>
              <p>
                Large text, high contrast, simple steps. No app downloads,
                no confusing menus – just a clear way to see your turn.
              </p>
            </div>
            <div class="card card-elevated feature-card">
              <div class="feature-icon">⏱️</div>
              <h3>Shorter, calmer waits</h3>
              <p>
                Book ahead or walk in – see your queue number, estimated wait,
                and get gentle updates so you can rest instead of crowding.
              </p>
            </div>
            <div class="card card-elevated feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Privacy built in</h3>
              <p>
                We protect your information and only show what is needed.
                IDs are masked and systems follow healthcare best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section id="how" class="section">
        <div class="container">
          <div class="section-header">
            <h2>How it works – in three simple steps</h2>
            <p>
              Designed so that anyone in the family can help, and seniors can follow easily.
            </p>
          </div>
          <div class="steps-grid">
            <div class="step">
              <div class="step-number">1</div>
              <h3>Book from home or at the clinic</h3>
              <p>
                Choose your preferred doctor and time slot from your phone,
                or let our front-desk team help you on the same system.
              </p>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <h3>Get your queue number & updates</h3>
              <p>
                Receive a clear queue number and see your place in line.
                Gentle SMS reminders keep things on track.
              </p>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <h3>See the doctor with confidence</h3>
              <p>
                When it&apos;s almost your turn, you&apos;ll know. Less uncertainty,
                less crowding, more comfort for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- For Seniors & Families -->
      <section id="seniors" class="section section-alt">
        <div class="container seniors-grid">
          <div>
            <h2>Made for seniors and families</h2>
            <p class="lead">
              Your parents and grandparents deserve calm, not chaos.
            </p>
            <ul class="list-check">
              <li>Simple screens you can read at a glance.</li>
              <li>No need to remember passwords – secure links instead.</li>
              <li>Caregivers can help manage appointments easily.</li>
              <li>Clear queue info so no one has to stand and wait.</li>
            </ul>
          </div>
          <div class="card card-elevated seniors-card">
            <h3 class="seniors-card-title">“Ah Ma can see her queue number!”</h3>
            <p class="seniors-card-quote">
              “The staff just showed us this screen. Now my mum can sit and rest
              while I check her turn on my phone. Very thoughtful.”
            </p>
            <div class="seniors-card-meta">
              – A daughter of a regular patient
            </div>
          </div>
        </div>
      </section>

      <!-- For Staff -->
      <section class="section">
        <div class="container staff-grid">
          <div>
            <h2>Built to make clinic teams happier too</h2>
            <p class="lead">
              One clean dashboard for front-desk and doctors.
            </p>
            <ul class="list-check">
              <li>See today&apos;s appointments and walk-ins at a glance.</li>
              <li>Assign queue numbers with one tap.</li>
              <li>Reduce repeated questions at the counter.</li>
              <li>Keep patients informed without extra calls.</li>
            </ul>
          </div>
          <div class="card card-elevated staff-card">
            <div class="staff-label">Staff Portal Preview</div>
            <div class="staff-row">
              <span>10:00 AM – Mdm Tan Ah Lian</span>
              <span class="badge-soft">Arrived · A013</span>
            </div>
            <div class="staff-row">
              <span>10:15 AM – Mr Lee Wei Jian</span>
              <span class="badge-soft">Booked</span>
            </div>
            <div class="staff-row">
              <span>10:30 AM – Walk-in</span>
              <span class="badge-soft">In Queue</span>
            </div>
            <div class="staff-note">
              The real system uses secure staff login with live data.
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action / Book -->
      <section id="book" class="section cta-section">
        <div class="container cta-container">
          <div>
            <h2>Ready to make visits calmer for everyone?</h2>
            <p>
              Start with simple online booking and a clear queue. We&apos;ll handle
              the details so you can focus on care.
            </p>
          </div>
          <div class="cta-actions">
            <a href="#hero" class="btn btn-primary btn-large">
              Try the booking experience
            </a>
            <a href="#contact" class="btn btn-outline btn-large">
              Talk to our clinic team
            </a>
          </div>
        </div>
      </section>

      <!-- Contact / Footer -->
      <section id="contact" class="section section-alt">
        <div class="container contact-grid">
          <div>
            <h3>Gabriel Family Clinic</h3>
            <p>
              123 Sample Street, #01-234<br />
              Singapore 123456
            </p>
            <p>Tel: +65 6000 0000</p>
          </div>
          <div>
            <h4>Hours</h4>
            <p>
              Mon–Fri: 8:30 AM – 1:00 PM, 2:00 PM – 5:30 PM<br />
              Sat: 8:30 AM – 1:00 PM<br />
              Sun & PH: Closed
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="#hero">Home</a></li>
              <li><a href="#why">Why Us</a></li>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#seniors">For Seniors</a></li>
              <li><a href="#book">Book</a></li>
            </ul>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <div class="container footer-inner">
          <div>© Gabriel Family Clinic. All rights reserved.</div>
          <div class="footer-sub">
            This is a design mockup of the digital companion experience.
          </div>
        </div>
      </footer>
    </main>

    <!-- Scripts -->
    <script src="./js/landing.js" defer></script>
  </body>
</html>
```

2) static/styles/globals.css

```css
/* Gabriel Family Clinic - Static Landing Page Styles */

/* Base reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f9fafb;
  color: #111827;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Typography */

h1,
h2,
h3,
h4 {
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  margin: 0 0 0.5rem;
  color: #111827;
}

h1 {
  font-size: 2.6rem;
  line-height: 1.2;
  font-weight: 700;
}

h2 {
  font-size: 2rem;
  line-height: 1.3;
  font-weight: 600;
}

h3 {
  font-size: 1.4rem;
  font-weight: 600;
}

p {
  margin: 0 0 0.75rem;
  color: #4b5563;
}

/* Layout helpers */

.container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.section {
  padding: 4rem 0;
}

.section-alt {
  background-color: #ffffff;
}

.section-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 2.5rem;
}

.section-header p {
  color: #6b7280;
}

/* Navigation */

.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: rgba(249, 250, 251, 0.98);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(209, 213, 219, 0.5);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #eff6ff;
  font-weight: 700;
  font-size: 1rem;
}

.brand-title {
  font-weight: 600;
  font-size: 1.05rem;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  font-size: 0.95rem;
  color: #4b5563;
  text-decoration: none;
  padding: 0.35rem 0;
  border-bottom: 2px solid transparent;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.nav-link:hover {
  color: #111827;
  border-color: #93c5fd;
}

/* Buttons (Shadcn-inspired) */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
  background-color: transparent;
  color: #111827;
}

.btn-small {
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
}

.btn-large {
  padding: 0.75rem 1.4rem;
  font-size: 1rem;
}

.btn-primary {
  background-color: #2563eb;
  color: #eff6ff;
  border-color: #2563eb;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.18);
}

.btn-primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.26);
  transform: translateY(-1px);
}

.btn-outline {
  border-color: #d1d5db;
  color: #111827;
  background-color: #ffffff;
}

.btn-outline:hover {
  border-color: #2563eb;
  color: #1d4ed8;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.btn-ghost {
  background: transparent;
  color: #4b5563;
}

.btn-ghost:hover {
  background-color: #f3f4ff;
  color: #111827;
}

.btn-full {
  width: 100%;
}

/* Shadcn-style cards */

.card {
  border-radius: 1rem;
  border: 1px solid rgba(209, 213, 219, 0.7);
  background-color: #ffffff;
  padding: 1.1rem 1.1rem;
}

.card-elevated {
  box-shadow: 0 14px 45px rgba(15, 23, 42, 0.12);
}

/* Hero */

.hero {
  padding-top: 4.5rem;
  padding-bottom: 4rem;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1.4fr);
  gap: 2.5rem;
  align-items: center;
}

.eyebrow {
  font-size: 0.85rem;
  font-weight: 500;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.02rem;
  color: #4b5563;
  max-width: 540px;
}

.text-highlight {
  color: #2563eb;
}

.hero-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.hero-trust {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.88rem;
  color: #6b7280;
}

.badge-soft {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.hero-note {
  font-size: 0.86rem;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-card {
  padding: 1.25rem 1.3rem;
}

.hero-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.hero-card-title {
  font-size: 1rem;
  font-weight: 600;
}

.hero-card-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
}

.hero-card-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background-color: #eff6ff;
  color: #2563eb;
}

.hero-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 0.1rem;
}

.field-select,
.field-input {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border-radius: 0.7rem;
  border: 1px solid #e5e7eb;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #111827;
  background-color: #f9fafb;
}

.field-input {
  display: block;
  outline: none;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb11;
  background-color: #ffffff;
}

.chevron {
  font-size: 0.7rem;
  color: #9ca3af;
}

.mt-2 {
  margin-top: 0.75rem;
}

.hero-card-footnote {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-top: 0.2rem;
}

.hero-mini-card {
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.hero-mini-label {
  font-size: 0.78rem;
  color: #6b7280;
}

.hero-mini-items {
  display: flex;
  gap: 1.5rem;
}

.hero-mini-item {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.mini-label {
  font-size: 0.7rem;
  color: #9ca3af;
}

.mini-value {
  font-size: 0.98rem;
  font-weight: 600;
  color: #111827;
}

.text-positive {
  color: #16a34a;
}

.hero-mini-note {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* Feature grid */

.grid-three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.feature-card p {
  font-size: 0.9rem;
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}

/* Steps */

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.step-number {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background-color: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}

/* Seniors / Staff sections */

.seniors-grid,
.staff-grid,
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.4fr);
  gap: 2rem;
  align-items: flex-start;
}

.lead {
  font-size: 1.02rem;
  color: #374151;
  margin-bottom: 0.6rem;
}

.list-check {
  padding-left: 1.3rem;
  margin: 0;
  list-style: none;
}

.list-check li {
  margin-bottom: 0.35rem;
  position: relative;
  font-size: 0.93rem;
  color: #4b5563;
}

.list-check li::before {
  content: '✔';
  position: absolute;
  left: -1.2rem;
  top: 0.04rem;
  font-size: 0.78rem;
  color: #22c55e;
}

.seniors-card-title {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.seniors-card-quote {
  font-size: 0.9rem;
  color: #4b5563;
}

.seniors-card-meta {
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 0.4rem;
}

.staff-card {
  padding: 1rem 1rem;
}

.staff-label {
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 0.4rem;
}

.staff-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.staff-note {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.35rem;
}

/* CTA */

.cta-section {
  background: linear-gradient(to right, #1d4ed8, #2563eb);
  color: #eff6ff;
}

.cta-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.25rem;
  align-items: center;
}

.cta-section h2,
.cta-section p {
  color: #eff6ff;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Contact / Footer */

.contact-grid {
  align-items: flex-start;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.footer-links a {
  color: #4b5563;
  text-decoration: none;
}

.footer-links a:hover {
  color: #111827;
}

.site-footer {
  padding: 1.25rem 0;
  background-color: #f3f4f6;
  border-top: 1px solid #e5e7eb;
  font-size: 0.8rem;
  color: #6b7280;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
}

.footer-sub {
  font-size: 0.78rem;
}

/* Mobile nav toggle */

.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-toggle span {
  width: 20px;
  height: 2px;
  background-color: #111827;
  border-radius: 999px;
  transition: all 0.18s ease;
}

/* Responsive */

@media (max-width: 840px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .grid-three {
    grid-template-columns: minmax(0, 1fr);
  }

  .steps-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .seniors-grid,
  .staff-grid,
  .contact-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .nav-links {
    position: absolute;
    top: 64px;
    right: 0;
    left: 0;
    padding: 0.75rem 1.25rem 1rem;
    background-color: #f9fafb;
    border-bottom: 1px solid rgba(209, 213, 219, 0.7);
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .nav-links.is-open {
    display: flex;
  }

  .nav-cta {
    margin-top: 0.25rem;
  }

  .nav-toggle {
    display: flex;
  }
}
```

3) static/js/landing.js

```js
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');

  // Mobile nav toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close nav on link click (mobile)
    navMenu.addEventListener('click', (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.tagName === 'A' &&
        navMenu.classList.contains('is-open')
      ) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scroll for elements with data-scroll-to
  document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.hasAttribute('data-scroll-to')
    ) {
      const selector = target.getAttribute('data-scroll-to');
      if (!selector) return;

      const section = document.querySelector(selector);
      if (!section) return;

      event.preventDefault();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Smooth scroll for internal nav links (#hash)
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const section = document.querySelector(href);
      if (!section) return;

      event.preventDefault();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
```

--------------------
Final Validation
--------------------

Per-file:

- index.html:
  - [x] Clean, semantic structure.
  - [x] Hero + Why Us + How It Works + Seniors + Staff + CTA + Contact.
  - [x] Clear CTAs; maps well to eventual `/book`, `/staff/appointments`.
  - [x] Uses classes defined in globals.css and hooks used by landing.js.

- globals.css:
  - [x] Senior-friendly: large fonts, high contrast, clear buttons.
  - [x] Shadcn-inspired: pill buttons, cards, soft shadows.
  - [x] Consistent palette with previous configs.
  - [x] Responsive behavior implemented.

- landing.js:
  - [x] Progressive enhancement only.
  - [x] Mobile nav toggle.
  - [x] Smooth scrolling for CTAs.
  - [x] No external dependencies.

Alignment:

- With PRD/PAD:
  - Patient-first and senior-friendly messaging.
  - Staff portal highlight.
  - Privacy and clarity emphasized.
- With Master_Execution_Plan:
  - This static mockup is a faithful visualization of the real flows.
  - Easy to port into Next.js components and Mantine/Shadcn UI later.
- With engineering constraints:
  - Simple to host anywhere.
  - No sensitive logic.
  - Clean separation of concerns.

If you’d like next, I can:

- Show how to map this static mockup into your existing Next.js `index.tsx` with Mantine/Shadcn components.
- Or add a brief style guide (tokens and components) extracted from this mockup for future consistency.
