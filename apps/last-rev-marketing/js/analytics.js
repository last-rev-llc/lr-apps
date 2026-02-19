/**
 * LR Analytics — Centralized GA4 event tracking for Last Rev Marketing
 * Measurement ID: G-CJNGJ1LG7J
 *
 * PUBLIC API:
 *   LR.track('event_name', { key: 'value' });
 *
 * AUTO-TRACKED EVENTS:
 *   ── Core ──
 *   page_view              Automatic via gtag config
 *   cta_click              CTA buttons (data-track-cta, .btn-primary, .cc-cta__btn, .lr-nav-cta)
 *   nav_click              Header, subnav, footer navigation links
 *   outbound_click         Links leaving the site
 *   scroll_depth           25%, 50%, 75%, 100% thresholds
 *
 *   ── Cards ──
 *   card_click             Clickable cards (data-track-card, .lp-card, .app-card, etc.)
 *   card_hover             Card hover > 500ms (intent signal)
 *
 *   ── Section engagement ──
 *   section_dwell          Time-bucketed visibility: short (1-2s), medium (2-10s), long (10-20s), extended (20s+)
 *
 *   ── Video ──
 *   video_play             Video started
 *   video_pause            Video paused
 *   video_progress         25%, 50%, 75%, 100% watched
 *   video_mute_toggle      Muted/unmuted
 *   video_fullscreen       Entered/exited fullscreen
 *
 *   ── Forms ──
 *   form_start             First field focused in a form
 *   form_field_focus       Each field focused (tracks field name + order)
 *   form_field_abandon     Last field before leaving the form without submitting
 *   form_submit            Form submitted
 *   form_error             Form validation error
 *
 *   ── UX signals ──
 *   rage_click             3+ clicks in same area within 1s
 *   text_copy              User copied text (tracks selected text snippet)
 *   exit_intent            Cursor toward browser chrome (desktop) or rapid scroll-up (mobile)
 *
 *   ── Scroll behavior ──
 *   scroll_velocity        reading / scanning / seeking (based on px/s)
 *
 *   ── Visitor type ──
 *   return_visitor         Fires on page load if user has visited before; includes visit count + days since last
 *
 *   ── Device ──
 *   orientation_change     Device rotated mid-session
 */
