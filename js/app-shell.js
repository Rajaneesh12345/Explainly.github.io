/* ============================================================
   EXPLAINLY — app shell
   Shared across all app pages: tweaks, starfield, theme, toast
   ============================================================ */
(function () {
  'use strict';

  var TWEAK_STORE = 'explainly-app-tweaks';
  var tweaks = loadTweaks();

  function loadTweaks() {
    var def = { theme: 'dark', accent: 'indigo', font: 'humanist', card: 'elevated', radius: 'rounded' };
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(TWEAK_STORE) || '{}'); } catch (e) {}
    return Object.assign({}, def, saved);
  }

  function applyTweaks() {
    var root = document.documentElement;
    root.setAttribute('data-theme',  tweaks.theme);
    root.setAttribute('data-accent', tweaks.accent);
    root.setAttribute('data-font',   tweaks.font);
    root.setAttribute('data-card',   tweaks.card);
    root.setAttribute('data-radius', tweaks.radius);
    swapLogos(tweaks.accent);
  }

  function setTweak(key, val) {
    tweaks[key] = val;
    try { localStorage.setItem(TWEAK_STORE, JSON.stringify(tweaks)); } catch (e) {}
    applyTweaks();
    syncTweakUI();
  }

  function swapLogos(accent) {
    document.querySelectorAll('.brand-logo').forEach(function (img) {
      img.src = '/icons/logo-' + accent + '.png';
    });
  }

  // Apply immediately to avoid theme flash
  applyTweaks();

  /* ---- Toast (global) ---- */
  var _toastTimer;
  window.showToast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  };

  /* ---- DOM ready ---- */
  document.addEventListener('DOMContentLoaded', function () {

    // Theme toggles
    function toggleTheme() { setTweak('theme', tweaks.theme === 'light' ? 'dark' : 'light'); }
    var thSide = document.getElementById('theme-side');
    var thTop  = document.getElementById('theme-top');
    if (thSide) thSide.addEventListener('click', toggleTheme);
    if (thTop)  thTop.addEventListener('click',  toggleTheme);

    // Populate sidebar user info from auth helpers
    var email = (typeof getEmail === 'function') ? getEmail() : null;
    if (email) {
      var initial = email[0].toUpperCase();
      var el;
      el = document.getElementById('side-email');  if (el) el.textContent = email;
      el = document.getElementById('side-name');   if (el) el.textContent = email.split('@')[0];
      el = document.getElementById('side-avatar'); if (el) el.textContent = initial;
      el = document.getElementById('top-avatar');  if (el) el.textContent = initial;
    }

    // Open tweaks button
    var openBtn = document.getElementById('open-tweaks-btn');
    if (openBtn) openBtn.addEventListener('click', openPanel);

    // Tweaks panel (only if container exists)
    if (document.getElementById('tweaks-root')) buildPanel();

    // Starfield
    startStarfield();

    // Scroll reveal
    if (typeof IntersectionObserver !== 'undefined') {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
    }
  });

  /* ---- Starfield ---- */
  function startStarfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var root = document.documentElement;
    var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var w, h, dpr, stars = [], shooters = [];

    function getAccent() {
      return getComputedStyle(root).getPropertyValue('--a-glow').trim() || '#818cf8';
    }
    function hexToRgb() {
      var hex = getAccent().replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(function (x) { return x + x; }).join('');
      var n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var col = hexToRgb();

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width  = innerWidth  * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width  = innerWidth  + 'px';
      canvas.style.height = innerHeight + 'px';
      var count = Math.min(720, Math.round(innerWidth * innerHeight / 2800));
      stars = Array.from({ length: count }, function () {
        return {
          x: Math.random() * w, y: Math.random() * h,
          z: Math.random() * 0.8 + 0.2,
          r: (Math.random() * 1.2 + 0.3) * dpr,
          tw: Math.random() * Math.PI * 2, ts: Math.random() * 0.04 + 0.01,
        };
      });
    }

    function spawn() {
      if (reduce) return;
      var fl = Math.random() > 0.5;
      shooters.push({
        x: fl ? -50 : w + 50, y: Math.random() * h * 0.5,
        vx: (fl ? 1 : -1) * (5 + Math.random() * 4) * dpr,
        vy: (1.6 + Math.random() * 1.2) * dpr, life: 1,
      });
    }

    var last = 0;
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      var r = col[0], g = col[1], b = col[2];
      var light = root.getAttribute('data-theme') === 'light';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tw += s.ts;
        var a = (light ? 0.55 + Math.sin(s.tw) * 0.25 : 0.35 + Math.sin(s.tw) * 0.3) * s.z;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fill();
        s.y += s.z * 0.1 * dpr;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      }
      for (var j = shooters.length - 1; j >= 0; j--) {
        var sh = shooters[j];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 6, sh.y - sh.vy * 6);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.9 * sh.life) + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6); ctx.stroke();
        if (sh.life <= 0 || sh.x < -80 || sh.x > w + 80) shooters.splice(j, 1);
      }
      if (t - last > 4600 && Math.random() > 0.6) { spawn(); last = t; }
      requestAnimationFrame(frame);
    }

    resize();
    addEventListener('resize', resize);
    new MutationObserver(function () { col = hexToRgb(); })
      .observe(root, { attributes: true, attributeFilter: ['data-accent'] });
    requestAnimationFrame(frame);
  }

  /* ---- Tweaks panel ---- */
  var ACCENT_SW = { indigo: '#6366f1', navy: '#3b82f6', slate: '#5b9bd5', abyss: '#22d3ee', forest: '#22c55e' };

  function buildPanel() {
    var panelCSS = [
      '#tw-panel{position:fixed;right:18px;bottom:18px;z-index:90;width:300px;max-width:calc(100vw - 36px);',
      'border-radius:18px;background:var(--glass);border:1px solid var(--line-2);',
      'backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);',
      'box-shadow:var(--shadow);font-family:var(--body);color:var(--ink);display:none;overflow:hidden}',
      '#tw-panel.show{display:block}',
      '.tw-head{display:flex;align-items:center;gap:9px;padding:14px 16px;border-bottom:1px solid var(--line);cursor:grab}',
      '.tw-head b{font-family:var(--display);font-size:14px;font-weight:600}',
      '.tw-head .tw-dot{width:8px;height:8px;border-radius:50%;background:linear-gradient(var(--a1),var(--a2))}',
      '.tw-head .tw-x{margin-left:auto;display:grid;place-items:center;width:26px;height:26px;border-radius:8px;color:var(--ink-3)}',
      '.tw-head .tw-x:hover{background:var(--surface-2);color:var(--ink)}',
      '.tw-head .tw-x svg{width:15px;height:15px}',
      '.tw-body{padding:6px 16px 16px;max-height:min(70vh,520px);overflow-y:auto}',
      '.tw-sec{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);margin:16px 0 9px}',
      '.tw-seg{display:flex;gap:5px;flex-wrap:wrap}',
      '.tw-seg button{flex:1;min-width:fit-content;padding:8px 10px;border-radius:10px;border:1px solid var(--line);',
      'background:var(--surface);color:var(--ink-2);font-size:12.5px;font-weight:600;transition:.18s;white-space:nowrap}',
      '.tw-seg button:hover{border-color:var(--line-2);color:var(--ink)}',
      '.tw-seg button.on{color:#fff;background:linear-gradient(120deg,var(--a1),var(--a2));border-color:transparent}',
      '.tw-swatches{display:flex;gap:9px;flex-wrap:wrap}',
      '.tw-sw{width:38px;height:38px;border-radius:11px;border:2px solid transparent;cursor:pointer;position:relative;transition:.18s}',
      '.tw-sw:hover{transform:translateY(-2px)}',
      '.tw-sw.on{border-color:var(--ink)}',
      '.tw-sw.on::after{content:"";position:absolute;inset:0;border-radius:9px;box-shadow:0 0 0 2px var(--bg) inset}',
    ].join('');
    var st = document.createElement('style');
    st.textContent = panelCSS;
    document.head.appendChild(st);

    function seg(label, key, opts) {
      return '<div class="tw-sec">' + label + '</div>' +
        '<div class="tw-seg" data-key="' + key + '">' +
        opts.map(function (o) { return '<button data-v="' + o.v + '">' + o.l + '</button>'; }).join('') +
        '</div>';
    }

    var swatches = Object.keys(ACCENT_SW).map(function (a) {
      return '<button class="tw-sw" data-v="' + a + '" style="background:' + ACCENT_SW[a] + '" aria-label="' + a + '"></button>';
    }).join('');

    document.getElementById('tweaks-root').innerHTML =
      '<div id="tw-panel">' +
        '<div class="tw-head" id="tw-head"><span class="tw-dot"></span><b>Tweaks</b>' +
          '<button class="tw-x" id="tw-x" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="tw-body">' +
          seg('Theme', 'theme', [{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }]) +
          '<div class="tw-sec">Accent</div>' +
          '<div class="tw-swatches" data-key="accent">' + swatches + '</div>' +
          seg('Display font', 'font', [{ v: 'techy', l: 'Techy' }, { v: 'humanist', l: 'Humanist' }, { v: 'rounded', l: 'Rounded' }]) +
          seg('Card style', 'card', [{ v: 'elevated', l: 'Elevated' }, { v: 'outline', l: 'Outline' }, { v: 'glass', l: 'Glass' }]) +
          seg('Corner radius', 'radius', [{ v: 'sharp', l: 'Sharp' }, { v: 'rounded', l: 'Rounded' }, { v: 'soft', l: 'Soft' }]) +
        '</div>' +
      '</div>';

    document.querySelectorAll('#tw-panel .tw-seg').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        setTweak(g.dataset.key, b.dataset.v);
      });
    });
    document.querySelector('#tw-panel .tw-swatches').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setTweak('accent', b.dataset.v);
    });
    document.getElementById('tw-x').addEventListener('click', dismissPanel);
    makeDraggable(document.getElementById('tw-panel'), document.getElementById('tw-head'));
    syncTweakUI();
  }

  function syncTweakUI() {
    document.querySelectorAll('#tw-panel .tw-seg').forEach(function (g) {
      var k = g.dataset.key;
      g.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', b.dataset.v === tweaks[k]);
      });
    });
    document.querySelectorAll('#tw-panel .tw-sw').forEach(function (b) {
      b.classList.toggle('on', b.dataset.v === tweaks.accent);
    });
  }

  function openPanel()    { var p = document.getElementById('tw-panel'); if (p) p.classList.add('show'); }
  function dismissPanel() { var p = document.getElementById('tw-panel'); if (p) p.classList.remove('show'); }

  function makeDraggable(panel, handle) {
    var sx, sy, ox, oy, drag = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.tw-x')) return;
      drag = true; handle.setPointerCapture(e.pointerId);
      var r = panel.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      panel.style.transition = 'none';
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var nx = Math.max(8, Math.min(innerWidth  - panel.offsetWidth  - 8, ox + e.clientX - sx));
      var ny = Math.max(8, Math.min(innerHeight - 60,                     oy + e.clientY - sy));
      panel.style.left = nx + 'px'; panel.style.top = ny + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    handle.addEventListener('pointerup', function () { drag = false; });
  }

  // Host protocol
  window.addEventListener('message', function (e) {
    var t = e && e.data && e.data.type;
    if (t === '__activate_edit_mode')   openPanel();
    if (t === '__deactivate_edit_mode') dismissPanel();
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
