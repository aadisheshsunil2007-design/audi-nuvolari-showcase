(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointerFine = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------ */
  /* Loader                                                              */
  /* ------------------------------------------------------------------ */
  const loader = document.getElementById('loader');
  const hideLoader = () => loader && loader.classList.add('is-hidden');
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 500);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 500));
  }
  // Failsafe: never let the loader trap a user
  setTimeout(hideLoader, 2500);

  /* ------------------------------------------------------------------ */
  /* Reveal the blueprint silhouette + light signature after load        */
  /* ------------------------------------------------------------------ */
  const heroBlueprint = document.querySelector('.hero-blueprint');
  setTimeout(() => {
    heroBlueprint && heroBlueprint.classList.add('is-drawn');
    document.querySelectorAll('.bp-lights').forEach(g => g.classList.add('is-lit'));
  }, 700);

  const designBlueprint = document.querySelector('.design-blueprint');
  if (designBlueprint) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          designBlueprint.classList.add('is-drawn');
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(designBlueprint);
  }

  /* ------------------------------------------------------------------ */
  /* Nav progress (chapter tracker)                                      */
  /* ------------------------------------------------------------------ */
  const nav = document.querySelector('.nav');
  const chapters = Array.from(document.querySelectorAll('.chapter[data-chapter]'));
  const bars = Array.from(document.querySelectorAll('.nav-progress .bar'));

  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);

    const refY = window.scrollY + window.innerHeight * 0.35;
    let activeIndex = -1;
    chapters.forEach((section, i) => {
      if (section.offsetTop <= refY) activeIndex = i;
    });

    bars.forEach((bar, i) => {
      bar.classList.toggle('is-done', i < activeIndex);
      bar.classList.toggle('is-active', i === activeIndex);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero 3D scroll tilt                                                  */
  /* ------------------------------------------------------------------ */
  const heroStage = document.getElementById('heroStage');
  const heroSection = document.getElementById('hero');

  function updateHero() {
    if (!heroStage || reduceMotion) return;
    const h = heroSection.offsetHeight || window.innerHeight;
    const progress = Math.min(1, Math.max(0, window.scrollY / h));
    const rot = progress * -14;
    const scale = 1 - progress * 0.12;
    const ty = progress * 50;
    const opacity = 1 - progress * 1.25;
    heroStage.style.transform = `translateY(${ty}px) scale(${scale}) rotateX(${rot}deg)`;
    heroStage.style.opacity = String(Math.max(0, opacity));
  }

  /* ------------------------------------------------------------------ */
  /* Stat stack — scroll-scrubbed 3D flip                                 */
  /* ------------------------------------------------------------------ */
  const statTrack = document.getElementById('statTrack');
  const statPanels = Array.from(document.querySelectorAll('.stat-panel'));

  function statScrubEnabled() {
    return !reduceMotion && window.innerWidth > 640 && window.innerHeight > 480;
  }

  function updateStatStack() {
    if (!statTrack || statPanels.length === 0) return;

    if (!statScrubEnabled()) {
      statPanels.forEach(p => { p.style.transform = ''; p.style.opacity = ''; p.style.zIndex = ''; p.style.pointerEvents = ''; });
      return;
    }

    const rect = statTrack.getBoundingClientRect();
    const scrollable = statTrack.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const count = statPanels.length;
    const continuous = progress * (count - 1);

    statPanels.forEach((panel, i) => {
      let local = continuous - i;
      local = Math.min(1, Math.max(-1, local));
      const rot = local * 88;
      const opacity = 1 - Math.abs(local);
      panel.style.transform = `rotateX(${rot}deg) translateZ(0)`;
      panel.style.opacity = String(opacity);
      panel.style.zIndex = String(Math.round((1 - Math.abs(local)) * 10));
      panel.style.pointerEvents = Math.abs(local) < 0.5 ? 'auto' : 'none';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll loop (single rAF ticker for all scroll-driven effects)        */
  /* ------------------------------------------------------------------ */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateNav();
      updateHero();
      updateStatStack();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Count-up numbers                                                     */
  /* ------------------------------------------------------------------ */
  function animateCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1500;
    const start = performance.now();

    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutExpo(t);
      const value = target * eased;
      el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
    }
    if (reduceMotion) {
      el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
    } else {
      requestAnimationFrame(tick);
    }
  }

  const counters = document.querySelectorAll('[data-count-to]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  /* ------------------------------------------------------------------ */
  /* Card / block entrance (powertrain cards, access blocks)              */
  /* ------------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll('.pt-card, .access-block, .pt-diagram');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  revealTargets.forEach(t => revealObserver.observe(t));

  /* ------------------------------------------------------------------ */
  /* Mouse tilt on cards (desktop / fine pointer only)                    */
  /* ------------------------------------------------------------------ */
  if (pointerFine && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('is-tilting');
        card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(0)`;
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Smooth in-page nav clicks (account for fixed header)                 */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = document.querySelector('.nav').offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - (navH - 20);
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
})();
