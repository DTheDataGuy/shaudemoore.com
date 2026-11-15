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

  // handwritten signature: writes itself once, when it scrolls into view
  const sig = $('.sig');
  if (sig) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { setTimeout(() => sig.classList.add('on'), 250); so.disconnect(); }
    }), { threshold: .6 });
    so.observe(sig);
  }

  // split MLK quote into words
  const q = $('.mlk__quote .words');
  if (q) {
    q.innerHTML = q.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  }

  // booking form
  const form = $('#book');
  if (form) {
    const status = $('.form__status', form), go = $('.form__go', form);
    const TO = 'shaudemoore89@gmail.com';
    const fields = [['name','Name'],['organization','Organization'],['email','Email'],['request_type','Type of request'],['event_date','Event date'],['location','Location'],['description','Description']];
    const data = () => Object.fromEntries(fields.map(([k]) => [k, (new FormData(form).get(k) || '').toString().trim()]));
    const mailto = d => {
      const body = fields.map(([k, l]) => `${l}: ${d[k] || ''}`).join('\n');
      return `mailto:${TO}?subject=${encodeURIComponent('Booking request: ' + (d.request_type || 'Inquiry') + (d.organization ? ' from ' + d.organization : ''))}&body=${encodeURIComponent(body)}`;
    };
    const check = () => {
      let first = null;
      $$('input[required]:not([type=radio]), textarea[required]', form).forEach(el => {
        const bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        el.setAttribute('aria-invalid', bad);
        if (bad && !first) first = el;
      });
      const chips = $('.chips', form), picked = $('input[name=request_type]:checked', form);
      chips.classList.toggle('is-invalid', !picked);
      if (!picked && !first) first = $('input[name=request_type]', form);
      return first;
    };
    $$('input, textarea', form).forEach(el => el.addEventListener('input', () => el.removeAttribute('aria-invalid')));
    $$('input[name=request_type]', form).forEach(el => el.addEventListener('change', () => $('.chips', form).classList.remove('is-invalid')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      const bad = check();
      if (bad) { status.classList.add('is-err'); status.textContent = 'Please add your name, a valid email, the type of request and a brief description.'; bad.focus(); return; }
      if (new FormData(form).get('_honey')) return;
      const d = data();
      go.disabled = true; status.textContent = 'Sending your request…';
      try {
        const r = await fetch('https://formsubmit.co/ajax/' + TO, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...d, _subject: 'New booking request from shaudemoore.pplx.app', _template: 'table', _captcha: 'false' })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'failed');
        form.classList.add('is-sent'); status.classList.add('is-ok');
        status.textContent = `Thank you, ${d.name.split(' ')[0]}. Your request is on its way to Shaudé, and she will be in touch soon.`;
      } catch (err) {
        status.classList.add('is-err');
        status.innerHTML = `The form could not send just now. <a href="${mailto(d)}">Email your request instead</a>; it opens with your details filled in.`;
      } finally { go.disabled = false; }
    });
  }

  const initGsap = () => {
    const g = window.gsap, ST = window.ScrollTrigger;
    if (!g || !ST || reduce || !$('#chron, .mlk__quote')) return;
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
    if ($('#chron')) mm.add('(min-width: 900px)', () => {
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
