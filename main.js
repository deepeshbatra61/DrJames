/* ============================================================
   Caristo — main.js
   Steps 6 (animations), 7 (responsive/mobile menu),
   8 (form), 9 (ECG shader × 2 unique canvases)
   ============================================================ */

// ── Step 9: Unique-ID WebGL ECG heartbeat shader ─────────────
function createECGShader(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_resolution;

    float ekg(float x) {
      float period = 1.2;
      float t = mod(x, period);
      float beat = 0.0;
      beat += 0.07  * exp(-pow((t - 0.15) / 0.04,  2.0));
      beat -= 0.04  * exp(-pow((t - 0.30) / 0.02,  2.0));
      beat += 0.55  * exp(-pow((t - 0.36) / 0.018, 2.0));
      beat -= 0.09  * exp(-pow((t - 0.43) / 0.025, 2.0));
      beat += 0.12  * exp(-pow((t - 0.65) / 0.07,  2.0));
      beat += 0.03  * exp(-pow((t - 0.85) / 0.05,  2.0));
      return beat;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time * 0.1;
      float blipX = mod(t * 0.35, 1.0);
      float ekgY  = ekg(uv.x - t * 0.35) * 0.55 + 0.5;
      float dist  = abs(uv.y - ekgY);

      float glow = 0.0025 / (dist + 0.001);
      glow = clamp(glow, 0.0, 1.0);

      float blipDist      = abs(uv.x - blipX);
      float blipHighlight = smoothstep(0.04, 0.0, blipDist) * 0.35;
      glow += blipHighlight * smoothstep(0.04, 0.0, dist);

      vec3 lineColor = vec3(0.537, 0.616, 0.627);
      vec3 coreColor = vec3(0.847, 0.902, 0.910);
      vec3 col = mix(lineColor, coreColor, clamp(glow * 1.5, 0.0, 1.0));

      float gridX = mod(uv.x * 10.0, 1.0);
      float gridY = mod(uv.y * 10.0, 1.0);
      float grid  = max(smoothstep(0.95, 1.0, gridX), smoothstep(0.95, 1.0, gridY)) * 0.04;
      col += grid;

      float vig = pow(clamp(1.0 - length((uv - 0.5) * 1.4), 0.0, 1.0), 0.6);
      gl_FragColor = vec4(col * glow * vig, glow * vig * 0.95);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(vsSource, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(fsSource, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const quad   = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const posLoc  = gl.getAttribLocation(prog, 'a_position');
  const timeLoc = gl.getUniformLocation(prog, 'u_time');
  const resLoc  = gl.getUniformLocation(prog, 'u_resolution');

  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let start = null;
  function render(now) {
    if (!start) start = now;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, (now - start) * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// ── Step 7: Mobile menu ──────────────────────────────────────
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.hidden = false;
    void menu.offsetHeight;
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    toggle.querySelector('.material-symbols-outlined').textContent = 'close';
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    toggle.querySelector('.material-symbols-outlined').textContent = 'menu';
    setTimeout(() => { menu.hidden = true; }, 300);
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

// ── Step 6: Word-split headlines ─────────────────────────────
function initWordSplitHeadlines() {
  document.querySelectorAll('h1.word-split').forEach(h1 => {
    const text = h1.getAttribute('aria-label') || h1.textContent.trim();
    if (!text) return;
    h1.innerHTML = '';
    text.split(/\s+/).forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.style.animationDelay = (i * 0.07) + 's';
      h1.appendChild(span);
      h1.appendChild(document.createTextNode(' '));
    });
  });
}

// ── Step 6: Entrance animations via IntersectionObserver ──────
function initEntranceAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains('will-animate')) {
        el.classList.replace('will-animate', 'animate-entrance');
      } else if (el.classList.contains('will-animate-image')) {
        el.classList.replace('will-animate-image', 'animate-image');
      } else if (el.classList.contains('will-animate-line')) {
        el.classList.replace('will-animate-line', 'animate-line');
      } else if (el.tagName === 'H1') {
        el.classList.add('animate-words');
      }
      obs.unobserve(el);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.will-animate, .will-animate-image, .will-animate-line').forEach(el => obs.observe(el));

  // Hero h1 word-split trigger
  const h1 = document.querySelector('h1.word-split');
  if (h1) obs.observe(h1);
}

// ── Step 6: Number counters ──────────────────────────────────
function animateCounter(el, to, duration = 1800) {
  const suffix = el.dataset.suffix || '';
  const fmt = n => Math.round(n).toLocaleString() + suffix;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = fmt(to);
    return;
  }
  const start = performance.now();
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = fmt(easeOutCubic(p) * to);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(to);
  })(start);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target, parseInt(entry.target.dataset.counter, 10));
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => obs.observe(el));
}

// ── Slider (generic — handles any slider + prev/next pair) ───
function initSliderInstance(sliderId, btnLeftId, btnRightId) {
  const slider = document.getElementById(sliderId);
  const btnL   = document.getElementById(btnLeftId);
  const btnR   = document.getElementById(btnRightId);
  if (!slider) return;

  const items = Array.from(slider.querySelectorAll('.slider-item'));

  function updateActive() {
    const mid = slider.scrollLeft + slider.offsetWidth / 2;
    let closest = items[0], minDist = Infinity;
    items.forEach(item => {
      const d = Math.abs(item.offsetLeft + item.offsetWidth / 2 - mid);
      if (d < minDist) { minDist = d; closest = item; }
    });
    items.forEach(item => item.classList.toggle('is-active', item === closest));
  }

  slider.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  function scrollBy(dir) {
    const w = items[0] ? items[0].offsetWidth + 32 : 300;
    slider.scrollBy({ left: dir * w, behavior: 'smooth' });
  }

  if (btnL) btnL.addEventListener('click', () => scrollBy(-1));
  if (btnR) btnR.addEventListener('click', () => scrollBy(1));
}

function initSlider() {
  initSliderInstance('qual-slider',    'qual-slide-left',    'qual-slide-right');
  initSliderInstance('career-slider',  'career-slide-left',  'career-slide-right');
}

// ── Step 8: Form submit handler ──────────────────────────────
function initForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    await new Promise(r => setTimeout(r, 900));
    if (success) {
      success.hidden = false;
      success.focus();
    }
    btn.textContent = 'Sent';
    form.querySelectorAll('input, select').forEach(el => { el.disabled = true; });
  });
}

// ── Nav active link on scroll ────────────────────────────────
function initNavHighlight() {
  const links = document.querySelectorAll('nav a.nav-link');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
}

// ── 3D tilt (vanilla port of the Aceternity 3D-card effect) ──
function init3DTilt() {
  const scenes = document.querySelectorAll('[data-tilt]');
  if (!scenes.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  scenes.forEach(scene => {
    const card = scene.querySelector('[data-tilt-card]');
    if (!card) return;

    scene.addEventListener('mousemove', (e) => {
      if (reduce) return;
      const { left, top, width, height } = scene.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 20;
      const y = (e.clientY - top - height / 2) / 20;
      card.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    });
    scene.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  });
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createECGShader('ecg-expertise');
  createECGShader('ecg-career');
  createECGShader('ecg-contact');
  createECGShader('ecg-stats');

  initWordSplitHeadlines();
  initMobileMenu();
  initSlider();
  initForm();
  initCounters();
  init3DTilt();
  initNavHighlight();

  requestAnimationFrame(() => requestAnimationFrame(initEntranceAnimations));
});
