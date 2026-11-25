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
  const sigs = document.querySelectorAll('.sig');
  if (sigs.length) {
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const t = e.target; setTimeout(() => t.classList.add('on'), 350); so.unobserve(t); }
    }), { threshold: .6 });
    sigs.forEach(s => so.observe(s));
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
          body: JSON.stringify({ ...d, _subject: 'New booking request from shaudemoore.com', _template: 'table', _captcha: 'false' })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'failed');
        form.classList.add('is-sent'); status.classList.add('is-ok');
        status.textContent = `Thank you, ${d.name.split(' ')[0]}. Your request is on its way to Shaudé, and she will be in touch soon.`;
      } catch (err) {
        status.classList.add('is-err');
        status.innerHTML = 'The form could not send just now. Please try again in a moment, or reach Shaudé on <a href="https://www.linkedin.com/in/shaude-moore-edd-candidate-0b251350" target="_blank" rel="noopener">LinkedIn</a>.';
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

// ---------- Impact metrics: live totals, count-up, details dialog ----------
(() => {
  const vals = [...document.querySelectorAll('[data-metric]')];
  if (!vals.length) return;
  const CSV = 'https://docs.google.com/spreadsheets/d/1Ayxf8ZI1YFEPSxzEi8hEIhzA0rpd8LubALV8D7vsvp0/gviz/tq?tqx=out:csv&sheet=Website%20Totals';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const run = el => {
    const to = +el.dataset.target || 0;
    if (reduce) { el.textContent = fmt(to); el.dataset.done = 1; return; }
    const from = el.dataset.done ? (+el.textContent.replace(/,/g, '') || 0) : 0;
    const t0 = performance.now(), d = el.dataset.done ? 700 : 1800;
    const step = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); el.dataset.done = 1;
  };
  if (!reduce) vals.forEach(el => { el.textContent = '0'; });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.dataset.seen = 1; run(e.target); io.unobserve(e.target); }
  }), { threshold: .4 });
  vals.forEach(el => io.observe(el));

  // live totals from the engagement tracker
  const parse = t => t.trim().split(/\r?\n/).map(r => (r.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [])
    .map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')));
  fetch(CSV, { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject()).then(t => {
    parse(t).slice(1).forEach(([k, , v]) => {
      if (k === 'updated') { if (v) document.querySelectorAll('[data-metric-updated]').forEach(n => n.textContent = v); return; }
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      if (!isFinite(n) || n <= 0) return;
      document.querySelectorAll(`[data-metric="${k}"]`).forEach(el => {
        if (+el.dataset.target === n) return;
        el.dataset.target = n; if (el.dataset.seen || reduce) run(el);
      });
    });
  }).catch(() => {});

  // details dialog
  const dlg = document.getElementById('imd'), src = document.getElementById('impact-data');
  if (!dlg || !src) return;
  const data = JSON.parse(src.textContent); let opener = null;
  const html = s => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; };
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.open, m = data[k], v = document.querySelector(`[data-metric="${k}"]`);
    dlg.querySelector('#imd-g').textContent = html(m.group);
    const n = dlg.querySelector('#imd-n'); n.textContent = fmt(+v.dataset.target);
    if (m.suf) { const s = document.createElement('span'); s.textContent = m.suf; n.append(s); }
    dlg.querySelector('#imd-t').textContent = html(m.label);
    dlg.querySelector('#imd-d').textContent = html(m.desc);
    const c = dlg.querySelector('#imd-c'); c.replaceChildren(...m.types.map(t => { const li = document.createElement('li'); li.textContent = html(t); return li; }));
    opener = b; dlg.showModal();
  }));
  dlg.addEventListener('click', e => { if (e.target !== dlg) return; const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
  dlg.addEventListener('close', () => opener && opener.focus());
})();
