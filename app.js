/* LegalFlow × נבו, עמוד אוטומציות: גלילה, כפתור קבוע, ולידציה, ארבעת מצבי הטופס, פרמטרי מקור */
(function () {
  'use strict';

  // קישור התזמון של Google Calendar (שיחה של 20 דקות ב-Google Meet). ריק = מוצג מקום שמור
  var BOOKING_URL = '';

  // רז מחבר כאן את השליחה לשרת שלו. מקבל אובייקט שדות ומחזיר Promise.
  // ברירת המחדל (תצוגה בלבד): מצליחה אחרי רגע. ?demo=error מדגים את מצב השגיאה
  window.LeadFlow = window.LeadFlow || {};
  if (typeof window.LeadFlow.submit !== 'function') {
    window.LeadFlow.submit = function () {
      var fail = /[?&]demo=error/.test(location.search);
      return new Promise(function (resolve, reject) {
        setTimeout(function () { fail ? reject(new Error('demo')) : resolve(); }, 900);
      });
    };
  }

  var PARAMS = ['src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var STORE_KEY = 'lf-automations-src';

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

  // כפתור קבוע: נעלם כשהטופס על המסך
  function stickyCta() {
    var btn = document.getElementById('sticky-cta');
    var lead = document.getElementById('lead');
    var hero = document.querySelector('.hero-cta');
    if (!btn || !lead || !('IntersectionObserver' in window)) return;
    var leadVisible = false, heroVisible = true;
    function update() { btn.classList.toggle('is-hidden', leadVisible || heroVisible); }
    new IntersectionObserver(function (e) { leadVisible = e[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(lead);
    if (hero) new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(hero);
    update();
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

  var RULES = {
    name: function (v) { return v.trim().length >= 2; },
    firm: function (v) { return v.trim().length >= 2; },
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
    btn.textContent = state === 'sending' ? 'שולח...' : 'שליחה ובחירת מועד לשיחה';
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
      f.title = 'בחירת מועד לשיחת היכרות';
      f.loading = 'lazy';
      booking.appendChild(f);
      link.href = BOOKING_URL;
    } else {
      booking.innerHTML = '<div class="booking-empty">כאן ייטען היומן לבחירת מועד</div>';
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
        document.getElementById('form-err').focus && document.getElementById('form-err').focus();
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
    stickyCta();
    initForm();
    anchors();
  });
})();
