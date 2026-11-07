'use strict';

(async () => {
  const section = document.querySelector('.tft-section');
  if (!section) return;
  const { gsap, ScrollTrigger } = window;
  const dialog = section.querySelector('.tft-encounter-overlay');
  const board = section.querySelector('.tft-board-container');
  if (!gsap || !ScrollTrigger) { dialog.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  const root = document.documentElement;
  const stage = section.querySelector('.tft-chat-container');
  const cards = [...dialog.querySelectorAll('.augment-card')];
  const wash = dialog.querySelector('.tft-encounter-wash');
  const encounterCopy = [...dialog.querySelector('.tft-encounter-content').children]
    .filter(element => !element.classList.contains('tft-augments'));
  const buff = section.querySelector('.tft-active-buff');
  const nodes = [...section.querySelectorAll('.hex-node')];
  const units = [...section.querySelectorAll('.arena-unit')];
  const memoryButtons = [...section.querySelectorAll('button[data-memory]')];
  const inspect = section.querySelector('.arena-inspect');
  const backgroundScenes = [document.querySelector('.lol-section'), board].filter(Boolean);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = false;
  let locked = false;
  let entrance;
  let backgroundOpacity = [];
  board.inert = true;

  function setScroll(y) {
    if (window.umbralLenis) window.umbralLenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  function openEncounter() {
    if (selected || locked || root.classList.contains('opening-locked')) return;
    locked = true;
    const currentY = scrollY;
    window.umbralLenis?.stop();
    root.classList.add('tft-choosing');
    setScroll(currentY);
    backgroundOpacity = backgroundScenes.map(element => [element, element.style.opacity]);
    gsap.set(wash, { opacity: motion.matches ? 1 : 0 });
    gsap.set(encounterCopy, { opacity: motion.matches ? 1 : .15, y: motion.matches ? 0 : 14 });
    gsap.set(cards, { opacity: motion.matches ? 1 : .12, y: motion.matches ? 0 : 22, scale: motion.matches ? 1 : .985 });
    gsap.set(dialog, { opacity: 1, visibility: 'visible' });
    dialog.showModal();
    dialog.scrollTop = 0;
    cards[0].focus({ preventScroll: true });
    if (!motion.matches) {
      dialog.classList.add('is-entering');
      entrance = gsap.timeline({
        onComplete() {
          gsap.set([...cards, ...encounterCopy], { clearProps: 'transform' });
          dialog.classList.remove('is-entering');
        }
      })
        .to(backgroundScenes, { opacity: 0, duration: .36, ease: 'power2.out' }, 0)
        .to(wash, { opacity: 1, duration: .9, ease: 'sine.inOut' }, 0)
        .to(encounterCopy, { opacity: 1, y: 0, duration: .72, ease: 'power2.out' }, .04)
        .to(cards, { opacity: 1, y: 0, scale: 1, duration: .72, stagger: .07, ease: 'power2.out' }, .08);
    }
  }
  // El selector está preparado al cargar y aparece al entrar al capítulo, sin esperar al borde superior.
  // El diálogo y Lenis mantienen la posición; el único pin pertenece al tablero ya revelado.
  const encounter = ScrollTrigger.create({
    id: 'umbral-tft-encounter', trigger: section, start: 'top 75%', end: 'bottom top',
    refreshPriority: -10,
    onEnter: openEncounter, onEnterBack: openEncounter
  });
  dialog.addEventListener('cancel', event => event.preventDefault());

  function showMemory(index) {
    memoryButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.memory) === index)));
    const unit = units[index];
    const col = unit.style.getPropertyValue('--col');
    const row = unit.style.getPropertyValue('--row');
    section.querySelectorAll('.arena-hex').forEach(hex => {
      hex.classList.toggle('is-highlighted', hex.style.getPropertyValue('--col') === col && hex.style.getPropertyValue('--row') === row);
    });
    inspect.querySelector('strong').textContent = nodes[index].querySelector('h3').textContent;
    inspect.querySelector('p').textContent = nodes[index].querySelector('.hex-copy > p:last-child').textContent;
    inspect.scrollTop = 0;
  }
  memoryButtons.forEach(button => button.addEventListener('click', () => showMemory(Number(button.dataset.memory))));

  function unlockBoard() {
    try {
      encounter.kill(true);
      dialog.close();
      root.classList.remove('tft-choosing');
      board.inert = false;
      initBoardAnimations();
      section.classList.add('is-ready');
      ScrollTrigger.create({
        id: 'umbral-tft-buff', trigger: section, start: 'top bottom', end: 'bottom top',
        refreshPriority: -20,
        onToggle: trigger => gsap.set(buff, { autoAlpha: trigger.isActive ? 1 : 0 })
      });
      gsap.set(buff, { autoAlpha: 1 });
      ScrollTrigger.refresh();
      const y = section.getBoundingClientRect().top + scrollY;
      if (window.umbralLenis) {
        window.umbralLenis.resize();
        window.umbralLenis.scrollTo(y, { immediate: true, force: true });
      } else window.scrollTo(0, y);
      const title = section.querySelector('#tft-title');
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    } finally {
      // Incluso si una animación falla, la página vuelve a aceptar desplazamiento.
      if (dialog.open) dialog.close();
      dialog.classList.remove('is-entering', 'is-selecting');
      backgroundOpacity.forEach(([element, opacity]) => { element.style.opacity = opacity; });
      root.classList.remove('tft-choosing');
      board.inert = false;
      locked = false;
      window.umbralLenis?.start();
    }
  }
  cards.forEach(card => card.addEventListener('click', () => {
    if (selected) return;
    selected = true;
    entrance?.kill();
    dialog.classList.remove('is-entering');
    dialog.classList.add('is-selecting');
    gsap.killTweensOf(cards);
    gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 });
    cards.forEach(button => { button.disabled = true; });
    buff.querySelector('strong').textContent = card.dataset.augment;
    buff.hidden = false;
    gsap.set(buff, { autoAlpha: 0 });
    if (motion.matches) { unlockBoard(); return; }
    const from = card.getBoundingClientRect();
    const to = buff.getBoundingClientRect();
    const camera = { y: scrollY };
    const boardY = section.getBoundingClientRect().top + scrollY;
    // Una medición por interacción; el vuelo solo modifica transform y opacity.
    gsap.set(card, { position: 'fixed', left: from.left, top: from.top,
      width: from.width, height: from.height, margin: 0, transformOrigin: 'top left' });
    gsap.timeline({ onComplete: unlockBoard })
      .to(cards.filter(other => other !== card), { autoAlpha: 0, duration: .15 }, 0)
      .to(backgroundScenes, { opacity: 1, duration: .48, ease: 'sine.inOut' }, .05)
      .to(camera, { y: boardY, duration: .5, ease: 'power2.inOut', onUpdate: () => setScroll(camera.y) }, 0)
      .to(card, { x: to.left - from.left, y: to.top - from.top,
        scale: Math.min(to.width / from.width, to.height / from.height), duration: .5, ease: 'power3.inOut' }, .05)
      .to(dialog, { autoAlpha: 0, duration: .2 }, .48);
  }));

  function initBoardAnimations() {
    const bubbles = [...section.querySelectorAll('.chat-bubble')];
    const container = section.querySelector('.tft-timeline-container');
    const line = container.querySelector('.tft-line');
    const copies = nodes.map(node => node.querySelector('.hex-copy'));
    gsap.matchMedia().add({
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 58rem) and (min-height: 48rem)'
    }, context => {
      if (!context.conditions.motion) return;
      const canPin = context.conditions.desktop && stage.offsetHeight <= innerHeight + 2;
      const reveals = [];
      let thresholds = [];
      const active = nodes.map(() => false);
      if (canPin) {
        gsap.fromTo(bubbles, { y: 30, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: .7, stagger: .5, ease: 'power2.out',
          scrollTrigger: { id: 'umbral-tft-chat', trigger: stage, start: 'top top',
            refreshPriority: 50,
            end: () => '+=' + Math.round(innerHeight * 1.2), pin: true, scrub: .4, invalidateOnRefresh: true }
        });
      } else {
        bubbles.forEach((bubble, i) => gsap.fromTo(bubble, { y: 24, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, ease: 'none', scrollTrigger: {
            id: 'umbral-tft-chat-' + i, trigger: bubble, start: 'top 94%', end: 'top 73%', scrub: true
          }
        }));
      }
      gsap.set(copies, { autoAlpha: 0, y: 18 });
      function measure() {
        const centers = nodes.map(node => {
          const marker = node.querySelector('.hex-marker');
          return node.offsetTop + marker.offsetTop + marker.offsetHeight / 2;
        });
        const span = Math.max(1, centers.at(-1) - centers[0]);
        container.style.setProperty('--tft-line-start', centers[0] + 'px');
        container.style.setProperty('--tft-line-span', span + 'px');
        thresholds = centers.map(center => (center - centers[0]) / span);
      }
      function update(trigger) {
        nodes.forEach((node, i) => {
          const reached = trigger.scroll() >= trigger.start && trigger.progress + .0001 >= thresholds[i];
          if (active[i] === reached) return;
          active[i] = reached;
          node.classList.toggle('is-active', reached);
          reveals[i]?.kill();
          reveals[i] = gsap.to(copies[i], { autoAlpha: reached ? 1 : 0, y: reached ? 0 : 18,
            duration: reached ? .5 : .25, overwrite: true, ease: 'power2.out' });
        });
      }
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: {
        id: 'umbral-tft-timeline', trigger: container,
        refreshPriority: -30,
        start: () => 'top+=' + parseFloat(container.style.getPropertyValue('--tft-line-start')) + ' 65%',
        end: () => 'top+=' + (parseFloat(container.style.getPropertyValue('--tft-line-start')) +
          parseFloat(container.style.getPropertyValue('--tft-line-span'))) + ' 65%',
        scrub: true, invalidateOnRefresh: true, onUpdate: update, onRefresh: update
      }});
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        reveals.forEach(animation => animation?.kill());
        gsap.set([...copies, ...bubbles, line], { clearProps: 'opacity,visibility,transform' });
        nodes.forEach(node => node.classList.remove('is-active'));
      };
    });
  }
  ScrollTrigger.create({
    id: 'umbral-tft-environment', trigger: section, start: 'top 60%', end: 'bottom top',
    refreshPriority: -20,
    onToggle: trigger => document.body.classList.toggle('tft-in-view', trigger.isActive),
    onRefresh: trigger => document.body.classList.toggle('tft-in-view', trigger.isActive)
  });
  ScrollTrigger.refresh();
})();
