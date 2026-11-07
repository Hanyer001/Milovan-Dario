'use strict';

(() => {
  const section = document.querySelector('.garage-section');
  if (!section) return;
  const { gsap } = window;
  const root = document.documentElement;
  const dialog = section.querySelector('.garage-lightbox');
  const panel = dialog.querySelector('.garage-modal-panel');
  const wash = dialog.querySelector('.garage-modal-wash');
  const modalBody = dialog.querySelector('.garage-modal-body');
  const closeButton = dialog.querySelector('.garage-close');
  const boxes = [...section.querySelectorAll('.diecast-box')];
  const videos = [...section.querySelectorAll('video')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 'idle';
  let activeBox = null;
  let activeContent = null;
  let opener = null;
  let animation = null;
  let scrollPosition = 0;
  let resumeLenis = false;
  let backdropDown = false;

  if ('IntersectionObserver' in window) {
    section.classList.add('garage-enhanced');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
    section.querySelectorAll('[data-garage-reveal]').forEach(element => observer.observe(element));
  }

  function stopVideo(video, reset = true) {
    video.pause();
    if (reset) {
      try { video.currentTime = 0; } catch { /* Un video sin metadatos no tiene posición reproducible. */ }
    }
  }
  function stopAll(reset = true) { videos.forEach(video => stopVideo(video, reset)); }

  function playVideo(box) {
    const video = box === activeBox ? activeContent?.querySelector('video') : null;
    if (!video || !dialog.open || phase === 'closing') return;
    const preview = activeContent.querySelector('.garage-representative');
    const source = video.getAttribute('src') || video.dataset.src;
    if (!source) { video.hidden = true; if (preview) preview.hidden = false; return; }
    if (!video.hasAttribute('src')) video.src = source;
    const status = activeContent.querySelector('.garage-media-status');
    if (status) status.hidden = true;
    video.hidden = false;
    if (preview) preview.hidden = true;
    const request = video.play();
    request?.catch(error => {
      if (activeBox !== box || !dialog.open || phase === 'closing' || error.name === 'AbortError') return;
      if (status) {
        status.hidden = false;
        status.textContent = error.name === 'NotAllowedError'
          ? 'Pulsa reproducir para ver el recuerdo.'
          : 'No se pudo reproducir este video.';
      }
      if (error.name !== 'NotAllowedError') {
        video.hidden = true;
        if (preview) preview.hidden = false;
      }
    });
  }

  function originTransform() {
    const source = opener.getBoundingClientRect();
    const width = panel.offsetWidth, height = panel.offsetHeight;
    return {
      x: source.left + source.width / 2 - (panel.offsetLeft + width / 2 - dialog.scrollLeft),
      y: source.top + source.height / 2 - (panel.offsetTop + height / 2 - dialog.scrollTop),
      scale: Math.max(.05, Math.min(source.width / Math.max(1, width), source.height / Math.max(1, height)))
    };
  }

  function finishClose() {
    if (phase === 'idle') return;
    animation?.kill();
    stopAll();
    if (activeContent && activeBox) {
      activeContent.hidden = true;
      activeBox.appendChild(activeContent);
      activeBox.classList.remove('is-open');
      activeBox.querySelector('.diecast-trigger').setAttribute('aria-expanded', 'false');
    }
    phase = 'idle';
    activeBox = null;
    activeContent = null;
    if (dialog.open) dialog.close();
    root.classList.remove('garage-locked');
    if (window.umbralLenis) {
      window.umbralLenis.resize();
      window.umbralLenis.scrollTo(scrollPosition, { immediate: true, force: true });
      if (resumeLenis) window.umbralLenis.start();
    } else window.scrollTo(0, scrollPosition);
    opener?.focus({ preventScroll: true });
    animation = null;
  }

  function closeMemory() {
    if (phase === 'idle' || phase === 'closing') return;
    phase = 'closing';
    stopAll();
    animation?.kill();
    if (!gsap || motion.matches) { finishClose(); return; }
    const target = originTransform();
    animation = gsap.timeline({ onComplete: finishClose })
      .to(panel, { ...target, opacity: 0, duration: .5, ease: 'power2.inOut' }, 0)
      .to(wash, { opacity: 0, duration: .48, ease: 'sine.inOut' }, 0);
  }

  function openMemory(box) {
    if (phase !== 'idle' || document.querySelector('dialog[open]')) return;
    const content = box.querySelector('.box-content');
    if (!content) return;
    stopAll();
    activeBox = box;
    activeContent = content;
    opener = box.querySelector('.diecast-trigger');
    scrollPosition = scrollY;
    resumeLenis = Boolean(window.umbralLenis && !window.umbralLenis.isStopped);
    phase = 'opening';
    try {
      window.umbralLenis?.stop();
      root.classList.add('garage-locked');
      section.querySelector('.garage-modal-number').textContent = 'RECUERDO ' + box.dataset.memory + ' / ESCALA 1:24';
      section.querySelector('#garage-modal-title').textContent = content.dataset.title;
      content.hidden = false;
      modalBody.replaceChildren(content);
      modalBody.scrollTop = 0;
      box.classList.add('is-open');
      opener.setAttribute('aria-expanded', 'true');
      if (gsap) gsap.set([panel, wash], { clearProps: 'transform,opacity,visibility' });
      dialog.showModal();
      closeButton.focus({ preventScroll: true });
      const image = content.querySelector('img');
      if (image) image.loading = 'eager';
      playVideo(box);
      if (!gsap || motion.matches) {
        if (gsap) gsap.set(wash, { opacity: 1 }); else wash.style.opacity = '1';
        phase = 'open';
        return;
      }
      const from = originTransform();
      gsap.set(panel, { ...from, opacity: .15, transformOrigin: 'center center' });
      gsap.set(wash, { opacity: 0 });
      animation = gsap.timeline({ onComplete() { phase = 'open'; } })
        .to(wash, { opacity: 1, duration: .65, ease: 'sine.inOut' }, 0)
        .to(panel, { x: 0, y: 0, scale: 1, opacity: 1, duration: .8, ease: 'power3.out' }, 0);
    } catch (error) {
      finishClose();
      console.error('No se pudo abrir el recuerdo:', error);
    }
  }

  boxes.forEach(box => {
    box.addEventListener('click', () => openMemory(box));
    const video = box.querySelector('video');
    if (!video) return;
    video.muted = true;
    video.loop = true;
    video.addEventListener('play', () => {
      if (activeBox !== box || !dialog.open || phase === 'closing') { stopVideo(video); return; }
      videos.filter(other => other !== video).forEach(other => stopVideo(other));
    });
  });

  closeButton.addEventListener('click', closeMemory);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeMemory(); });
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog; });
  dialog.addEventListener('pointerup', event => {
    if (backdropDown && event.target === dialog) closeMemory();
    backdropDown = false;
  });
  dialog.addEventListener('close', () => { if (!dialog.open) finishClose(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(false); });
  motion.addEventListener('change', event => { if (event.matches && animation) animation.progress(1); });
  window.addEventListener('pagehide', () => {
    if (phase !== 'idle') finishClose(); else stopAll();
  });
})();
