'use strict';

(() => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const gate = document.querySelector('#opening-gate');
  const button = document.querySelector('.music-toggle');
  const tracks = ['pokemon', 'catolica', 'arcane', 'tokyo-drift'].map(name => ({ name, level: 0 }));
  const transitions = [
    { section: document.querySelector('#ucato'), start: 1, end: 0 },
    { section: document.querySelector('#league-of-legends'), start: 1, end: 0 },
    { section: document.querySelector('#garaje-de-recuerdos'), start: .72, end: .28 }
  ];
  const volume = .13;
  let context;
  let opened = false;
  let enabled = true;
  let frame;

  function scheduleMix() {
    if (!frame) frame = requestAnimationFrame(mix);
  }

  function load(track) {
    if (track.buffer || track.loading || track.failed) return;
    track.loading = fetch('./audio/' + track.name + '.mp3?v=level-1')
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .then(buffer => { track.buffer = buffer; })
      .catch(error => {
        track.failed = true;
        console.warn('No se pudo cargar la música de ' + track.name + '.', error);
      })
      .finally(() => {
        track.loading = null;
        scheduleMix();
      });
  }

  function setLevel(track, level) {
    if (level > 0 && !track.source) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = track.buffer;
      source.loop = true;
      gain.gain.value = 0;
      source.connect(gain).connect(context.destination);
      source.start();
      track.source = source;
      track.gain = gain;
    }
    if (track.level === level) return;
    track.level = level;
    clearTimeout(track.stopTimer);
    track.gain.gain.setTargetAtTime(level * volume, context.currentTime, .11);
    if (level === 0) {
      track.stopTimer = setTimeout(() => {
        track.source.stop();
        track.source.disconnect();
        track.gain.disconnect();
        track.source = track.gain = null;
      }, 650);
    }
  }

  function mix() {
    frame = null;
    if (!context) return;
    if (!opened || !enabled || document.hidden) {
      tracks.forEach(track => setLevel(track, 0));
      return;
    }

    const height = window.innerHeight;
    let index = 0;
    let progress = 0;
    // Keep the mix tied to the visible chapter, even if a pin changes the page height.
    transitions.forEach(({ section, start, end }, position) => {
      const fraction = (start - section.getBoundingClientRect().top / height) / (start - end);
      if (fraction >= 1) {
        index = position + 1;
        progress = 0;
      } else if (fraction > 0) {
        index = position;
        progress = fraction * fraction * (3 - 2 * fraction);
      }
    });

    const current = tracks[index];
    const next = tracks[index + 1];
    load(current);
    if (next) load(next);

    // Keep the outgoing track audible while the incoming audio is still loading.
    if (!current.buffer && !(progress && next?.buffer)) return;
    const blend = progress && next?.buffer ? progress : 0;
    tracks.forEach(track => {
      const level = track === current && current.buffer ? 1 - blend
        : track === next && blend ? (current.buffer ? blend : 1)
        : 0;
      setLevel(track, level);
    });
  }

  function unlock(event) {
    if (!event.isTrusted || !enabled || (!opened && !gate.contains(event.target))) return;
    if (!context) {
      context = new AudioContext({ sampleRate: 24000 });
      load(tracks[0]);
    }
    if (context.state !== 'running') context.resume().then(scheduleMix).catch(() => {});
  }

  for (const type of ['mousedown', 'keydown', 'touchstart', 'touchend', 'click']) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
  document.addEventListener('umbral:open', () => {
    opened = true;
    button.hidden = false;
    scheduleMix();
  }, { once: true });
  button.addEventListener('click', event => {
    enabled = !enabled;
    button.setAttribute('aria-pressed', String(enabled));
    if (enabled) unlock(event);
    scheduleMix();
  });
  window.addEventListener('scroll', scheduleMix, { passive: true });
  window.addEventListener('resize', scheduleMix);
  window.ScrollTrigger?.addEventListener('refresh', scheduleMix);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      tracks.forEach(track => setLevel(track, 0));
    } else {
      scheduleMix();
    }
  });
})();
