/* ============================================================
   EXPLAINLY — landing page interactions
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  const THEME_KEY = 'explainly-theme';
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  (function initTheme() {
    let t;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!t) t = matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
    setTheme(t);
  })();
  $('#themeToggle')?.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  /* ---------- Header scroll + mobile nav ---------- */
  const header = $('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  menuBtn?.addEventListener('click', () => navLinks.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ---------- Sign-in nav label ---------- */
  (function initSignin() {
    const link = $('#nav-signin');
    if (!link) return;
    try {
      if (localStorage.getItem('explainly_token')) {
        link.textContent = 'My Library';
        link.href = '/app/library.html';
      }
    } catch (e) {}
  })();

  /* ---------- Starfield ---------- */
  (function starfield() {
    const c = $('#starfield');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, stars = [], shooters = [];
    function accent() {
      return getComputedStyle(root).getPropertyValue('--a-glow').trim() || '#818cf8';
    }
    function rgb() {
      let hex = accent().replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    let col = rgb();
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
      const count = Math.min(950, Math.round(innerWidth * innerHeight / 2200));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        r: (Math.random() * 1.3 + 0.3) * dpr,
        tw: Math.random() * Math.PI * 2,
        ts: Math.random() * 0.04 + 0.01
      }));
    }
    function spawnShooter() {
      if (reduce) return;
      const fromLeft = Math.random() > 0.5;
      shooters.push({
        x: fromLeft ? -50 : w + 50, y: Math.random() * h * 0.5,
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4) * dpr,
        vy: (1.6 + Math.random() * 1.2) * dpr, life: 1
      });
    }
    let last = 0;
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = col;
      const light = root.getAttribute('data-theme') === 'light';
      for (const s of stars) {
        s.tw += s.ts;
        const a = (light ? 0.62 + Math.sin(s.tw) * 0.28 : 0.35 + Math.sin(s.tw) * 0.3) * s.z;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fill();
        s.y += s.z * 0.12 * dpr;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 6, sh.y - sh.vy * 6);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.9 * sh.life})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6); ctx.stroke();
        if (sh.life <= 0 || sh.x < -80 || sh.x > w + 80) shooters.splice(i, 1);
      }
      if (t - last > 4200 && Math.random() > 0.6) { spawnShooter(); last = t; }
      requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', resize);
    new MutationObserver(() => { col = rgb(); }).observe(root, { attributes: true, attributeFilter: ['data-accent'] });
    requestAnimationFrame(frame);
  })();

  /* ---------- Scroll reveal ---------- */
  (function reveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  })();

  /* ---------- Typewriter helper ---------- */
  function typewriter(el, text, { speed = 16, caret = true } = {}) {
    if (el._tw) cancelAnimationFrame(el._tw);
    if (reduce) { el.innerHTML = text; return Promise.resolve(); }
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      const c = document.createElement('span'); c.className = 'caret';
      el.appendChild(c);
      let acc = 0, lastT = performance.now();
      function step(now) {
        const dt = now - lastT; lastT = now;
        acc += dt / (1000 / (speed * 3));
        while (acc >= 1 && i < text.length) {
          c.insertAdjacentText('beforebegin', text[i]); i++; acc--;
        }
        if (i < text.length) { el._tw = requestAnimationFrame(step); }
        else { if (!caret) c.remove(); resolve(); }
      }
      el._tw = requestAnimationFrame(step);
    });
  }

  /* ---------- Modes interactive demo ---------- */
  const MODES = {
    eli5: {
      name: 'ELI5', icon: 'spark',
      tagline: 'Explain like I’m 5',
      text: 'Imagine two magic coins that are best friends. Flip one and it shows heads — the other instantly shows tails, even if it’s all the way on the Moon! They’re secretly connected, no matter how far apart.'
    },
    normal: {
      name: 'Normal', icon: 'chat',
      tagline: 'Clear, everyday language',
      text: 'Two particles can become linked so that measuring one immediately tells you about the other — no matter how far apart they are. It’s less about “sending a signal” and more about them sharing one connected state.'
    },
    deep: {
      name: 'Deep', icon: 'layers',
      tagline: 'Rigorous & technical',
      text: 'Entangled particles share a single, non-separable wavefunction. Measuring one collapses the joint state and correlates the outcomes — yet no usable information travels faster than light, preserving causality and special relativity.'
    },
    why: {
      name: 'Why?', icon: 'help',
      tagline: 'Why it’s hard to grasp',
      text: 'This line is dense for three reasons: it leans on the unexplained term “entangled,” it compresses a deeply counter-intuitive idea — “instantaneous influence” — into a few words, and it quietly omits the crucial caveat that no usable signal actually travels.'
    }
  };
  const ICONS = {
    spark: '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5M2 17.5l10 5 10-5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
    help: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4M12 17.2h.01" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
  };
  (function modesDemo() {
    const tabsWrap = $('#modeTabs'); if (!tabsWrap) return;
    const stream = $('#outStream');
    const ohIc = $('#ohIc'), ohName = $('#ohName'), ohTag = $('#ohTag');
    const ttsBtn = $('#ttsBtn');
    let current = 'normal';

    function render(key, { type = true } = {}) {
      const m = MODES[key]; current = key;
      $$('.mode-tab', tabsWrap).forEach(b =>
        b.setAttribute('aria-selected', b.dataset.mode === key ? 'true' : 'false'));
      ohIc.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[m.icon]}</svg>`;
      ohName.textContent = m.name;
      ohTag.textContent = m.tagline;
      stopTTS();
      if (type) typewriter(stream, m.text, { speed: 20, caret: false });
      else stream.textContent = m.text;
    }
    $$('.mode-tab', tabsWrap).forEach(b =>
      b.addEventListener('click', () => render(b.dataset.mode)));
    render('normal', { type: false });

    let played = false;
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !played) {
        played = true;
        typewriter(stream, MODES.normal.text, { speed: 22, caret: false });
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe($('#modes'));

    function stopTTS() {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      ttsBtn?.classList.remove('playing');
    }
    ttsBtn?.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return;
      if (ttsBtn.classList.contains('playing')) { stopTTS(); return; }
      const u = new SpeechSynthesisUtterance(MODES[current].text);
      u.rate = 1; u.onend = stopTTS;
      ttsBtn.classList.add('playing');
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
    addEventListener('beforeunload', stopTTS);
  })();

  /* ---------- Highlight → popup simulation ---------- */
  function popupSim(scope) {
    const body = $('.mock-body', scope);
    const hl = $('.hl', scope);
    const pop = $('.exp-pop', scope);
    const txt = $('.exp-text', scope);
    const modeEl = $('.exp-mode', scope);
    const launch = $('.exp-launch', scope);
    const dots = $$('.exp-tabs i', scope);
    if (!hl || !pop || !txt) return;
    let cycle;
    try { cycle = JSON.parse(pop.dataset.cycle || 'null'); } catch (e) { cycle = null; }
    if (!cycle || !cycle.length) {
      cycle = [{ mode: modeEl ? modeEl.textContent : '', i: -1,
        text: txt.dataset.text || 'A short, friendly explanation streams in — instantly.' }];
    }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function placeLaunch() {
      if (!launch) return;
      const bw = body.clientWidth;
      const x = clamp(hl.offsetLeft + 18, 14, bw - launch.offsetWidth - 14);
      launch.style.left = x + 'px';
      launch.style.top = (hl.offsetTop + hl.offsetHeight + 8) + 'px';
    }
    function placePop() {
      const bw = body.clientWidth;
      const bh = body.clientHeight;
      let top = hl.offsetTop + hl.offsetHeight + 10;
      const left = clamp(hl.offsetLeft + 18, 14, bw - pop.offsetWidth - 14);
      if (top + pop.offsetHeight > bh - 10) top = Math.max(10, bh - pop.offsetHeight - 10);
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';
      pop.style.right = 'auto';
    }
    let alive = false, running = false;
    async function loop() {
      running = true;
      while (alive) {
        hl.classList.remove('lit'); pop.classList.remove('show');
        launch && launch.classList.remove('show'); txt.textContent = '';
        await wait(650); if (!alive) break;
        hl.classList.add('lit');
        await wait(720); if (!alive) break;
        if (launch) { placeLaunch(); launch.classList.add('show'); }
        await wait(950); if (!alive) break;
        placePop();
        launch && launch.classList.remove('show');
        pop.classList.add('show');
        await wait(340);
        for (let k = 0; k < cycle.length; k++) {
          if (!alive) break;
          const step = cycle[k];
          if (modeEl) modeEl.textContent = step.mode;
          if (step.i >= 0) dots.forEach((d, j) => d.classList.toggle('on', j === step.i));
          txt.textContent = '';
          await typewriter(txt, step.text, { speed: 26, caret: true });
          if (!alive) break;
          await wait(1700);
        }
        pop.classList.remove('show');
        await wait(850);
      }
      running = false;
    }
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { alive = true; if (!running) loop(); }
      else { alive = false; }
    }, { threshold: 0.3 });
    io.observe(scope);
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  $$('[data-sim]').forEach(popupSim);

  /* ---------- Pricing: monthly / annual toggle ---------- */
  (function pricing() {
    const seg = $('#priceSeg'); if (!seg) return;
    const thumb = $('.thumb', seg);
    const btns = $$('button', seg);
    function move(btn) {
      thumb.style.left = btn.offsetLeft + 'px';
      thumb.style.width = btn.offsetWidth + 'px';
    }
    function apply(period) {
      btns.forEach(b => b.classList.toggle('on', b.dataset.period === period));
      move($(`button[data-period="${period}"]`, seg));
      $$('[data-m]').forEach(el => {
        const v = el.dataset[period === 'annual' ? 'a' : 'm'];
        if (v !== undefined) el.textContent = v;
      });
      $$('[data-sub-m]').forEach(el => {
        el.textContent = period === 'annual' ? el.dataset.subA : el.dataset.subM;
      });
      root.setAttribute('data-period', period);
    }
    btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.period)));
    requestAnimationFrame(() => apply('monthly'));
    addEventListener('resize', () => move($('button.on', seg)));
  })();

  /* ---------- Comparison table accordion ---------- */
  $('#cmpToggle')?.addEventListener('click', () => {
    $('#compare').classList.toggle('open');
  });
})();
