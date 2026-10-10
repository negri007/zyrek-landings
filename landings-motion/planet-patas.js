/* Planet Patas · trajeto do táxi dog.
   A van acompanha a rolagem pela estrada; cada parada fica acesa depois que a van passa por ela.
   Nada aqui usa innerHTML: todo texto dinâmico entra por textContent. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = root.classList.contains('rm');
  var M = window.Motion;
  var EASE = [0.16, 1, 0.3, 1];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Ano do rodapé ---------- */
  var year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Fotos que não carregarem viram um aviso, sem quebrar o layout ---------- */
  $$('.photo img').forEach(function (img) {
    function missing() { img.closest('.photo').classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0) missing();
    else img.addEventListener('error', missing, { once: true });
  });

  /* ---------- Aberto agora? (sempre no horário de Presidente Prudente) ---------- */
  var HOURS = { 0: null, 1: [510, 1140], 2: [510, 1140], 3: [510, 1140], 4: [510, 1140], 5: [510, 1140], 6: [510, 1020] };
  var DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? String(m).padStart(2, '0') : '');
  }

  function nowInPrudente() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var day = WEEKDAY[get('weekday')];
      var min = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      if (day === undefined || isNaN(min)) return null;
      return { day: day, min: min };
    } catch (e) { return null; }
  }

  function statusFor(now) {
    var today = HOURS[now.day];
    if (today && now.min >= today[0] && now.min < today[1]) {
      return { open: true, text: 'Aberto agora · fecha às ' + fmt(today[1]) };
    }
    if (today && now.min < today[0]) {
      return { open: false, text: 'Fechado agora · abre hoje às ' + fmt(today[0]) };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (HOURS[d]) {
        var when = i === 1 ? 'amanhã' : DAY_NAMES[d];
        return { open: false, text: 'Fechado agora · abre ' + when + ' às ' + fmt(HOURS[d][0]) };
      }
    }
    return null;
  }

  var heroStatus = $('[data-status]');
  var heroStatusText = $('[data-status-text]');
  var hoursNow = $('[data-now]');
  var dayRows = $$('[data-days]');

  function updateStatus() {
    var now = nowInPrudente();
    if (!now) return;
    var s = statusFor(now);
    if (!s) return;
    if (heroStatusText) { heroStatusText.textContent = s.text; heroStatus.setAttribute('data-open', String(s.open)); }
    if (hoursNow) { hoursNow.textContent = s.text; hoursNow.setAttribute('data-open', String(s.open)); hoursNow.hidden = false; }
    dayRows.forEach(function (row) {
      var days = row.getAttribute('data-days').split(',').map(Number);
      row.classList.toggle('is-today', days.indexOf(now.day) !== -1);
    });
  }
  updateStatus();
  window.setInterval(updateStatus, 60000);

  /* ---------- Botão flutuante some quando já há um botão de agendar na tela ---------- */
  var floatBtn = $('.wa-float');
  var ctaTargets = $$('main a[data-wa]');
  if (floatBtn && 'IntersectionObserver' in window && ctaTargets.length) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      floatBtn.classList.toggle('is-hidden', visible.size > 0);
    });
    ctaTargets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- A estrada: rastro, paradas e van ---------- */
  var route = $('.route');
  var fill = $('.road-fill');
  var van = $('.van');
  var stops = $$('[data-stop]');
  var lastStop = $('.stop-last');

  // Computador: a estrada vertical começa na esquina da rua do topo, e a van grande é a protagonista.
  // Celular: a estrada começa no alto, na parada "Sua casa", com a vanzinha estacionada nela.
  var street = $('[data-street]');
  var roadEl = $('.road');
  var signboard = $('.signboard');
  var firstStop = $('.stop-first');
  var wide = window.matchMedia('(min-width: 1024px)');
  function placeFirstStop() {
    if (!route) return;
    var routeTop = route.getBoundingClientRect().top;
    var start;
    if (wide.matches && street) {
      if (firstStop) firstStop.style.top = '';
      start = street.getBoundingClientRect().top - routeTop;
    } else if (firstStop && van) {
      if (window.scrollY <= 4) {
        var hr = firstStop.parentNode.getBoundingClientRect();
        var vr = van.getBoundingClientRect();
        var top = vr.top - hr.top - 46; // a placa fica logo acima da van estacionada
        if (top > 16 && top < hr.height - 40) firstStop.style.top = top + 'px';
      }
      start = firstStop.getBoundingClientRect().top - routeTop - 10;
    } else {
      start = 0;
    }
    route.style.setProperty('--road-start', Math.max(0, Math.round(start)) + 'px');
  }

  function pop(el) {
    if (!M || reduce) return;
    M.animate(el.firstElementChild, { scale: [1, 1.28, 1] }, { duration: 0.5, ease: EASE });
  }

  var lastY = window.scrollY;
  var drivingTimer = 0;
  var ticking = false;

  function frame() {
    ticking = false;
    if (!route || !van) return;
    var rr = (fill ? fill.parentNode : route).getBoundingClientRect();
    var vr = van.getBoundingClientRect();
    var vanMid = vr.top + vr.height / 2;
    var p = Math.min(1, Math.max(0, (vanMid - rr.top) / rr.height));
    if (fill) fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';

    stops.forEach(function (s) {
      if (s.classList.contains('is-reached')) return;
      var sr = s.getBoundingClientRect();
      if (sr.top + sr.height / 2 <= vanMid + 2) {
        s.classList.add('is-reached');
        pop(s);
      }
    });
    van.classList.toggle('is-arrived', !!lastStop && lastStop.classList.contains('is-reached'));
    // A vanzinha de cima só aparece depois que sai da esquina; até lá, a van grande da rua é a protagonista.
    // Uma van por vez: no computador a vanzinha só aparece depois de sair da esquina;
    // no celular ela some enquanto a rua do topo (com a van grande) está na tela.
    var hidden = false;
    if (wide.matches && roadEl) hidden = vr.top - roadEl.getBoundingClientRect().top < 6;
    else if (street) {
      // conta só a parte da rua que não está coberta pelo cabeçalho fixo
      var sr = street.getBoundingClientRect();
      var headerBottom = signboard ? signboard.getBoundingClientRect().bottom : 0;
      hidden = sr.bottom > headerBottom + 8 && sr.top < window.innerHeight;
    }
    van.classList.toggle('is-parked', hidden);
  }

  function onScroll() {
    var y = window.scrollY;
    if (van && Math.abs(y - lastY) > 2) {
      van.classList.toggle('is-reverse', y < lastY);
      if (!reduce) {
        van.classList.add('is-driving');
        window.clearTimeout(drivingTimer);
        drivingTimer = window.setTimeout(function () { van.classList.remove('is-driving'); }, 180);
      }
      lastY = y;
    }
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }

  placeFirstStop();
  frame();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { placeFirstStop(); window.requestAnimationFrame(frame); }, { passive: true });
  window.addEventListener('load', function () { placeFirstStop(); frame(); });

  /* ---------- Entradas animadas ---------- */
  if (!M || reduce) {
    if (!M) root.classList.add('no-motion');
    root.classList.add('motion-ready');
    return;
  }

  var animate = M.animate, stagger = M.stagger;
  // Conforme a versão, o Motion entrega ao callback o elemento ou o registro do IntersectionObserver.
  function inView(target, cb, opts) {
    return M.inView(target, function (a) { return cb(a && a.target instanceof Element ? a.target : a); }, opts);
  }

  // Hero: a porta de enrolar da loja sobe e o texto chega em sequência.
  var shutter = $('.shutter');
  if (shutter) {
    animate(shutter, { y: ['0%', '-101%'] }, { duration: 1.1, delay: 0.35, ease: [0.65, 0, 0.35, 1] })
      .then(function () { shutter.remove(); });
  }
  animate('.hero .h-in', { opacity: [0, 1], y: [22, 0] }, { duration: 0.8, delay: stagger(0.09, { startDelay: 0.05 }), ease: EASE });
  animate('.plaque-disc .stars .ico', { scale: [0, 1] }, { duration: 0.45, delay: stagger(0.07, { startDelay: 0.7 }), ease: EASE });
  // A van grande sai da esquina de casa e anda pela rua até a frente da loja.
  var bigvan = $('.bigvan');
  if (bigvan) {
    var dx = Math.max(0, bigvan.offsetLeft - 34);
    var drive = function (delay) {
      bigvan.classList.add('is-driving');
      animate(bigvan, { x: [-dx, 0] }, { duration: 2, delay: delay, ease: [0.4, 0, 0.15, 1] })
        .then(function () { bigvan.classList.remove('is-driving'); });
    };
    if (wide.matches) {
      drive(0.6);
    } else {
      // No celular a rua fica abaixo da dobra: a van espera na esquina e sai quando a rua aparece.
      bigvan.style.transform = 'translateX(' + (-dx) + 'px)';
      inView(street, function () { drive(0.15); }, { margin: '0px 0px -25% 0px' });
    }
  }
  root.classList.add('motion-ready');

  var once = { margin: '0px 0px -18% 0px' };

  // Táxi dog: as três etapas saem da estrada, uma depois da outra.
  inView('.trip', function (el) {
    animate(el.querySelectorAll('.leg h3, .leg p'), { opacity: [0, 1], x: [-24, 0] }, { duration: 0.6, delay: stagger(0.1, { startDelay: 0.1 }), ease: EASE });
  }, once);

  inView('.taxi-copy', function (el) {
    animate(el.children, { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: stagger(0.08), ease: EASE });
  }, once);

  // Serviços: cada prateleira se monta da esquerda para a direita.
  inView('.serv-head', function (el) {
    animate(el.children, { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: stagger(0.08), ease: EASE });
  }, once);
  $$('.shelf').forEach(function (shelf) {
    inView(shelf, function () {
      animate(0, 1, { duration: 0.9, ease: EASE, onUpdate: function (v) { shelf.style.setProperty('--lip', v.toFixed(3)); } });
      animate(shelf.children, { opacity: [0, 1], x: [-22, 0] }, { duration: 0.6, delay: stagger(0.08, { startDelay: 0.15 }), ease: EASE });
    }, once);
  });
  $$('.serv-photos .photo-frame').forEach(function (frameEl) {
    inView(frameEl, function () {
      animate(frameEl, { clipPath: ['inset(0 0 100% 0 round 26px)', 'inset(0 0 0% 0 round 26px)'] }, { duration: 0.9, ease: [0.65, 0, 0.35, 1] });
      animate(frameEl.querySelector('img'), { scale: [1.12, 1] }, { duration: 1.2, ease: EASE });
    }, once);
  });

  // Avaliações: o painel da loja aparece, a nota sobe de 0 a 4,8 e os recados chegam.
  inView('.backdrop', function (el) {
    animate(el, { opacity: [0, 1], scale: [0.94, 1] }, { duration: 0.7, ease: EASE });
    animate('.photo-pet', { opacity: [0, 1], y: [40, 0] }, { duration: 0.8, delay: 0.15, ease: EASE });
  }, once);
  var score = $('.score');
  if (score) {
    inView(score, function () {
      var target = parseFloat(score.getAttribute('data-count')) || 4.8;
      animate(0, target, { duration: 1.4, ease: EASE, onUpdate: function (v) { score.textContent = v.toFixed(1).replace('.', ','); } });
      animate('.stars-lg .ico', { scale: [0, 1], opacity: [0, 1] }, { duration: 0.45, delay: stagger(0.1, { startDelay: 0.3 }), ease: EASE });
    }, once);
  }
  inView('.quotes', function (el) {
    animate(el.querySelectorAll('.quote'), { opacity: [0, 1], y: [36, 0] }, { duration: 0.7, delay: stagger(0.12), ease: EASE });
  }, once);

  // Loja: o horário entra linha por linha; a linha de hoje dá um destaque.
  inView('.hours', function (el) {
    animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, ease: EASE });
    animate(el.querySelectorAll('tr'), { opacity: [0, 1], x: [18, 0] }, { duration: 0.5, delay: stagger(0.1, { startDelay: 0.2 }), ease: EASE });
  }, once);
  inView('.loja-copy', function (el) {
    animate(el.children, { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: stagger(0.08), ease: EASE });
  }, once);
  inView('.faq-list', function (el) {
    animate(el.children, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, delay: stagger(0.08), ease: EASE });
  }, once);

  // Final: a chegada em casa.
  inView('.finale-in', function (el) {
    animate(el.children, { opacity: [0, 1], y: [28, 0], scale: [0.97, 1] }, { duration: 0.75, delay: stagger(0.1), ease: EASE });
  }, once);
})();
