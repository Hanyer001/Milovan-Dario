'use strict';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

(() => {
  const gate = document.querySelector('#opening-gate');
  const button = gate.querySelector('.hold-button');
  const ball = gate.querySelector('.pokeball');
  const glow = gate.querySelector('.pokeball-glow');
  const status = gate.querySelector('#gate-status');
  const background = document.querySelectorAll('.gastly-viewer, main');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let input = null;
  let opening = false;
  let fallbackTimer;
  let nextShake = 0;

  background.forEach(element => { element.inert = true; });
  button.focus({ preventScroll: true });

  function reveal() {
    document.documentElement.classList.remove('opening-locked');
    window.scrollTo(0, 0);
    gate.remove();
    window.ScrollTrigger?.refresh();
    background.forEach(element => { element.inert = false; });
    document.querySelector('#titulo').focus({ preventScroll: true });
    document.dispatchEvent(new Event('umbral:open'));
  }

  function complete() {
    if (!input || opening) return;
    opening = true;
    input = null;
    listeners.abort();
    button.disabled = true;
    status.textContent = 'Abriendo el recorrido.';

    window.scrollTo(0, 0);

    if (!gsap) {
      reveal();
      return;
    }
    gsap.timeline({ onComplete: reveal })
      .to(ball, { x: 0, y: 0, scale: motion.matches ? 1 : 10, opacity: 0, duration: 0.42, ease: 'power3.in' }, 0)
      .to(gate, { opacity: 0, duration: 0.42, ease: 'power1.out' }, 0.18);
  }

  const charge = gsap?.timeline({
    paused: true,
    onComplete: complete,
    onUpdate() {
      const time = this.time();
      if (!input || motion.matches || time < nextShake) return;
      nextShake = time + 0.038;
      const amplitude = 1 + time * 2.5;
      gsap.set(ball, { x: gsap.utils.random(-amplitude, amplitude), y: gsap.utils.random(-amplitude, amplitude) });
    }
  });
  charge?.to(glow, { opacity: 1, duration: 2, ease: 'power1.in' }, 0);

  function start(kind, id) {
    if (input || opening) return;
    input = { kind, id };
    status.textContent = 'Cargando.';
    nextShake = 0;
    if (charge) {
      gsap.killTweensOf(ball);
      charge.timeScale(1).restart();
    } else {
      fallbackTimer = setTimeout(complete, 2000);
    }
  }

  function cancel() {
    if (!input || opening) return;
    input = null;
    status.textContent = 'Carga reiniciada.';
    clearTimeout(fallbackTimer);
    if (charge) {
      charge.timeScale(3).reverse();
      gsap.to(ball, { x: 0, y: 0, duration: 0.16, overwrite: 'auto' });
    }
  }

  button.addEventListener('mousedown', event => {
    if (event.button === 0) start('mouse');
  }, options);
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button === 0) button.setPointerCapture(event.pointerId);
  }, options);
  button.addEventListener('lostpointercapture', event => {
    if (event.pointerType === 'mouse' && input?.kind === 'mouse') cancel();
  }, options);
  window.addEventListener('mouseup', event => {
    if (event.button === 0 && input?.kind === 'mouse') cancel();
  }, options);
  button.addEventListener('touchstart', event => {
    event.preventDefault();
    if (event.touches.length === 1) start('touch', event.changedTouches[0].identifier);
  }, { ...options, passive: false });
  for (const type of ['touchend', 'touchcancel']) {
    window.addEventListener(type, event => {
      if (input?.kind === 'touch' && Array.from(event.changedTouches).some(touch => touch.identifier === input.id)) cancel();
    }, options);
  }
  button.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) start('keyboard', event.key);
  }, options);
  window.addEventListener('keyup', event => {
    if (input?.kind === 'keyboard' && input.id === event.key) cancel();
  }, options);
  button.addEventListener('click', event => {
    if (event.detail === 0) start('assistive');
  }, options);
  gate.addEventListener('contextmenu', event => event.preventDefault(), options);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') cancel();
    if (event.key === 'Tab') event.preventDefault();
  }, options);
  window.addEventListener('blur', cancel, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); }, options);
})();

