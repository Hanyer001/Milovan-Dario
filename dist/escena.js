'use strict';

(() => {
  const viewer = document.querySelector('.gastly-viewer');
  if (!viewer) return;
  const root = document.documentElement;
  const dialog = document.querySelector('.letter-dialog');

  function updatePlayback() {
    // Viewer 2.0.151 conserva Application en _spline; stop/play suspenden su RAF y eventos.
    const application = viewer._spline;
    if (!application || typeof application.stop !== 'function' || typeof application.play !== 'function') return;
    const visible = !document.hidden && !root.classList.contains('opening-locked') &&
      !dialog?.open && viewer.style.visibility !== 'hidden' &&
      (viewer.style.opacity === '' || Number(viewer.style.opacity) > 0);
    if (visible && application.isStopped) application.play();
    else if (!visible && !application.isStopped) application.stop();
  }

  // Leer solo estilos inline evita forzar getComputedStyle o medir el layout durante el scroll.
  const observer = new MutationObserver(updatePlayback);
  observer.observe(viewer, { attributes: true, attributeFilter: ['style'] });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  if (dialog) observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  viewer.addEventListener('load-complete', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
  window.addEventListener('pagehide', () => viewer._spline?.stop());
  window.addEventListener('pageshow', updatePlayback);
  updatePlayback();
})();
