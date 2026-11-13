/* ==========================================================================
   FACE CLINIC — Fio narrativo (ponto que acompanha o scroll)
   --------------------------------------------------------------------------
   Um pequeno ponto dourado percorre a página como um fio que conecta as
   seções. A trajetória é montada a partir de âncoras no HTML:

     data-dot="point"   ponto (data-dot-x / data-dot-y = frações 0–1 do elemento)
     data-dot="rail"    trilho vertical (do topo à base do elemento)
     data-dot="end"     destino final (CTA)
     data-dot-zone="expand" | "halo"   estados visuais enquanto o ponto passa

   O ponto fica na altura de leitura da tela (≈ 50%) e desliza lateralmente
   seguindo a curva; a cauda dourada desenha o caminho recente.
   Recalcula em resize, carregamento de fontes/imagens e refresh do
   ScrollTrigger. Desativado em prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var wrap, svg, path, grad, dot;
  var lenis = null;
  var enabled = false;
  var segs = [];
  var zones = [];
  var startY = 0, endY = 0, vh = 0, maxScroll = 0, kEnd = 0.5;
  var cur = null, lastDrawn = null;
  var scale = 1;
  var flags = { visible: false, expanded: false, halo: false, arrived: false };
  var measureTimer = 0;
  var mqMobile = window.matchMedia('(max-width: 767px)');

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth01 = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var bez = function (p0, p1, p2, p3, t) {
    var u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  function create() {
    wrap = document.createElement('div');
    wrap.className = 'thread';
    wrap.setAttribute('aria-hidden', 'true');

    svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'thread__svg');
    svg.setAttribute('focusable', 'false');
    var defs = document.createElementNS(SVGNS, 'defs');
    grad = document.createElementNS(SVGNS, 'linearGradient');
    grad.setAttribute('id', 'threadGrad');
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    grad.setAttribute('x1', '0');
    grad.setAttribute('x2', '0');
    [['0', '0'], ['0.55', '0.28'], ['1', '0.9']].forEach(function (s) {
      var stop = document.createElementNS(SVGNS, 'stop');
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('stop-color', '#E0C48C');
      stop.setAttribute('stop-opacity', s[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('class', 'thread__path');
    path.setAttribute('stroke', 'url(#threadGrad)');
    svg.appendChild(path);

    dot = document.createElement('span');
    dot.className = 'thread__dot';
    dot.innerHTML = '<span class="thread__halo"></span>';

    wrap.appendChild(svg);
    wrap.appendChild(dot);
    document.body.appendChild(wrap);
  }

  function isShown(el) {
    if (!el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  /* Monta a trajetória a partir das âncoras visíveis. */
  function measure() {
    if (!enabled) return;
    var sy = window.scrollY || window.pageYOffset;
    var sx = window.scrollX || window.pageXOffset;
    var docEl = document.documentElement;
    vh = window.innerHeight;
    wrap.style.height = '0px';
    var docH = Math.max(docEl.scrollHeight, document.body.scrollHeight);
    maxScroll = Math.max(0, docH - vh);

    var raw = [];
    document.querySelectorAll('[data-dot]').forEach(function (el) {
      if (!isShown(el)) return;
      var r = el.getBoundingClientRect();
      var type = el.getAttribute('data-dot');
      var top = r.top + sy;
      var left = r.left + sx;
      if (type === 'rail') {
        var x = left + r.width / 2;
        raw.push({ x: x, y: top }, { x: x, y: top + r.height });
      } else {
        var fx = el.hasAttribute('data-dot-x') ? parseFloat(el.getAttribute('data-dot-x')) : 0.5;
        var fy = el.hasAttribute('data-dot-y') ? parseFloat(el.getAttribute('data-dot-y')) : 0.5;
        raw.push({ x: left + fx * r.width, y: top + fy * r.height, end: type === 'end' });
      }
    });
    raw.sort(function (a, b) { return a.y - b.y; });

    var endIdx = -1;
    raw.forEach(function (p, i) { if (p.end) endIdx = i; });
    if (endIdx >= 0) raw = raw.slice(0, endIdx + 1);

    var pts = [];
    raw.forEach(function (p) {
      var last = pts[pts.length - 1];
      if (last && p.y - last.y < 1) {
        if (p.end) { last.x = p.x; }
        return;
      }
      pts.push({ x: p.x, y: p.y });
    });

    segs = [];
    if (pts.length < 2) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], dy = b.y - a.y;
      segs.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, c1: a.y + dy * 0.5, c2: b.y - dy * 0.5 });
    }
    startY = pts[0].y;
    endY = pts[pts.length - 1].y;

    zones = [];
    document.querySelectorAll('[data-dot-zone]').forEach(function (el) {
      if (!isShown(el)) return;
      var r = el.getBoundingClientRect();
      zones.push({ type: el.getAttribute('data-dot-zone'), top: r.top + sy, bottom: r.bottom + sy, cy: r.top + sy + r.height / 2 });
    });

    // Garante que o destino final seja alcançável mesmo com pouco conteúdo abaixo dele.
    kEnd = clamp((endY - maxScroll) / vh + 0.02, 0.5, 0.94);

    wrap.style.height = docH + 'px';
    svg.setAttribute('width', String(docEl.clientWidth));
    svg.setAttribute('height', String(docH));
    lastDrawn = null;
  }

  function scheduleMeasure() {
    clearTimeout(measureTimer);
    measureTimer = setTimeout(measure, 160);
  }

  /* Altura de leitura: começa no indicador de scroll e estabiliza no meio da tela. */
  function targetFor(scroll) {
    var k = 0.84 + (0.5 - 0.84) * smooth01(scroll / (vh * 0.9));
    if (kEnd > 0.5) k += (kEnd - k) * smooth01((scroll - (maxScroll - vh)) / vh);
    return scroll + k * vh;
  }

  function pointAt(y) {
    if (y <= startY) return { x: segs[0].x0, y: startY };
    var last = segs[segs.length - 1];
    if (y >= endY) return { x: last.x1, y: endY };
    var lo = 0, hi = segs.length - 1;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (segs[mid].y1 < y) lo = mid + 1; else hi = mid;
    }
    var s = segs[lo];
    var t0 = 0, t1 = 1, t = 0.5;
    for (var i = 0; i < 20; i++) {
      t = (t0 + t1) / 2;
      if (bez(s.y0, s.c1, s.c2, s.y1, t) < y) t0 = t; else t1 = t;
    }
    return { x: bez(s.x0, s.x0, s.x1, s.x1, t), y: y };
  }

  function setFlag(name, value, cls) {
    if (flags[name] === value) return;
    flags[name] = value;
    wrap.classList.toggle(cls, value);
    if (name === 'arrived') {
      document.dispatchEvent(new CustomEvent('thread:arrive', { detail: { arrived: value } }));
    }
  }

  function tick() {
    if (!enabled || !segs.length) return;
    var scroll = lenis ? lenis.animatedScroll : (window.scrollY || window.pageYOffset);
    var target = targetFor(scroll);
    if (cur == null) cur = target;
    cur += (target - cur) * 0.2;
    if (Math.abs(target - cur) < 0.05) cur = target;

    var p = pointAt(cur);

    // Estados visuais
    var expand = false, halo = false;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (p.y < z.top || p.y > z.bottom) continue;
      if (z.type === 'expand') expand = true;
      if (z.type === 'halo' && Math.abs(p.y - z.cy) < vh * 0.2) halo = true;
    }
    var arrived = cur >= endY - 2;
    var targetScale = arrived ? 2.3 : expand ? 1.8 : halo ? 1.45 : 1;
    scale += (targetScale - scale) * 0.1;

    setFlag('expanded', expand && !arrived, 'is-expanded');
    setFlag('halo', halo && !arrived, 'is-halo');
    setFlag('arrived', arrived, 'is-arrived');

    if (lastDrawn && Math.abs(lastDrawn.y - p.y) < 0.02 && Math.abs(lastDrawn.s - scale) < 0.001) return;
    lastDrawn = { y: p.y, s: scale };

    dot.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,0) scale(' + scale.toFixed(3) + ')';

    // Cauda: desenha apenas o trecho recente do fio, com degradê.
    var tail = vh * (mqMobile.matches ? 0.45 : 0.85);
    var y0 = Math.max(startY, p.y - tail);
    if (p.y - y0 > 2) {
      var n = 32, d = '';
      for (var k = 0; k <= n; k++) {
        var q = pointAt(y0 + (p.y - y0) * (k / n));
        d += (k ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
      }
      path.setAttribute('d', d);
      grad.setAttribute('y1', y0.toFixed(1));
      grad.setAttribute('y2', p.y.toFixed(1));
    } else {
      path.setAttribute('d', '');
    }
  }

  window.ScrollDot = {
    init: function (opts) {
      if (enabled) return;
      var forced = document.documentElement.classList.contains('force-motion');
      if (!forced && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      opts = opts || {};
      lenis = opts.lenis || null;
      enabled = true;
      create();
      measure();

      if (window.gsap) window.gsap.ticker.add(tick);
      else (function loop() { tick(); requestAnimationFrame(loop); })();

      if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refresh', measure);
      window.addEventListener('resize', scheduleMeasure, { passive: true });
      window.addEventListener('load', measure);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);

      // Se a página já abriu rolada, mostra o ponto imediatamente.
      if ((window.scrollY || 0) > 40) this.reveal();
    },
    reveal: function () {
      if (enabled && wrap) setFlag('visible', true, 'is-visible');
    },
    measure: function () { if (enabled) measure(); },
  };
})();
