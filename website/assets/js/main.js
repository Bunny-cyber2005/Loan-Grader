/**
 * JPMC Loan Grader — Global JS
 * Nav active link, mobile menu, smooth scroll, hero animation
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mark active nav link based on current page ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // ── Animate KPI cards on scroll (IntersectionObserver) ──
  const kpiCards = document.querySelectorAll('.kpi-card');
  if (kpiCards.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    kpiCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      observer.observe(card);
    });
  }

  // ── Animate feature cards on scroll ──
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length) {
    const observer2 = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 60);
          observer2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    featureCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      observer2.observe(card);
    });
  }

  // ── Animate hero card grade letter ──
  const gradeLetter = document.querySelector('.grade-letter');
  if (gradeLetter) {
    const grades = ['A','B','C','D','E','F'];
    const colors = ['#2ecc71','#27ae60','#f39c12','#e67e22','#e74c3c','#c0392b'];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % grades.length;
      gradeLetter.style.opacity = '0';
      gradeLetter.style.transform = 'scale(0.8)';
      setTimeout(() => {
        gradeLetter.textContent = grades[idx];
        gradeLetter.style.background = `linear-gradient(135deg, ${colors[idx]}, #388bfd)`;
        gradeLetter.style.webkitBackgroundClip = 'text';
        gradeLetter.style.opacity = '1';
        gradeLetter.style.transform = 'scale(1)';
      }, 200);
    }, 2000);
    gradeLetter.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
