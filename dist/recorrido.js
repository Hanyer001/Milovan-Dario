'use strict';

(async () => {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const body = document.body;
  const viewer = document.querySelector('.gastly-viewer');
  const dusk = document.querySelector('.chapter-backdrop--dusk');
  const daylight = document.querySelector('.chapter-backdrop--daylight');
  const opening = document.querySelector('.opening-stage');
  const hero = document.querySelector('#inicio');
  const creators = document.querySelector('#creadores');
  const polaroids = [...creators.querySelectorAll('.polaroid')];
  const ucato = document.querySelector('.ucato-section');
  const scenes = [hero, creators, ucato];
  const crest = ucato.querySelector('.logo-bg-uc');
  const chapterIntro = ucato.querySelectorAll('.ucato-index, .ucato-heading');
  const galleryHeading = ucato.querySelector('.ucato-gallery-heading');
  const memories = ucato.querySelectorAll('.ucato-card');
  const unlocked = root.classList.contains('opening-locked')
    ? new Promise(resolve => document.addEventListener('umbral:open', resolve, { once: true }))
    : Promise.resolve();
  await unlocked;
  let firstLoad = true;

  gsap.matchMedia().add({
    full: '(prefers-reduced-motion: no-preference)',
    reduced: '(prefers-reduced-motion: reduce)'
  }, ({ conditions: { reduced } }) => {
    const lenis = !reduced && Lenis ? new Lenis({
      autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.13
    }) : null;
    window.umbralLenis = lenis;
    let active = '';
    let albumStarted = false;
    let openingId = 'inicio';

    function activate(id) {
      if (active === id) return;
      const next = scenes.find(scene => scene.id === id);
      const focusWasInAnotherScene = scenes.some(scene => scene !== next && scene.contains(document.activeElement));
      for (const scene of scenes) scene.inert = scene !== next;
      if (focusWasInAnotherScene) next.querySelector('h1, h2').focus({ preventScroll: true });
      active = id;
    }

    root.classList.add('has-scenes');
    gsap.set(creators, { autoAlpha: 0 });
    gsap.set(polaroids, { autoAlpha: 0, y: reduced ? 0 : 32 });

    const chapters = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate() {
        openingId = this.time() >= 0.38 ? 'creadores' : 'inicio';
        if (!albumStarted) activate(openingId);
      },
      scrollTrigger: {
        id: 'umbral-apertura',
        refreshPriority: 100,
        trigger: opening,
        start: 'top top',
        end: () => '+=' + Math.round(opening.clientHeight * (reduced ? 0.85 : 1.65)),
        pin: true,
        scrub: reduced ? true : 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    chapters.to(hero, { autoAlpha: 0, yPercent: reduced ? 0 : -7, duration: 0.30 }, 0.07)
      .to(creators, { autoAlpha: 1, duration: 0.30 }, 0.22)
      .to(polaroids, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.09, ease: 'power2.out' }, 0.32)
      .to({}, { duration: 0.14 }, 0.86);

    function switchChapter(inUcato) {
      if (albumStarted === inUcato) return;
      albumStarted = inUcato;
      body.classList.toggle('theme-ucato', inUcato && !body.classList.contains('theme-lol'));
      activate(inUcato ? 'ucato' : openingId);
    }

    gsap.set(crest, { autoAlpha: 0 });
    gsap.set([...chapterIntro, galleryHeading, ...memories], { autoAlpha: 0, y: reduced ? 0 : 22 });

    const chapterBridge = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      onUpdate() { switchChapter(this.time() >= 0.5); },
      scrollTrigger: {
        id: 'umbral-ucato-theme',
        trigger: ucato,
        start: 'top bottom',
        end: 'top top',
        scrub: reduced ? true : 0.8
      }
    });
    chapterBridge
      .to(dusk, { autoAlpha: 1, duration: 0.32 }, 0)
      .to(viewer, {
        autoAlpha: 0,
        yPercent: reduced ? 0 : -4,
        scale: reduced ? 1 : 1.045,
        duration: 0.55
      }, 0.035)
      .to(crest, { autoAlpha: 0.05, duration: 0.73 }, 0.10)
      .to(daylight, { autoAlpha: 1, duration: 0.58 }, 0.32)
      .to(chapterIntro, { autoAlpha: 1, y: 0, duration: 0.27, ease: 'power2.out' }, 0.63)
      .to(galleryHeading, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.70)
      .to(memories, { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.03, ease: 'power2.out' }, 0.72);

    function tick(seconds) {
      lenis.raf(seconds * 1000);
    }
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);
    }

    ScrollTrigger.refresh();
    lenis?.resize();
    activate(albumStarted ? 'ucato' : openingId);
    if (firstLoad) {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
      ScrollTrigger.update();
      const intro = gsap.timeline({ defaults: { ease: 'power2.out' } });
      intro
        .from(hero.querySelector('h1'), { autoAlpha: 0, y: reduced ? 0 : 36, duration: 0.88 }, 0)
        .from(hero.querySelector('.codex-badge'), { autoAlpha: 0, duration: 0.48 }, 0.47);
    }
    firstLoad = false;

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      if (window.umbralLenis === lenis) delete window.umbralLenis;
      root.classList.remove('has-scenes');
      body.classList.remove('theme-ucato');
      scenes.forEach(scene => { scene.inert = false; });
    };
  });
})();

