/* ==========================================================================
   FACE CLINIC — Orquestração
   --------------------------------------------------------------------------
   • Renderiza os dados (render.js)
   • Smooth scroll (Lenis) sincronizado com GSAP ScrollTrigger
   • Coreografia da hero, reveals, parallax, botões magnéticos
   • Tratamentos (seleção + cena 3D), diferenciais (pin), jornada, FAQ,
     menu mobile, mapa sob demanda, lightbox e WhatsApp flutuante
   • Fio narrativo (scroll-dot.js)
   Tudo funciona sem animação quando o usuário prefere movimento reduzido
   ou quando as bibliotecas externas não carregam.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var C = window.SITE_CONFIG || {};
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqDesktop = window.matchMedia('(min-width: 1024px)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

  var forceMotion = root.classList.contains('force-motion');
  var prefersReduce = mqReduce.matches && !forceMotion;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGSAP && root.classList.contains('motion-ok') && !prefersReduce;
  var lenis = null;
  var toothApi = null;

  /* 1. Dados ------------------------------------------------------------- */
  if (window.SiteRender) window.SiteRender.init();
  var Links = window.SiteLinks;

  /* 2. Flags de movimento ------------------------------------------------ */
  if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);
  if (motion) root.classList.add('motion-ready');
  else root.classList.remove('motion-ok');

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  var refreshTimer = 0;
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      if (hasGSAP) ST.refresh();
      if (window.ScrollDot) window.ScrollDot.measure();
    }, 120);
  }

  /* 3. Smooth scroll ----------------------------------------------------- */
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.095, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* 4. Âncoras ----------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      if (root.classList.contains('menu-open')) closeMenu(true);
      if (lenis) {
        lenis.scrollTo(target, { offset: 0, duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      } else {
        target.scrollIntoView({ behavior: prefersReduce ? 'auto' : 'smooth', block: 'start' });
      }
      if (history.replaceState) history.replaceState(null, '', id);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* 5. Navbar ------------------------------------------------------------ */
  function initNav() {
    var nav = $('[data-nav]');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-scrolled', (window.scrollY || 0) > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var links = $$('[data-nav-link]');
    var sections = $$('[data-section]');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-section');
        links.forEach(function (l) {
          if (l.getAttribute('data-nav-link') === id) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* 6. Menu mobile ------------------------------------------------------- */
  var menu = $('[data-menu]');
  var menuBtn = $('[data-menu-toggle]');
  var menuLabel = $('[data-menu-label]');
  var menuTl = null;
  var inertTargets = function () { return [$('main'), $('.footer'), $('[data-wa-float]')].filter(Boolean); };

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    root.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuLabel.textContent = 'Fechar menu';
    inertTargets().forEach(function (el) { el.inert = true; });
    if (lenis) lenis.stop();
    if (motion) {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline();
      menuTl.fromTo('.menu__bg', { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo('.menu__link', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.35)
        .fromTo('.menu__footer > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 0.55);
    }
    var first = $('.menu__link', menu);
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(instant) {
    if (!menu || menu.hidden) return;
    root.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuLabel.textContent = 'Abrir menu';
    inertTargets().forEach(function (el) { el.inert = false; });
    if (lenis) lenis.start();
    var finish = function () { menu.hidden = true; };
    if (motion && !instant) {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline({ onComplete: finish });
      menuTl.to('.menu__link, .menu__footer > *', { opacity: 0, y: -10, duration: 0.3, stagger: 0.02, ease: 'power2.in' })
        .to('.menu__bg', { clipPath: 'circle(0% at 92% 4%)', duration: 0.6, ease: 'expo.inOut' }, 0.1);
    } else {
      finish();
    }
  }

  function initMenu() {
    if (!menu || !menuBtn) return;
    menuBtn.addEventListener('click', function () {
      if (root.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); } else openMenu();
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && !e.target.closest('a[href^="#"]')) closeMenu(true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); }
    });
    mqDesktop.addEventListener('change', function (e) { if (e.matches) closeMenu(true); });
  }

  /* 7. Tratamentos ------------------------------------------------------- */
  var treat = { active: 0, lastUser: 0 };
  function initTreatments() {
    var items = $$('.treat-item');
    if (!items.length) return;
    var detail = $('[data-treat-detail]');
    var numEl = $('[data-detail-num]');
    var titleEl = $('[data-detail-title]');
    var textEl = $('[data-detail-text]');
    var linkEl = $('[data-detail-link]');
    var hoverTimer = 0;
    var swapTimer = 0;
    if (detail) detail.id = 'treat-detail';

    function fillDetail(i) {
      var t = C.treatments[i];
      if (!t || !detail) return;
      numEl.textContent = pad(i + 1) + ' / ' + pad(C.treatments.length);
      titleEl.textContent = t.name;
      textEl.textContent = t.description;
      linkEl.href = Links.treatment(t);
      linkEl.querySelector('span').textContent = t.kind === 'emergency' ? 'Solicitar orientação' : 'Agendar avaliação';
    }

    function syncA11y() {
      var desktop = mqDesktop.matches;
      items.forEach(function (el, i) {
        var btn = el.querySelector('.treat-item__btn');
        if (desktop) {
          btn.removeAttribute('aria-expanded');
          btn.setAttribute('aria-controls', 'treat-detail');
          btn.setAttribute('aria-pressed', String(i === treat.active));
        } else {
          btn.removeAttribute('aria-pressed');
          btn.setAttribute('aria-controls', 'treat-panel-' + i);
          btn.setAttribute('aria-expanded', String(el.classList.contains('is-open')));
        }
      });
    }

    function setActive(i, user) {
      if (user) treat.lastUser = performance.now();
      if (i === treat.active && detail && titleEl.textContent === C.treatments[i].name) return;
      treat.active = i;
      items.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      syncA11y();
      if (detail && mqDesktop.matches) {
        detail.classList.add('is-swapping');
        clearTimeout(swapTimer);
        swapTimer = setTimeout(function () { fillDetail(i); detail.classList.remove('is-swapping'); }, 260);
      } else {
        fillDetail(i);
      }
      if (toothApi) toothApi.focus(i);
    }

    items.forEach(function (el, i) {
      var btn = el.querySelector('.treat-item__btn');
      btn.addEventListener('click', function () {
        if (mqDesktop.matches) { setActive(i, true); return; }
        var willOpen = !el.classList.contains('is-open');
        items.forEach(function (o) { o.classList.remove('is-open'); });
        if (willOpen) el.classList.add('is-open');
        setActive(i, true);
        syncA11y();
        refreshSoon();
        setTimeout(refreshSoon, 650);
      });
      btn.addEventListener('pointerenter', function () {
        if (!mqDesktop.matches || !mqFine.matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setActive(i, true); }, 70);
      });
      btn.addEventListener('pointerleave', function () { clearTimeout(hoverTimer); });
      btn.addEventListener('focus', function () { if (mqDesktop.matches) setActive(i, true); });
    });

    fillDetail(0);
    syncA11y();
    mqDesktop.addEventListener('change', syncA11y);

    // Desktop: a lista acompanha a leitura enquanto a escultura fica fixa.
    if (hasGSAP) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', function () {
        items.forEach(function (el, i) {
          ST.create({
            trigger: el,
            start: 'top 58%',
            end: 'bottom 58%',
            onToggle: function (self) {
              if (self.isActive && performance.now() - treat.lastUser > 1600) setActive(i);
            },
          });
        });
      });
    }
  }

  /* 8. Cena 3D ----------------------------------------------------------- */
  function initTooth() {
    var stage = $('[data-tooth-stage]');
    if (!stage || !window.ToothScene) return;
    var started = false;
    var start = function () {
      if (started) return;
      started = true;
      window.ToothScene.mount(stage, { reduceMotion: !motion }).then(function (api) {
        toothApi = api;
        if (!api) return;
        api.focus(treat.active, true);
        var section = $('#tratamentos');
        if (hasGSAP) {
          ST.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: function (self) { api.setProgress(self.progress); },
          });
        }
      });
    };
    // Gera a geometria em tempo ocioso, depois do carregamento inicial.
    window.addEventListener('load', function () {
      var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1200); };
      idle(function () { window.ToothScene.prepare(); }, { timeout: 3000 });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { rootMargin: '900px 0px' });
      io.observe(stage);
    } else {
      start();
    }
  }

  /* 9. FAQ --------------------------------------------------------------- */
  function initFaq() {
    $$('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-item__btn');
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        setTimeout(refreshSoon, 600);
      });
    });
  }

  /* 10. Mapa sob demanda ------------------------------------------------- */
  function initMap() {
    var box = $('[data-map]');
    if (!box || !Links) return;
    var load = function () {
      if (box.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.src = Links.mapEmbed();
      f.title = 'Mapa com a localização da Face Clinic em ' + (C.address ? C.address.city : '');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      f.addEventListener('load', function () { box.classList.add('is-loaded'); });
      box.appendChild(f);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); load(); }
      }, { rootMargin: '600px 0px' });
      io.observe(box);
    } else {
      load();
    }
  }

  /* 11. Lightbox --------------------------------------------------------- */
  function initLightbox() {
    var dlg = $('[data-lightbox]');
    var openers = $$('[data-lightbox-open]');
    if (!dlg || !openers.length || typeof dlg.showModal !== 'function') return;
    var photos = (C.gallery || []).map(function (g, i) { return g.src ? { i: i, src: g.src, alt: g.alt, caption: g.caption } : null; }).filter(Boolean);
    var img = $('[data-lightbox-img]', dlg);
    var cap = $('[data-lightbox-caption]', dlg);
    var current = 0;
    var show = function (k) {
      current = (k + photos.length) % photos.length;
      var p = photos[current];
      img.src = p.src;
      img.alt = p.alt || '';
      cap.textContent = p.caption || '';
    };
    openers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = photos.findIndex(function (p) { return String(p.i) === btn.getAttribute('data-lightbox-open'); });
        show(idx < 0 ? 0 : idx);
        if (lenis) lenis.stop();
        dlg.showModal();
      });
    });
    $('[data-lightbox-prev]', dlg).addEventListener('click', function () { show(current - 1); });
    $('[data-lightbox-next]', dlg).addEventListener('click', function () { show(current + 1); });
    $('[data-lightbox-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    if (photos.length < 2) $$('.lightbox__nav', dlg).forEach(function (b) { b.hidden = true; });
  }

  /* 12. WhatsApp flutuante ----------------------------------------------- */
  function initWaFloat() {
    var fab = $('[data-wa-float]');
    var hero = $('.hero');
    if (!fab || !hero || !('IntersectionObserver' in window)) { if (fab) fab.classList.add('is-visible'); return; }
    var heroOut = false;
    var endIn = false;
    var update = function () { fab.classList.toggle('is-visible', heroOut && !endIn); };
    new IntersectionObserver(function (entries) {
      heroOut = entries[0].intersectionRatio < 0.35;
      update();
    }, { threshold: [0, 0.35, 0.6, 1] }).observe(hero);
    var ends = [$('.cta'), $('.footer')].filter(Boolean);
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      endIn = visible.size > 0;
      update();
    }, { rootMargin: '0px 0px -25% 0px' });
    ends.forEach(function (el) { io.observe(el); });
  }

  /* 13. Diferenciais: hover/foco escolhem a escultura -------------------- */
  var diff = { set: null };
  function initDifferentials() {
    var items = $$('.diff-item');
    var sculpts = $$('[data-sculpt]');
    var countEl = $('[data-diff-count]');
    var current = 0;
    diff.set = function (i) {
      if (i === current) return;
      current = i;
      items.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      sculpts.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      if (countEl) countEl.textContent = pad(i + 1);
    };
    items.forEach(function (el, i) {
      el.addEventListener('pointerenter', function () {
        if (mqDesktop.matches && !root.classList.contains('diff-pinned')) diff.set(i);
      });
    });
  }

  /* 14. Coreografia (somente com motion) --------------------------------- */
  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
    tl.from('.hero__glow', { opacity: 0, duration: 1.8, ease: 'power2.out' }, 0)
      .to('.hero__rings circle', { strokeDashoffset: 0, duration: 2.6, ease: 'expo.inOut', stagger: 0.25 }, 0.1)
      .fromTo('.hero__frame', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' }, 0.1)
      .fromTo('.hero__img', { scale: 1.28 }, { scale: 1.04, duration: 2.8, ease: 'expo.out' }, 0.25)
      .fromTo('.hero__arch', { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0.7)
      .to('[data-hero="eyebrow"]', { opacity: 1, duration: 1.2 }, 0.45)
      .fromTo('[data-hero="eyebrow"]', { y: 14 }, { y: 0, duration: 1.2 }, 0.45)
      .to('.hero__headline .ln > span', { y: 0, duration: 1.4, stagger: 0.12 }, 0.55)
      .fromTo('.hero__headline .script', { clipPath: 'inset(-30% 100% -40% -5%)' }, { clipPath: 'inset(-30% -10% -40% -5%)', duration: 1.6, ease: 'power2.inOut' }, 1.05)
      .fromTo('[data-hero="fade"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, 1.1)
      .fromTo('[data-hero="ctas"] > *', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.25)
      .fromTo('.seal', { opacity: 0, scale: 0.6, rotate: -60 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.6 }, 1.2)
      .fromTo('[data-hero="foot"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.45)
      .add(function () {
        var h = $('.hero__headline');
        if (h) h.classList.add('is-revealed');
        if (window.ScrollDot) window.ScrollDot.reveal();
      }, 1.9);

    // Saída cinematográfica da hero
    gsap.to('.hero__content', {
      y: -70, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('[data-hero-visual]', {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__frame picture', {
      scale: 1.1, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__rings', {
      rotate: 28, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.seal__text', {
      rotate: 220, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
    });
  }

  function reveals() {
    $$('[data-anim="lines"]').forEach(function (h) {
      gsap.to($$('.ln > span', h), {
        y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true },
        onComplete: function () { h.classList.add('is-revealed'); },
      });
    });

    ST.batch('[data-anim="fade-up"]', {
      start: 'top 92%',
      once: true,
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 1.15, ease: 'expo.out', stagger: 0.08, overwrite: true });
      },
    });

    $$('[data-anim="image"]').forEach(function (el) {
      var img = el.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
      if (img) tl.fromTo(img, { scale: 1.24 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.15);
    });

    $$('[data-anim="hairline"]').forEach(function (el) {
      gsap.to(el, { scaleX: 1, duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    $$('[data-anim="draw"]').forEach(function (el) {
      gsap.fromTo(el, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top 50%', end: 'bottom 50%', scrub: true },
      });
    });
  }

  function parallax() {
    $$('.about__frame picture, [data-parallax-img]').forEach(function (el) {
      var trigger = el.closest('[data-anim="image"]') || el.parentElement;
      gsap.fromTo(el, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: trigger, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.to('.about__ornament', {
      rotate: 140, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.to('[data-urgent-ring]', {
      rotate: 120, ease: 'none',
      scrollTrigger: { trigger: '.urgent', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.cta__rings', { rotate: -20, scale: 0.92 }, {
      rotate: 20, scale: 1.04, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  function magnetic() {
    if (!mqFine.matches) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      var strength = el.classList.contains('btn--xl') ? 0.32 : 0.22;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength * 1.4);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  function counters() {
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      el.textContent = pre + '0' + suf;
      gsap.to(o, {
        v: end, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = pre + Math.round(o.v) + suf; },
      });
    });
  }

  function diffPin() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (min-height: 720px)', function () {
      var section = $('.diff');
      var items = $$('.diff-item');
      var bar = $('[data-diff-bar]');
      var n = items.length;
      if (!n || !diff.set) return;
      root.classList.add('diff-pinned');
      section.classList.add('is-pinned');
      ST.create({
        trigger: '[data-diff-pin]',
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 0.55 * n); },
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          diff.set(Math.min(n - 1, Math.floor(self.progress * n)));
          if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
        },
      });
      return function () {
        root.classList.remove('diff-pinned');
        section.classList.remove('is-pinned');
      };
    });
  }

  function journey() {
    $$('.step').forEach(function (step) {
      ST.create({
        trigger: step.querySelector('.step__marker'),
        start: 'center 50%',
        onEnter: function () { step.classList.add('is-active'); },
        onLeaveBack: function () { step.classList.remove('is-active'); },
      });
    });
    var fill = $('[data-journey-fill]');
    if (fill) {
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.journey__line', start: 'top 50%', end: 'bottom 50%', scrub: true },
      });
    }
  }

  function ctaArrival() {
    var cta = $('.cta');
    if (!cta) return;
    document.addEventListener('thread:arrive', function (e) { cta.classList.toggle('is-lit', !!e.detail.arrived); });
    // Garantia caso o fio esteja oculto (ex.: telas sem âncoras visíveis)
    ST.create({
      trigger: '.cta__beacon',
      start: 'center 70%',
      onEnter: function () { cta.classList.add('is-lit'); },
    });
  }

  function staticFallbacks() {
    $$('.step').forEach(function (s) { s.classList.add('is-active'); });
    var cta = $('.cta');
    if (cta) cta.classList.add('is-lit');
  }

  /* 15. Inicialização ---------------------------------------------------- */
  initAnchors();
  initNav();
  initMenu();
  initTreatments();
  initDifferentials();
  initFaq();
  initMap();
  initLightbox();
  initWaFloat();
  initTooth();

  if (motion) {
    heroIntro();
    reveals();
    parallax();
    magnetic();
    counters();
    diffPin();
    journey();
    ctaArrival();
    if (window.ScrollDot) window.ScrollDot.init({ lenis: lenis });
  } else {
    staticFallbacks();
  }

  var refreshAll = function () { if (hasGSAP) ST.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAll);
  window.addEventListener('load', refreshAll);
})();
