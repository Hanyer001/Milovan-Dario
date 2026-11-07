'use strict';

(() => {
  const dialog = document.querySelector('#creator-letter-dialog');
  const title = dialog.querySelector('#letter-dialog-title');
  const envelope = dialog.querySelector('.letter-envelope');
  const flap = dialog.querySelector('.envelope-flap');
  const seal = dialog.querySelector('.envelope-seal');
  const sealImage = seal.querySelector('img');
  const paper = dialog.querySelector('.letter-paper');
  const detail = paper.querySelector('.letter-paper-detail img');
  const body = paper.querySelector('.letter-body');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const authors = {
    hanyer: { name: 'Hanyer Alegría', pokemon: 'Garchomp', sprite: 'garchomp.png' },
    ronald: { name: 'Ronald Villamán', pokemon: 'Charizard', sprite: 'charizard.png' },
    alessandro: { name: 'Alessandro Molina', pokemon: 'Blastoise', sprite: 'blastoise.png' }
  };
  let animation;
  let scrollPosition = 0;
  let opener;

  function reset() {
    animation?.kill();
    animation = null;
    envelope.hidden = false;
    paper.hidden = true;
    paper.inert = true;
    seal.disabled = false;
    if (window.gsap) gsap.set([envelope, flap, seal, paper], { clearProps: 'transform,opacity,visibility' });
    paper.scrollTop = 0;
  }

  document.querySelectorAll('[data-letter]').forEach(button => {
    button.addEventListener('click', () => {
      if (dialog.open) return;
      const key = button.dataset.letter;
      const author = authors[key];
      reset();
      opener = button;
      dialog.dataset.author = key;
      title.textContent = 'Carta de ' + author.name;
      sealImage.src = './imagenes/' + author.sprite;
      sealImage.alt = author.pokemon;
      detail.src = sealImage.src;
      body.replaceChildren(document.querySelector('#letter-' + key).content.cloneNode(true));
      scrollPosition = window.scrollY;
      document.documentElement.classList.add('letter-locked');
      dialog.showModal();
      seal.focus({ preventScroll: true });
    });
  });

  seal.addEventListener('click', () => {
    if (seal.disabled) return;
    seal.disabled = true;
    paper.hidden = false;
    function finish() {
      envelope.hidden = true;
      paper.inert = false;
      paper.focus({ preventScroll: true });
    }
    if (!window.gsap || motion.matches) {
      finish();
      return;
    }
    gsap.set(paper, { opacity: 0, y: 64, scale: 0.96 });
    animation = gsap.timeline({ onComplete: finish })
      .to(seal, { opacity: 0, scale: 0.75, duration: 0.22 }, 0)
      .to(flap, { rotationX: -175, duration: 0.5, ease: 'power2.inOut' }, 0.08)
      .to(envelope, { opacity: 0, y: 45, duration: 0.34 }, 0.38)
      .to(paper, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, 0.42);
  });

  dialog.querySelector('.letter-dismiss').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    animation?.kill();
    document.documentElement.classList.remove('letter-locked');
    window.scrollTo(0, scrollPosition);
    opener?.focus({ preventScroll: true });
    reset();
  });
})();

