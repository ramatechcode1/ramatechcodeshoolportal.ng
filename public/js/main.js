// Simple scroll-reveal for cards and trace items — one orchestrated pass, no scattered effects
document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = document.querySelectorAll('.card, .course-card, .trace, .price-card');
  if (!('IntersectionObserver' in window)) return;

  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => observer.observe(el));
});
