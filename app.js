/* LegalFlow, דף הנחיתה: הסרטון, הלוח החי, תנועה בגלילה, כפתור קבוע, ולידציה, ארבעת מצבי הטופס, פרמטרי מקור */
(function () {
  'use strict';

  // ה-VSL (לאורך, 9:16) והכתוביות שלו. ריק = מוצג מקום שמור
  var VSL_SRC = '';
  var VSL_CAPTIONS = '';

  // הקישור של איליה לקביעת שיחה של 20 דקות. ריק = מוצג מקום שמור
  var BOOKING_URL = '';

  // הלוח החי: הסרטון של רז מהאתר שלו. רץ רק קטע אחד, והחיתוך ב-CSS מסתיר את הכותרת עם שם המוצר.
  // לפני שהדף עולה לקמפיין: מעתיקים עותק מקומי ומחליפים את הכתובת
  var BOARD_SRC = 'https://legalflow.club/videos/board-demo-2.mp4';
  var BOARD_FROM = 8.6;
  var BOARD_TO = 11.5;

  // הכתובת הייעודית לדף הזה ב-CRM של איליה: כל ליד ממנה נרשם תחת רז ברכה.
  // ריק = מצב תצוגה: השליחה מצליחה אחרי רגע, ו-?demo=error מדגים שגיאה
  var LEAD_WEBHOOK = '';
  var PARTNER = { name: 'רז ברכה', crmId: 'mrj7pl1a7bls' };

  window.LeadFlow = window.LeadFlow || {};
  if (typeof window.LeadFlow.submit !== 'function') {
    window.LeadFlow.submit = function (data) {
      if (!LEAD_WEBHOOK) {
        var fail = /[?&]demo=error/.test(location.search);
        return new Promise(function (resolve, reject) {
          setTimeout(function () { fail ? reject(new Error('demo')) : resolve(); }, 900);
        });
      }
      data.source = 'legalflow-lp';
      data.partner = PARTNER.name;
      data.partnerId = PARTNER.crmId;
      return fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
      });
    };
  }

  var PARAMS = ['src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  var STORE_KEY = 'lf-src';

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function writeStore(obj) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* פרטי/חסום: ממשיכים בלי */ }
  }

  // פרמטרי מקור: מהכתובת, ואם אין אז ממה שנשמר בכניסה הקודמת באותו סשן
  function captureParams(form) {
    var qs = new URLSearchParams(location.search);
    var saved = readStore();
    var found = false;
    PARAMS.forEach(function (k) {
      var v = qs.get(k);
      if (v) { saved[k] = v; found = true; }
    });
    if (found) writeStore(saved);
    PARAMS.forEach(function (k) {
      var input = form.elements[k];
      if (input && saved[k]) input.value = saved[k];
    });
  }

  // כפתור קבוע: נעלם כשהטופס או כפתור אחר של הדף על המסך, כדי שלא יופיעו שניים
  function stickyCta() {
    var btn = document.getElementById('sticky-cta');
    var watch = document.querySelectorAll('#lead, .hero-cta, .cta-block');
    if (!btn || !watch.length || !('IntersectionObserver' in window)) return;
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); });
      btn.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: 0.05 });
    Array.prototype.forEach.call(watch, function (el) { io.observe(el); });
  }

  // לוגואים: עותק שני לגלילה רציפה, מוסתר מקוראי מסך
  function marquee() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      var img = c.querySelector('img');
      if (img) img.alt = '';
      track.appendChild(c);
    });
  }

  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // הסרטון רץ לבד בלי קול, עם כתוביות. לחיצה על "הפעלת קול" מתחילה אותו מההתחלה עם קול
  function vsl() {
    var frame = document.querySelector('.vsl-frame');
    if (!frame || !VSL_SRC) return;
    var video = frame.querySelector('video');
    var sound = frame.querySelector('.vsl-sound');
    video.src = VSL_SRC;
    if (VSL_CAPTIONS) {
      var t = document.createElement('track');
      t.kind = 'captions'; t.srclang = 'he'; t.label = 'עברית'; t.src = VSL_CAPTIONS; t.default = true;
      video.appendChild(t);
    }
    video.hidden = false;
    frame.dataset.state = 'muted';
    sound.hidden = false;
    if (!REDUCED) { video.autoplay = true; video.play().catch(function () {}); }
    sound.addEventListener('click', function () {
      video.currentTime = 0;
      video.muted = false;
      video.controls = true;
      video.play();
      sound.hidden = true;
      frame.dataset.state = 'playing';
    });
  }

  // לוגואים, טיוטה וחותמת: קורים פעם אחת כשגוללים אליהם, ונשארים
  function reveals() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-on'); });
      return;
    }
    Array.prototype.forEach.call(els, function (el) { el.classList.add('is-waiting'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.remove('is-waiting');
        e.target.classList.add('is-on');
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  // חלונות המשרדים: לולאה איטית, רק כשהם על המסך
  function windows() {
    var wins = document.querySelectorAll('.win');
    if (REDUCED || !wins.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-on', e.isIntersecting); });
    }, { threshold: 0.3 });
    Array.prototype.forEach.call(wins, function (w) { io.observe(w); });
  }

  // הלוח החי: רץ כשהוא על המסך, ונעצר כשלא. עד שהקטע מוכן, ובלי תנועה: נשארת התמונה
  function board() {
    var video = document.querySelector('#board video');
    if (!video || !BOARD_SRC || REDUCED || !('IntersectionObserver' in window)) return;
    var started = false;
    var ready = false;
    var visible = false;
    function sync() {
      if (ready && visible) video.play().catch(function () {});
      else video.pause();
    }
    function start() {
      started = true;
      video.preload = 'auto';
      video.addEventListener('canplay', function first() {
        video.removeEventListener('canplay', first);
        video.currentTime = BOARD_FROM;
      });
      video.addEventListener('seeked', function () {
        ready = true;
        video.classList.remove('is-fading');
        sync();
      });
      video.addEventListener('timeupdate', function () {
        // החזרה לתחילת הקטע בדעיכה קצרה, כדי שלא תיראה קפיצה
        if (ready && video.currentTime >= BOARD_TO && !video.classList.contains('is-fading')) {
          video.classList.add('is-fading');
          setTimeout(function () { video.currentTime = BOARD_FROM; }, 260);
        }
      });
      video.src = BOARD_SRC;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !started) start();
        sync();
      });
    }, { threshold: 0.2 });
    io.observe(document.getElementById('board'));
  }

  // שאלות ותשובות: נפתחות ונסגרות בהחלקה, ולא קופצות
  function accordion() {
    Array.prototype.forEach.call(document.querySelectorAll('.acc'), function (item) {
      var btn = item.querySelector('.acc-q');
      var panel = item.querySelector('.acc-panel');
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });
    // גובה התשובה משתנה עם רוחב המסך
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.acc.is-open .acc-panel'), function (panel) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      });
    });
  }

  var RULES = {
    name: function (v) { return v.trim().length >= 2; },
    phone: function (v) { return v.replace(/\D/g, '').length >= 9; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    consent: function (v, el) { return el.checked; }
  };

  function validateField(form, name) {
    var el = form.elements[name];
    var ok = RULES[name](el.value, el);
    var err = document.getElementById('f-' + name + '-err');
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (err) {
      err.hidden = ok;
      if (!ok) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
    return ok;
  }

  function setState(form, state) {
    var btn = document.getElementById('lead-submit');
    var formErr = document.getElementById('form-err');
    form.dataset.state = state;
    btn.disabled = state === 'sending';
    btn.textContent = state === 'sending' ? 'שולח...' : 'שליחה וקביעת שיחה ביומן';
    formErr.hidden = state !== 'error';
  }

  function showThanks(form) {
    var thanks = document.getElementById('thanks');
    var booking = document.getElementById('booking');
    var link = document.getElementById('booking-link');
    form.hidden = true;
    thanks.hidden = false;
    if (BOOKING_URL) {
      var f = document.createElement('iframe');
      f.src = BOOKING_URL;
      f.title = 'בחירת שעה לשיחה';
      f.loading = 'lazy';
      booking.appendChild(f);
      link.href = BOOKING_URL;
    } else {
      booking.innerHTML = '<div class="booking-empty">כאן ייטען היומן לבחירת שעה</div>';
      link.removeAttribute('target');
    }
    thanks.focus();
  }

  function initForm() {
    var form = document.getElementById('lead-form');
    if (!form) return;
    captureParams(form);

    Object.keys(RULES).forEach(function (name) {
      var el = form.elements[name];
      // שגיאה מופיעה רק בשליחה, ונעלמת תוך כדי הקלדה. בלי בדיקה ביציאה מהשדה:
      // הודעה שנעלמת באמצע לחיצה מזיזה את הטופס, והלחיצה נופלת ליד הצ'קבוקס
      el.addEventListener(name === 'consent' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') validateField(form, name);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.state === 'sending') return;

      var firstBad = null;
      Object.keys(RULES).forEach(function (name) {
        if (!validateField(form, name) && !firstBad) firstBad = form.elements[name];
      });
      if (firstBad) { firstBad.focus(); return; }

      // מלכודת בוטים מלאה: מעמידים פנים שהצליח ולא שולחים
      if (form.elements.company_site.value) { showThanks(form); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company_site') data[k] = v; });
      data.page = location.href.split('#')[0];

      setState(form, 'sending');
      window.LeadFlow.submit(data).then(function () {
        setState(form, 'sent');
        showThanks(form);
      }, function () {
        setState(form, 'error');
        document.getElementById('form-err').focus();
      });
    });
  }

  // קישורי עוגן פנימיים לא נוגעים בכתובת, כך שפרמטרי המקור לא נשברים
  function anchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ block: 'start' });
      if (id === 'lead') {
        var first = document.getElementById('f-name');
        if (first && !first.closest('[hidden]')) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    marquee();
    vsl();
    reveals();
    windows();
    board();
    stickyCta();
    accordion();
    initForm();
    anchors();
  });
})();
