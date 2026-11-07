'use strict';

(async () => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (document.documentElement.classList.contains('opening-locked')) {
    await new Promise(resolve => document.addEventListener('umbral:open', resolve, { once: true }));
  }

  const section = document.querySelector('.lol-section');
  const finale = document.querySelector('.finale-section');
  if (!section || !finale) return;

  gsap.matchMedia().add({
    full: '(prefers-reduced-motion: no-preference)',
    reduced: '(prefers-reduced-motion: reduce)'
  }, ({ conditions: { reduced } }) => {
    let inLeague = false;
    function changeChapter(entering) {
      if (entering === inLeague) return;
      inLeague = entering;
      document.body.classList.toggle('theme-lol', entering);
      const previous = ScrollTrigger.getById('umbral-ucato-theme');
      document.body.classList.toggle('theme-ucato', !entering && Boolean(previous && previous.progress >= 0.5));
    }

    const atmosphere = document.querySelector('.lol-atmosphere');
    const events = new AbortController();
    let atmosphereInView = false;
    function updateAtmosphere() {
      atmosphere.classList.toggle('is-active', atmosphereInView && !document.hidden);
    }
    document.addEventListener('visibilitychange', updateAtmosphere, { signal: events.signal });
    const heading = section.querySelector('.lol-heading');
    const panels = section.querySelectorAll('.lol-champion');

    const bridge = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      onUpdate() { changeChapter(this.progress() >= 0.48); },
      scrollTrigger: {
        id: 'umbral-lol-theme',
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: reduced ? true : 0.9
      }
    });
    bridge
      .fromTo(atmosphere, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0)
      .from(heading, { autoAlpha: 0, y: reduced ? 0 : 24, duration: 0.3, ease: 'power2.out' }, 0.7);

    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      endTrigger: finale,
      end: 'bottom top',
      onToggle: trigger => { atmosphereInView = trigger.isActive; updateAtmosphere(); },
      onRefresh: trigger => { atmosphereInView = trigger.isActive; updateAtmosphere(); }
    });

    panels.forEach(panel => {
      gsap.from(panel, {
        autoAlpha: 0,
        y: reduced ? 0 : 28,
        duration: reduced ? 0.15 : 1.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: panel,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        }
      });
    });
    gsap.from(section.querySelector('.lol-memory'), {
      autoAlpha: 0,
      y: reduced ? 0 : 20,
      duration: reduced ? 0.15 : 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section.querySelector('.lol-memory'),
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
    const victory = gsap.timeline({
      scrollTrigger: {
        id: 'umbral-victoria',
        trigger: finale,
        start: 'top 42%',
        toggleActions: 'play none none reverse'
      }
    });
    victory
      .from(finale.querySelector('.finale-kicker'), { autoAlpha: 0, duration: reduced ? 0.15 : 0.65 }, 0)
      .from(finale.querySelector('h1'), {
        autoAlpha: 0,
        scale: reduced ? 1 : 0.5,
        duration: reduced ? 0.15 : 1.5,
        ease: 'power3.out'
      }, reduced ? 0 : 0.12)
      .from(finale.querySelector('.finale-message'), {
        autoAlpha: 0,
        y: reduced ? 0 : 16,
        duration: reduced ? 0.15 : 0.85,
        ease: 'power2.out'
      }, reduced ? 0 : 0.85)
      .from(finale.querySelector('.finale-aura'), {
        opacity: 0,
        scale: reduced ? 1 : 0.65,
        duration: reduced ? 0.15 : 1.5,
        ease: 'power2.out'
      }, 0);

    ScrollTrigger.refresh();

    return () => {
      events.abort();
      document.body.classList.remove('theme-lol');
      atmosphere.classList.remove('is-active');
      const previous = ScrollTrigger.getById('umbral-ucato-theme');
      document.body.classList.toggle('theme-ucato', Boolean(previous && previous.progress >= 0.5));
    };
  });
})();

