(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // masthead stagger
  $$('.mast span').forEach((s, i) => s.style.setProperty('--i', i));

  // bar + progress
  const bar = $('#bar');
  const prog = $('.progress span');
  const onScroll = () => {
    const y = scrollY;
    bar.classList.toggle('is-solid', y > 60);
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // active nav
  const links = $$('.bar__nav a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const so = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => so.observe(s));

  // mobile menu
  const btn = $('.bar__menu'), menu = $('#menu');
  const setMenu = open => {
    btn.setAttribute('aria-expanded', open);
    btn.querySelector('.sr').textContent = open ? 'Close menu' : 'Open menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 550); }
  };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); } });

  // reveals
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.rv, .rv-clip').forEach(el => io.observe(el));

  // split MLK quote into words
  const q = $('.mlk__quote .words');
  if (q) {
    q.innerHTML = q.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  }

  const initGsap = () => {
    const g = window.gsap, ST = window.ScrollTrigger;
    if (!g || !ST || reduce) return;
    g.registerPlugin(ST);

    // MLK words light up as you read
    const words = $$('.mlk__quote .w');
    if (words.length) {
      g.set(words, { opacity: .2 });
      g.to(words, { opacity: 1, stagger: .05, ease: 'none',
        scrollTrigger: { trigger: '.mlk__quote', start: 'top 80%', end: 'bottom 45%', scrub: .4 } });
    }

    // pinned horizontal chronology on wide screens
    const mm = g.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const chron = $('#chron'), track = $('.chron__track', chron), list = $('.chron__list', chron), rule = $('.chron__rule span', chron);
      chron.classList.add('is-pinned');
      const dist = () => Math.max(0, list.scrollWidth - track.clientWidth);
      const tw = g.to(list, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: chron, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true,
          onUpdate: s => { rule.style.transform = `scaleX(${s.progress})`; } } });
      return () => { chron.classList.remove('is-pinned'); tw.kill(); g.set(list, { clearProps: 'x' }); };
    });
    document.fonts && document.fonts.ready.then(() => ST.refresh());
  };
  if (document.readyState === 'complete') initGsap(); else addEventListener('load', initGsap);
})();
