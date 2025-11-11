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
