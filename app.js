/* LegalFlow × Smart Scale, דף הנחיתה המשותף: הסרטון, אנימציות בגלילה, כפתור קבוע, ולידציה, ארבעת מצבי הטופס, פרמטרי מקור */
(function () {
  'use strict';

  // ה-VSL (לאורך, 9:16) והכתוביות שלו. ריק = מוצג מקום שמור
  var VSL_SRC = '';
  var VSL_CAPTIONS = '';

  // הקישור של איליה לקביעת שיחה של 20 דקות. ריק = מוצג מקום שמור
  var BOOKING_URL = '';

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
      data.source = 'legalflow-smartscale';
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
  var STORE_KEY = 'lf-ss-src';

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

  // כיסא השופט והמכתב: מתחילים כשגוללים אליהם, ומשם רצים בלולאה
  function reveals() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    var letter = document.querySelector('.letter');
    if (letter && !REDUCED && 'IntersectionObserver' in window) letter.classList.add('is-waiting');
    if (REDUCED || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-on'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add('is-on');
        if (e.target.classList.contains('letter')) typeLetter(e.target);
      });
    }, { threshold: 0.45 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  // המכתב נכתב, נחתם, נשאר שלוש שניות, נמחק, ומתחיל מחדש
  function typeLetter(letter) {
    var body = letter.querySelector('.letter-body');
    var text = body.getAttribute('data-type') || body.textContent;
    (function cycle() {
      var i = 0;
      letter.classList.remove('is-clearing', 'is-stamped');
      letter.classList.add('is-waiting');
      body.textContent = '';
      body.classList.add('is-typing');
      (function step() {
        i += 1;
        body.textContent = text.slice(0, i);
        if (i < text.length) { setTimeout(step, 32); return; }
        body.classList.remove('is-typing');
        setTimeout(function () {
          letter.classList.remove('is-waiting');
          letter.classList.add('is-stamped');
          setTimeout(function () {
            letter.classList.add('is-clearing');
            setTimeout(cycle, 500);
          }, 3000);
        }, 350);
      })();
    })();
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
      el.addEventListener(name === 'consent' ? 'change' : 'blur', function () {
        if (el.getAttribute('aria-invalid') !== null || el.value) validateField(form, name);
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
    stickyCta();
    accordion();
    initForm();
    anchors();
  });
})();