(function () {
  'use strict';

  // Only fire analytics on production domain — exclude dev/staging/alphaclaw
  const PROD_HOSTS = ['lastrev.com', 'www.lastrev.com', 'ah-last-rev-marketing.vercel.app'];
  if (!PROD_HOSTS.includes(location.hostname)) return;

  const GA_ID = 'G-CJNGJ1LG7J';
  const PAGE = location.pathname;

  // ── gtag bootstrap ──────────────────────────────────────────────
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: true });

  if (!document.querySelector('script[src*="googletagmanager.com/gtag"]')) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // ── Public API ──────────────────────────────────────────────────
  const LR = window.LR = window.LR || {};
  LR.track = function (name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const txt = (el) => (el.textContent || '').trim().slice(0, 60);
  const pageHidden = () => document.hidden;

  // ── Init (runs after DOM ready) ─────────────────────────────────
  function init() {

    // ================================================================
    //  1. CTA CLICKS
    // ================================================================
    document.addEventListener('click', function (e) {
      const cta = e.target.closest('[data-track-cta], .btn-primary, .lr-nav-cta, .cc-cta__btn');
      if (cta) {
        LR.track('cta_click', {
          cta_label: cta.getAttribute('data-track-cta') || txt(cta),
          cta_url: cta.href || '',
          page_path: PAGE
        });
      }
    });

    // ================================================================
    //  2. NAVIGATION CLICKS
    // ================================================================
    document.addEventListener('click', function (e) {
      const nav = e.target.closest('lr-nav a, lr-subnav a, lr-footer a');
      if (nav) {
        LR.track('nav_click', {
          link_text: txt(nav),
          link_url: nav.href || '',
          nav_section: nav.closest('lr-nav') ? 'header' : nav.closest('lr-subnav') ? 'subnav' : 'footer',
          page_path: PAGE
        });
      }
    });

    // ================================================================
    //  3. OUTBOUND LINK CLICKS
    // ================================================================
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href]');
      if (a && a.hostname && a.hostname !== location.hostname) {
        LR.track('outbound_click', {
          link_url: a.href,
          link_text: txt(a),
          page_path: PAGE
        });
      }
    });

    // ================================================================
    //  4. SCROLL DEPTH
    // ================================================================
    var scrollMarks = { 25: false, 50: false, 75: false, 100: false };
    window.addEventListener('scroll', throttleRAF(function () {
      var pct = scrollPct();
      [25, 50, 75, 100].forEach(function (m) {
        if (pct >= m && !scrollMarks[m]) {
          scrollMarks[m] = true;
          LR.track('scroll_depth', { depth: m, page_path: PAGE });
        }
      });
    }));

    // ================================================================
    //  5. CARD CLICKS + HOVER
    // ================================================================
    const CARD_SEL = '[data-track-card], .lp-card, .app-card, .lr-apps-grid a, .lp-grid a';

    document.addEventListener('click', function (e) {
      const card = e.target.closest(CARD_SEL);
      if (card) {
        LR.track('card_click', {
          card_label: card.getAttribute('data-track-card') || card.getAttribute('title') || txt(card.querySelector('h3,h4,.card-title') || card),
          card_url: card.href || card.closest('a[href]')?.href || '',
          card_index: cardIndex(card),
          page_path: PAGE
        });
      }
    });

    // Card hover (>500ms + no active scrolling = true intent)
    var hoverTimer = null;
    var isScrolling = false;
    var scrollCooldown = null;
    window.addEventListener('scroll', function () {
      isScrolling = true;
      clearTimeout(scrollCooldown);
      clearTimeout(hoverTimer);
      scrollCooldown = setTimeout(function () { isScrolling = false; }, 300);
    });
    document.addEventListener('mouseover', function (e) {
      const card = e.target.closest(CARD_SEL);
      if (!card) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () {
        if (isScrolling) return; // ignore scroll-through hovers
        LR.track('card_hover', {
          card_label: card.getAttribute('data-track-card') || card.getAttribute('title') || txt(card.querySelector('h3,h4,.card-title') || card),
          card_index: cardIndex(card),
          page_path: PAGE
        });
      }, 500);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(CARD_SEL)) clearTimeout(hoverTimer);
    });

    function cardIndex(card) {
      const parent = card.parentElement;
      if (!parent) return 0;
      return Array.from(parent.children).indexOf(card);
    }

    // ================================================================
    //  6. SECTION DWELL TIME (Intersection Observer + Visibility API)
    // ================================================================
    (function () {
      const DWELL_BUCKETS = [
        { min: 1, max: 2, label: 'short' },
        { min: 2, max: 10, label: 'medium' },
        { min: 10, max: 20, label: 'long' },
        { min: 20, max: Infinity, label: 'extended' }
      ];
      const tracked = new Map(); // sectionId → Set of fired bucket labels

      const sections = document.querySelectorAll('section[id], .lp-section[id], [data-track-section]');
      if (!sections.length) return;

      const timers = new Map(); // sectionId → { start, accumulated, visible }

      function sectionId(el) {
        return el.getAttribute('data-track-section') || el.id || txt(el.querySelector('h2,h3') || el);
      }

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const id = sectionId(entry.target);
          if (entry.isIntersecting && !pageHidden()) {
            if (!timers.has(id)) timers.set(id, { start: 0, accumulated: 0, visible: false });
            const t = timers.get(id);
            t.start = performance.now();
            t.visible = true;
          } else {
            accumulate(id);
          }
        });
      }, { threshold: 0.4 });

      sections.forEach(function (s) { observer.observe(s); });

      // Pause/resume on tab visibility
      document.addEventListener('visibilitychange', function () {
        timers.forEach(function (t, id) {
          if (document.hidden) {
            accumulate(id);
          } else if (t.visible) {
            t.start = performance.now();
          }
        });
      });

      function accumulate(id) {
        const t = timers.get(id);
        if (!t || !t.visible) return;
        t.accumulated += (performance.now() - t.start) / 1000;
        t.visible = false;
        fireBuckets(id, t.accumulated);
      }

      function fireBuckets(id, secs) {
        if (!tracked.has(id)) tracked.set(id, new Set());
        const fired = tracked.get(id);
        DWELL_BUCKETS.forEach(function (b) {
          if (secs >= b.min && !fired.has(b.label)) {
            fired.add(b.label);
            LR.track('section_dwell', {
              section_id: id,
              dwell_bucket: b.label,
              dwell_seconds: Math.round(secs),
              page_path: PAGE
            });
          }
        });
      }

      // Fire remaining on page unload
      window.addEventListener('beforeunload', function () {
        timers.forEach(function (t, id) {
          if (t.visible) {
            t.accumulated += (performance.now() - t.start) / 1000;
          }
          fireBuckets(id, t.accumulated);
        });
      });
    })();

    // ================================================================
    //  7. VIDEO TRACKING
    // ================================================================
    (function () {
      function trackVideo(video) {
        if (video._lrTracked) return;
        video._lrTracked = true;
        const label = video.getAttribute('data-track-video') || video.getAttribute('title') || video.src || 'unknown';
        const marks = {};

        video.addEventListener('play', function () {
          LR.track('video_play', { video_label: label, page_path: PAGE });
        });
        video.addEventListener('pause', function () {
          if (!video.ended) LR.track('video_pause', { video_label: label, video_pct: Math.round((video.currentTime / video.duration) * 100), page_path: PAGE });
        });
        video.addEventListener('timeupdate', function () {
          if (!video.duration) return;
          var pct = Math.round((video.currentTime / video.duration) * 100);
          [25, 50, 75, 100].forEach(function (m) {
            if (pct >= m && !marks[m]) {
              marks[m] = true;
              LR.track('video_progress', { video_label: label, progress: m, page_path: PAGE });
            }
          });
        });
        video.addEventListener('volumechange', function () {
          LR.track('video_mute_toggle', { video_label: label, muted: video.muted, page_path: PAGE });
        });
        video.addEventListener('fullscreenchange', function () {
          LR.track('video_fullscreen', { video_label: label, fullscreen: !!document.fullscreenElement, page_path: PAGE });
        });
      }

      // Track existing + dynamically added videos
      document.querySelectorAll('video').forEach(trackVideo);
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeName === 'VIDEO') trackVideo(n);
            if (n.querySelectorAll) n.querySelectorAll('video').forEach(trackVideo);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });

      // Also handle YouTube iframes via postMessage
      window.addEventListener('message', function (e) {
        try {
          var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (d.event === 'onStateChange' && d.info !== undefined) {
            var states = { 1: 'video_play', 2: 'video_pause' };
            if (states[d.info]) LR.track(states[d.info], { video_label: 'youtube_embed', page_path: PAGE });
          }
        } catch (_) {}
      });
    })();

    // ================================================================
    //  8. FORM FUNNEL (start → field focus → abandon → submit → error)
    // ================================================================
    (function () {
      const forms = new Map(); // form element → state

      function getFormId(form) {
        return form.id || form.getAttribute('name') || form.tagName.toLowerCase();
      }

      function getFieldName(field) {
        return field.name || field.id || field.getAttribute('placeholder') || field.type || 'unknown';
      }

      function getState(form) {
        if (!forms.has(form)) forms.set(form, { started: false, fields: [], lastField: null, fieldOrder: 0 });
        return forms.get(form);
      }

      // Field focus
      document.addEventListener('focusin', function (e) {
        const field = e.target.closest('input, textarea, select');
        if (!field) return;
        const form = field.closest('form, cc-contact-form');
        if (!form) return;

        const state = getState(form);
        const fieldName = getFieldName(field);
        state.fieldOrder++;
        state.lastField = fieldName;

        if (!state.started) {
          state.started = true;
          LR.track('form_start', { form_id: getFormId(form), first_field: fieldName, page_path: PAGE });
        }

        LR.track('form_field_focus', {
          form_id: getFormId(form),
          field_name: fieldName,
          field_order: state.fieldOrder,
          page_path: PAGE
        });

        if (!state.fields.includes(fieldName)) state.fields.push(fieldName);
      });

      // Form submit
      document.addEventListener('submit', function (e) {
        const form = e.target.closest('form, cc-contact-form');
        if (form) {
          const state = getState(form);
          LR.track('form_submit', {
            form_id: getFormId(form),
            fields_touched: state.fields.length,
            page_path: PAGE
          });
          forms.delete(form);
        }
      });

      // Also listen for cc-contact-form custom submit
      document.addEventListener('contact-form-submit', function (e) {
        LR.track('form_submit', { form_id: 'contact', page_path: PAGE });
      });

      // Form validation errors
      document.addEventListener('invalid', function (e) {
        const field = e.target;
        const form = field.closest('form, cc-contact-form');
        LR.track('form_error', {
          form_id: form ? getFormId(form) : 'unknown',
          field_name: getFieldName(field),
          error_type: field.validity.valueMissing ? 'required' : field.validity.typeMismatch ? 'type' : field.validity.patternMismatch ? 'pattern' : 'other',
          page_path: PAGE
        });
      }, true);

      // Form abandon (fire on page leave if form was started but not submitted)
      window.addEventListener('beforeunload', function () {
        forms.forEach(function (state, form) {
          if (state.started) {
            LR.track('form_field_abandon', {
              form_id: getFormId(form),
              last_field: state.lastField,
              fields_completed: state.fields.length,
              page_path: PAGE
            });
          }
        });
      });
    })();

    // ================================================================
    //  9. RAGE CLICKS
    // ================================================================
    (function () {
      var clicks = [];
      var THRESHOLD = 3;
      var WINDOW_MS = 1000;
      var RADIUS = 50; // px

      document.addEventListener('click', function (e) {
        var now = Date.now();
        clicks.push({ x: e.clientX, y: e.clientY, t: now });
        // Prune old clicks
        clicks = clicks.filter(function (c) { return now - c.t < WINDOW_MS; });

        // Check if 3+ clicks are within radius
        if (clicks.length >= THRESHOLD) {
          var last = clicks[clicks.length - 1];
          var nearby = clicks.filter(function (c) {
            return Math.abs(c.x - last.x) < RADIUS && Math.abs(c.y - last.y) < RADIUS;
          });
          if (nearby.length >= THRESHOLD) {
            var target = e.target.closest('a, button, [role="button"]') || e.target;
            LR.track('rage_click', {
              element: target.tagName.toLowerCase() + (target.className ? '.' + target.className.split(' ')[0] : ''),
              element_text: txt(target),
              page_path: PAGE,
              click_count: nearby.length
            });
            clicks = []; // reset after firing
          }
        }
      });
    })();

    // ================================================================
    // 10. TEXT COPY / SELECTION
    // ================================================================
    document.addEventListener('copy', function () {
      var sel = window.getSelection();
      if (!sel || !sel.toString().trim()) return;
      var selected = sel.toString().trim().slice(0, 100);
      LR.track('text_copy', {
        copied_text: selected,
        page_path: PAGE
      });
    });

    // ================================================================
    // 11. EXIT INTENT
    // ================================================================
    (function () {
      var fired = false;

      // Desktop: cursor leaves viewport toward top
      document.addEventListener('mouseout', function (e) {
        if (fired) return;
        if (e.clientY <= 5 && e.relatedTarget === null) {
          fired = true;
          // Find last visible section
          var sections = document.querySelectorAll('section[id], .lp-section[id], [data-track-section]');
          var lastVisible = 'unknown';
          sections.forEach(function (s) {
            var r = s.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) {
              lastVisible = s.getAttribute('data-track-section') || s.id || txt(s.querySelector('h2,h3') || s);
            }
          });
          LR.track('exit_intent', {
            trigger: 'cursor_leave',
            last_section: lastVisible,
            scroll_pct: scrollPct(),
            page_path: PAGE
          });
        }
      });

      // Mobile: rapid scroll-up (>3000px/s toward top)
      var lastScrollY = window.scrollY;
      var lastScrollT = performance.now();
      window.addEventListener('scroll', throttleRAF(function () {
        if (fired) return;
        var now = performance.now();
        var dy = lastScrollY - window.scrollY; // positive = scrolling up
        var dt = (now - lastScrollT) / 1000;
        lastScrollY = window.scrollY;
        lastScrollT = now;
        if (dt > 0 && dy / dt > 3000 && window.scrollY < 200) {
          fired = true;
          LR.track('exit_intent', {
            trigger: 'rapid_scroll_up',
            scroll_pct: scrollPct(),
            page_path: PAGE
          });
        }
      }));
    })();

    // ================================================================
    // 12. SCROLL VELOCITY
    // ================================================================
    (function () {
      var samples = [];
      var lastY = window.scrollY;
      var lastT = performance.now();
      var reported = {};

      window.addEventListener('scroll', throttleRAF(function () {
        var now = performance.now();
        var dt = (now - lastT) / 1000;
        var dy = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        lastT = now;

        if (dt > 0) samples.push(dy / dt);
        if (samples.length > 20) samples.shift();
      }));

      // Report velocity bucket every 10 seconds
      setInterval(function () {
        if (pageHidden() || samples.length < 5) return;
        var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
        var bucket;
        if (avg < 300) bucket = 'reading';
        else if (avg < 1500) bucket = 'scanning';
        else bucket = 'seeking';

        var pctBucket = Math.floor(scrollPct() / 25) * 25; // nearest 25%
        var key = bucket + '_' + pctBucket;
        if (!reported[key]) {
          reported[key] = true;
          LR.track('scroll_velocity', {
            velocity_bucket: bucket,
            avg_px_per_sec: Math.round(avg),
            scroll_pct: pctBucket,
            page_path: PAGE
          });
        }
        samples = [];
      }, 10000);
    })();

    // ================================================================
    // 13. RETURN VISITOR DETECTION
    // ================================================================
    (function () {
      var KEY = 'lr_visits';
      try {
        var data = JSON.parse(localStorage.getItem(KEY) || '{}');
        var count = (data.count || 0) + 1;
        var lastVisit = data.last || null;
        var daysSince = lastVisit ? Math.round((Date.now() - lastVisit) / 86400000) : null;

        if (count > 1) {
          LR.track('return_visitor', {
            visit_count: count,
            days_since_last: daysSince,
            page_path: PAGE
          });
        }

        localStorage.setItem(KEY, JSON.stringify({ count: count, last: Date.now() }));
      } catch (_) {}
    })();

    // ================================================================
    // 14. DEVICE ORIENTATION CHANGE
    // ================================================================
    window.addEventListener('orientationchange', function () {
      LR.track('orientation_change', {
        orientation: screen.orientation ? screen.orientation.type : (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
        page_path: PAGE
      });
    });

  } // end init()

  // ── Shared utilities ────────────────────────────────────────────
  function scrollPct() {
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    return docH <= 0 ? 100 : Math.round(((window.scrollY || document.documentElement.scrollTop) / docH) * 100);
  }

  function throttleRAF(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { fn(); ticking = false; });
    };
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
