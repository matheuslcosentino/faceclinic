/* ==========================================================================
   FACE CLINIC — Renderização
   Lê window.SITE_CONFIG (config.js) e preenche o HTML: links de WhatsApp,
   mapa, Instagram, listas de tratamentos, diferenciais, jornada, galeria,
   confiança, avaliações, FAQ, horários e rodapé.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.SITE_CONFIG;
  if (!C) {
    console.warn('[Face Clinic] config.js não foi carregado.');
    return;
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var get = function (path) {
    return path.split('.').reduce(function (obj, key) { return obj == null ? obj : obj[key]; }, C);
  };
  var icon = function (id, fill) {
    return '<svg class="icon' + (fill ? ' icon--fill' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + id + '"></use></svg>';
  };
  var ext = ' target="_blank" rel="noopener"';

  /* ---------- Links -------------------------------------------------------- */
  var Links = {
    wa: function (message) {
      return 'https://wa.me/' + C.contact.whatsapp.number + '?text=' + encodeURIComponent(message);
    },
    schedule: function () { return Links.wa(C.messages.schedule); },
    emergency: function () { return Links.wa(C.messages.emergency); },
    treatment: function (t) {
      if (t.kind === 'emergency') return Links.emergency();
      return Links.wa(C.messages.treatment.replace('{tratamento}', t.topic || t.name.toLowerCase()));
    },
    maps: function () {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(C.address.mapsQuery);
    },
    mapEmbed: function () {
      return 'https://maps.google.com/maps?q=' + encodeURIComponent(C.address.mapsQuery) + '&z=16&hl=pt-BR&output=embed';
    },
    instagram: function () { return C.contact.instagram ? C.contact.instagram.url : null; },
    email: function () { return C.contact.email ? 'mailto:' + C.contact.email : null; },
    phone: function () { return C.contact.phone ? 'tel:' + C.contact.phone.number : null; },
  };
  window.SiteLinks = Links;

  var A = C.address;
  var streetLine = function () { return [A.street, A.complement, A.district].filter(Boolean).join(', '); };
  var cityLine = function () { return A.city + ' – ' + A.state; };
  var fullAddress = function () { return streetLine() + ', ' + cityLine() + ', CEP ' + A.zip; };
  var hasEmergency = !!(C.emergency && C.emergency.available);

  /* ---------- Esculturas (diferenciais) ------------------------------------ */
  function sculpture(k) {
    switch (k % 4) {
      case 0:
        return '<div class="sculpt"><div class="sculpt__floor"></div><div class="sculpt__float">' +
          '<span class="ring" style="left:10%;top:42%;width:80%;height:19%;transform:rotate(-14deg)"></span>' +
          '<span class="orb" style="left:29%;top:22%;width:42%;height:42%"></span>' +
          '<span class="ring" style="left:10%;top:42%;width:80%;height:19%;transform:rotate(-14deg);clip-path:inset(50% 0 0 0)"></span>' +
          '<span class="orb orb--gold" style="left:80%;top:35.5%;width:5%;height:5%"></span>' +
          '</div></div>';
      case 1:
        return '<div class="sculpt"><div class="sculpt__floor" style="width:58%"></div><div class="sculpt__float">' +
          '<span class="arch" style="left:15%;top:20%;width:70%;height:58%"></span>' +
          '<span class="arch" style="left:24%;top:32%;width:52%;height:46%;opacity:.65"></span>' +
          '<span class="arch arch--solid" style="left:33%;top:44%;width:34%;height:34%"></span>' +
          '<span class="orb" style="left:44.5%;top:66.5%;width:11%;height:11%"></span>' +
          '<span class="baseline" style="left:6%;right:6%;top:78%"></span>' +
          '</div></div>';
      case 2:
        return '<div class="sculpt"><div class="sculpt__floor" style="width:56%"></div><div class="sculpt__float">' +
          '<span class="ring" style="left:15%;top:21%;width:54%;height:54%;opacity:.35"></span>' +
          '<span class="orb" style="left:20%;top:26%;width:44%;height:44%"></span>' +
          '<span class="orb" style="left:57%;top:46%;width:24%;height:24%"></span>' +
          '</div></div>';
      default:
        return '<div class="sculpt"><div class="sculpt__floor"></div><div class="sculpt__float">' +
          '<span class="arch" style="left:27%;top:14%;width:46%;height:33%;opacity:.55"></span>' +
          '<span class="orb orb--gold" style="left:39%;top:30%;width:22%;height:22%"></span>' +
          '<span class="bowl" style="left:21%;top:47%;width:58%;height:28%"></span>' +
          '</div></div>';
    }
  }

  /* ---------- Blocos ------------------------------------------------------- */
  function bindLinks() {
    $$('[data-wa]').forEach(function (a) {
      a.href = a.getAttribute('data-wa') === 'emergency' ? Links.emergency() : Links.schedule();
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('[data-maps]').forEach(function (a) { a.href = Links.maps(); });
    $$('[data-instagram]').forEach(function (a) {
      var url = Links.instagram();
      if (url) a.href = url; else a.remove();
    });
    $$('[data-bind]').forEach(function (el) {
      var v = get(el.getAttribute('data-bind'));
      if (v != null && v !== '') el.textContent = v;
    });
    if (!hasEmergency) $$('[data-if="emergency"]').forEach(function (el) { el.remove(); });
    if (hasEmergency && C.emergency.is24h) {
      var note = $('[data-urgent-note]');
      if (note) note.innerHTML = 'Atendimento de urgência <span class="badge-24">24 horas</span>';
    }
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function renderStats() {
    var dl = $('[data-render="stats"]');
    if (!dl) return;
    var stats = C.stats || [];
    if (!stats.length) { dl.remove(); return; }
    dl.innerHTML = stats.map(function (s) {
      return '<div class="stat"><dt class="stat__label">' + esc(s.label) + '</dt>' +
        '<dd class="stat__value"><span data-count="' + esc(s.value) + '" data-prefix="' + esc(s.prefix || '') + '" data-suffix="' + esc(s.suffix || '') + '">' +
        esc((s.prefix || '') + s.value + (s.suffix || '')) + '</span></dd></div>';
    }).join('');
  }

  function renderTreatments() {
    var list = $('[data-render="treatments"]');
    if (!list) return;
    list.setAttribute('role', 'list');
    list.innerHTML = C.treatments.map(function (t, i) {
      var cta = t.kind === 'emergency' ? 'Solicitar orientação' : 'Agendar avaliação';
      return '<li class="treat-item' + (i === 0 ? ' is-active' : '') + '" data-treat-index="' + i + '">' +
        '<button class="treat-item__btn" type="button" id="treat-btn-' + i + '" aria-controls="treat-panel-' + i + '" aria-expanded="false">' +
        '<span class="treat-item__num">' + pad(i + 1) + '</span>' +
        '<span class="treat-item__line" aria-hidden="true"></span>' +
        '<span class="treat-item__name"><span class="treat-item__title">' + esc(t.name) + '</span>' +
        (t.note ? '<span class="treat-item__note">' + esc(t.note) + '</span>' : '') + '</span>' +
        '<span class="treat-item__icon" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="treat-item__panel" id="treat-panel-' + i + '"><div><div class="treat-item__panel-inner">' +
        (t.image ? '<img src="' + esc(t.image) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<p>' + esc(t.description) + '</p>' +
        '<a class="link-arrow link-arrow--light" href="' + Links.treatment(t) + '"' + ext + '><span>' + cta + '</span>' + icon('arrow-up-right') + '</a>' +
        '</div></div></div></li>';
    }).join('');
  }

  function renderDifferentials() {
    var list = $('[data-render="differentials"]');
    var stage = $('[data-diff-stage]');
    var items = C.differentials || [];
    if (!list) return;
    list.setAttribute('role', 'list');
    list.innerHTML = items.map(function (d, i) {
      return '<li class="diff-item' + (i === 0 ? ' is-active' : '') + '" data-diff-index="' + i + '">' +
        '<span class="diff-item__num">' + pad(i + 1) + '</span>' +
        '<div class="diff-item__body"><h3 class="diff-item__title">' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p></div>' +
        '<span class="diff-item__art" aria-hidden="true">' + sculpture(i) + '</span></li>';
    }).join('');
    if (stage) {
      stage.innerHTML = items.map(function (d, i) {
        return '<div class="sculpt-wrap' + (i === 0 ? ' is-active' : '') + '" data-sculpt="' + i + '">' + sculpture(i) + '</div>';
      }).join('');
    }
    var total = $('[data-diff-total]');
    if (total) total.textContent = pad(items.length);
  }

  function renderJourney() {
    var list = $('[data-render="journey"]');
    if (!list) return;
    list.setAttribute('role', 'list');
    list.innerHTML = (C.journey || []).map(function (s, i) {
      return '<li class="step">' +
        '<span class="step__marker" aria-hidden="true"></span>' +
        '<span class="step__num" aria-hidden="true">' + pad(i + 1) + '</span>' +
        '<h3 class="step__title"><span class="sr-only">Etapa ' + (i + 1) + ': </span>' + esc(s.title) + '</h3>' +
        '<p class="step__text">' + esc(s.text) + '</p></li>';
    }).join('');
  }

  function renderGallery() {
    var items = C.gallery || [];
    $$('[data-gallery-slot]').forEach(function (slot) {
      var i = +slot.getAttribute('data-gallery-slot');
      var item = items[i];
      if (!item) { slot.remove(); return; }
      if (item.src) {
        slot.innerHTML =
          '<button class="gallery__media" type="button" data-lightbox-open="' + i + '" aria-label="Ampliar foto: ' + esc(item.alt) + '">' +
          '<span class="gallery__mask" data-anim="image"><img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '" loading="lazy" decoding="async" data-parallax-img></span>' +
          '<span class="gallery__zoom" aria-hidden="true">' + icon('expand') + '</span></button>' +
          (item.caption ? '<span class="gallery__caption">' + esc(item.caption) + '</span>' : '');
      } else {
        slot.innerHTML =
          '<div class="gallery__media gallery__media--ph" data-anim="image" aria-hidden="true">' +
          '<span class="ph"><img class="ph__mark" src="assets/img/logo-mark-dark.png" alt="" width="188" height="213" loading="lazy">' +
          '<span class="ph__label">' + esc(item.caption || 'Consultório') + '</span>' +
          '<span class="ph__hint">Fotografia em breve</span></span></div>';
      }
    });
  }

  function contactItems(withIcons) {
    var out = [];
    var c = C.contact;
    if (c.whatsapp) out.push('<li><a href="' + Links.schedule() + '"' + ext + ' aria-label="WhatsApp ' + esc(c.whatsapp.display) + ' (abre em nova aba)">' + (withIcons ? icon('whatsapp', true) : '') + '<span>WhatsApp ' + esc(c.whatsapp.display) + '</span></a></li>');
    if (c.phone) out.push('<li><a href="' + Links.phone() + '">' + (withIcons ? icon('phone') : '') + '<span>Telefone ' + esc(c.phone.display) + '</span></a></li>');
    if (c.instagram) out.push('<li><a href="' + esc(c.instagram.url) + '"' + ext + '>' + (withIcons ? icon('instagram') : '') + '<span>Instagram ' + esc(c.instagram.handle) + '</span></a></li>');
    if (c.email) out.push('<li><a href="' + Links.email() + '">' + (withIcons ? icon('mail') : '') + '<span>' + esc(c.email) + '</span></a></li>');
    return out.join('');
  }

  function hoursHtml() {
    var hours = C.hours || [];
    if (!hours.length) {
      return '<p>Consulte os horários disponíveis pelo WhatsApp.' +
        (hasEmergency ? '<small>Urgências: entre em contato para receber orientações.</small>' : '') + '</p>';
    }
    return '<dl>' + hours.map(function (h) { return '<dt>' + esc(h.days) + '</dt><dd>' + esc(h.time) + '</dd>'; }).join('') + '</dl>' +
      (hasEmergency ? '<small>Urgências' + (C.emergency.is24h ? ' 24 horas' : '') + ': entre em contato pelo WhatsApp.</small>' : '');
  }

  function renderLocation() {
    var addr = $('[data-render="address"]');
    if (addr) {
      addr.innerHTML = esc(streetLine()) + '<br>' + esc(cityLine()) + '<small>CEP ' + esc(A.zip) + '</small>';
    }
    var hours = $('[data-render="hours"]');
    if (hours) hours.innerHTML = hoursHtml();
    var contacts = $('[data-render="contacts"]');
    if (contacts) contacts.innerHTML = contactItems(true);
  }

  function renderTrust() {
    var dl = $('[data-render="trust"]');
    if (!dl) return;
    var P = C.professional;
    var rows = [];
    rows.push(['Responsável técnico', esc(P.name) + '<small>' + esc(P.title) + ' · ' + esc(P.cro) + '</small>']);
    rows.push(['Atendimento', esc(C.clinic.audience || 'Odontologia') +
      (hasEmergency ? '<small>Inclui urgência e emergência' + (C.emergency.is24h ? ' · 24 horas' : '') + '</small>' : '')]);
    rows.push(['Endereço', esc(streetLine()) + '<small>' + esc(cityLine()) + ' · <span class="nowrap">CEP ' + esc(A.zip) + '</span></small>']);
    var channels = [];
    if (C.contact.whatsapp) channels.push('<a href="' + Links.schedule() + '"' + ext + '>WhatsApp ' + esc(C.contact.whatsapp.display) + '</a>');
    if (C.contact.instagram) channels.push('<a href="' + esc(C.contact.instagram.url) + '"' + ext + '>Instagram ' + esc(C.contact.instagram.handle) + '</a>');
    if (C.contact.email) channels.push('<a href="' + Links.email() + '">' + esc(C.contact.email) + '</a>');
    rows.push(['Canais oficiais', '<span class="trust__links">' + channels.join('') + '</span>']);
    dl.innerHTML = rows.map(function (r) {
      return '<div class="trust__row" data-anim="fade-up"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('');
  }

  function renderReviews() {
    var box = $('[data-render="reviews"]');
    var R = C.reviews;
    if (!box) return;
    if (!R || !R.enabled || !R.items || !R.items.length) { box.remove(); return; }
    box.hidden = false;
    var link = $('[data-reviews-link]', box);
    if (link) {
      if (R.sourceUrl) link.href = R.sourceUrl; else link.remove();
      if (link.querySelector('span')) link.querySelector('span').textContent = 'Ver todas as avaliações no ' + (R.sourceLabel || 'Google');
    }
    var src = $('[data-reviews-source]', box);
    if (src) src.textContent = R.sourceLabel || 'Google';
    var list = $('[data-reviews-list]', box);
    list.innerHTML = R.items.map(function (r) {
      return '<li class="review" data-anim="fade-up"><blockquote><p>' + esc(r.text) + '</p>' +
        '<footer><cite>' + esc(r.author) + '</cite> · Avaliação no ' + esc(R.sourceLabel || 'Google') + '</footer></blockquote></li>';
    }).join('');
  }

  function faqAnswer(text) {
    var wa = C.contact.whatsapp;
    var ig = C.contact.instagram;
    var html = esc(text)
      .replace('{horarios}', (C.hours && C.hours.length)
        ? 'O consultório atende ' + C.hours.map(function (h) { return esc(h.days.toLowerCase()) + ', ' + esc(h.time); }).join('; ') + '. Para horários específicos, fale conosco pelo WhatsApp {whatsapp}.'
        : 'Os horários disponíveis são informados no momento do agendamento. Fale conosco pelo WhatsApp {whatsapp} para consultar.')
      .replace(/\{whatsapp\}/g, wa ? '<a href="' + Links.schedule() + '"' + ext + '>' + esc(wa.display) + '</a>' : '')
      .replace(/\{instagram\}/g, ig ? '<a href="' + esc(ig.url) + '"' + ext + '>' + esc(ig.handle) + '</a>' : '')
      .replace(/\{endereco\}/g, esc(fullAddress()));
    return html;
  }

  function renderFaq() {
    var box = $('[data-render="faq"]');
    if (!box) return;
    var items = (C.faq || []).filter(function (f) {
      return hasEmergency || !/urg[eê]ncia/i.test(f.q);
    });
    box.innerHTML = items.map(function (f, i) {
      return '<div class="faq-item" data-anim="fade-up">' +
        '<h3><button class="faq-item__btn" type="button" id="faq-btn-' + i + '" aria-expanded="false" aria-controls="faq-panel-' + i + '">' +
        '<span>' + esc(f.q) + '</span><span class="faq-item__icon" aria-hidden="true"></span></button></h3>' +
        '<div class="faq-item__panel" id="faq-panel-' + i + '" role="region" aria-labelledby="faq-btn-' + i + '"><div><p>' + faqAnswer(f.a) + '</p></div></div></div>';
    }).join('');

    // Dados estruturados FAQPage, gerados a partir do mesmo conteúdo visível.
    var tmp = document.createElement('div');
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(function (f) {
        tmp.innerHTML = faqAnswer(f.a);
        return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: tmp.textContent } };
      }),
    };
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  function renderFooter() {
    var ul = $('[data-render="footer-contacts"]');
    if (ul) ul.innerHTML = contactItems(true);
    var addr = $('[data-render="footer-address"]');
    if (addr) addr.innerHTML = esc(streetLine()) + '<br>' + esc(cityLine()) + ' · ' + esc(A.zip);
    var hrs = $('[data-render="footer-hours"]');
    if (hrs) {
      var hours = C.hours || [];
      hrs.innerHTML = hours.length
        ? hours.map(function (h) { return esc(h.days) + ': ' + esc(h.time); }).join('<br>')
        : 'Horários: consulte pelo WhatsApp.' + (hasEmergency ? '<br>Urgências: fale conosco.' : '');
    }
  }

  function renderHeroVideo() {
    var v = C.hero && C.hero.video;
    var slot = $('[data-hero-video]');
    if (!v || !slot || (!v.mp4 && !v.webm)) return;
    var reduce = !document.documentElement.classList.contains('force-motion') &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    if (!reduce) { video.autoplay = true; video.setAttribute('autoplay', ''); }
    if (v.poster) video.poster = v.poster;
    if (v.webm) { var s1 = document.createElement('source'); s1.src = v.webm; s1.type = 'video/webm'; video.appendChild(s1); }
    if (v.mp4) { var s2 = document.createElement('source'); s2.src = v.mp4; s2.type = 'video/mp4'; video.appendChild(s2); }
    slot.appendChild(video);
    var hero = $('.hero');
    if (hero) hero.classList.add('hero--video');
  }

  window.SiteRender = {
    init: function () {
      bindLinks();
      renderHeroVideo();
      renderStats();
      renderTreatments();
      renderDifferentials();
      renderJourney();
      renderGallery();
      renderLocation();
      renderTrust();
      renderReviews();
      renderFaq();
      renderFooter();
      bindLinks(); // aplica também aos elementos recém-renderizados
    },
    sculpture: sculpture,
    fullAddress: fullAddress,
  };
})();
