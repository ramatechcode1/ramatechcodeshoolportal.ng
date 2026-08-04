/* Advanced micro-interactions for the landing page.
   Everything here checks prefers-reduced-motion and no-ops gracefully
   if a browser feature isn't available. */

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initScrollTrace();
  initNavShrink();
  if (!REDUCE_MOTION) {
    initMagneticButtons();
    initSpotlightCards();
  }
  initCountUp();
});

/* ---- Scroll progress trace along the top of the page ---- */
function initScrollTrace() {
  const trace = document.getElementById('scrollTrace');
  if (!trace) return;
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    trace.style.width = pct + '%';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ---- Nav shrinks and gains more contrast once you scroll past the hero ---- */
function initNavShrink() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const toggle = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

/* ---- Buttons pull slightly toward the cursor within their bounds ---- */
function initMagneticButtons() {
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ---- Cards get a soft radial glow that follows the cursor (spotlight) ---- */
function initSpotlightCards() {
  document.querySelectorAll('.card, .course-card, .price-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---- Stat numbers count up once scrolled into view ---- */
function initCountUp() {
  const targets = document.querySelectorAll('[data-count]');
  if (!targets.length) return;

  const animate = (el) => {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (REDUCE_MOTION) {
      el.textContent = prefix + end.toLocaleString('en-NG') + suffix;
      return;
    }
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(end * eased);
      el.textContent = prefix + value.toLocaleString('en-NG') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    targets.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  targets.forEach(el => observer.observe(el));
}
