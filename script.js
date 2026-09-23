/* Goose Creek Deck — one page
   Three jobs: the year, the thumb dock, and the estimate form. */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     TODO BEFORE LAUNCH — paste the real submit endpoint here.
     Works with Formspree, Basin, a Netlify function, or any URL that
     accepts a POST. While it is empty the form validates and then tells
     the visitor to call instead, rather than pretending it sent.
     ------------------------------------------------------------------ */
  var FORM_ENDPOINT = '';

  /* ---------- year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- thumb dock: up once the hero is behind you ---------- */
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');

  if (dock && hero && 'IntersectionObserver' in window) {
    dock.hidden = false;
    new IntersectionObserver(function (entries) {
      dock.classList.toggle('is-up', !entries[0].isIntersecting);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
  }

  /* ---------- the deck that builds itself ----------
     Scroll position through the services figure drives the build order. With no
     JS the finished deck is already on the page; this only takes it apart and
     puts it back together, and it does not do that at all under reduced motion. */
  var deck = document.getElementById('deckbuild');

  if (deck) {
    var layers = deck.querySelectorAll('.dp');
    var dots = deck.querySelectorAll('.deckbuild__steps i');
    var stageName = document.getElementById('deckbuild-stage');
    var STAGES = ['Footings', 'Posts', 'Beams', 'Joists', 'Decking', 'Railing'];
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (calm || !layers.length) {
      for (var d = 0; d < dots.length; d++) dots[d].classList.add('on');
    } else {
      deck.classList.add('is-staged');

      var shown = -1;
      var queued = false;

      var paint = function () {
        queued = false;

        var box = deck.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        // Starts as the figure comes up from the fold, finishes before it leaves.
        var from = vh * 0.85, to = vh * 0.2;
        var p = (from - box.top) / (from - to);
        p = p < 0 ? 0 : (p > 1 ? 1 : p);

        var stage = Math.ceil(p * layers.length);
        if (stage > layers.length) stage = layers.length;
        if (stage === shown) return;
        shown = stage;

        for (var i = 0; i < layers.length; i++) {
          layers[i].classList.toggle('is-on', i < stage);
          layers[i].classList.toggle('is-active', i === stage - 1);
        }
        for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('on', j < stage);
        if (stageName) stageName.textContent = STAGES[stage > 0 ? stage - 1 : 0];
      };

      var nudge = function () {
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      };

      window.addEventListener('scroll', nudge, { passive: true });
      window.addEventListener('resize', nudge);
      paint();
    }
  }

  /* ---------- why-us entrance: plays once when the section comes into view ---------- */
  var why = document.getElementById('why');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (why && !still && 'IntersectionObserver' in window) {
    why.classList.add('is-staged');
    var whyIo = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        why.classList.add('is-in');
        whyIo.disconnect();
      }
    }, { threshold: 0.2 });
    whyIo.observe(why);
  }

  /* ---------- how it works: the backyard moves through the job ----------
     Scroll through the section picks the stage (1-4); clicking a step jumps
     to it until the scroll moves on to another stage. Under reduced motion
     nothing is wired and the finished deck shows. */
  var howArt = document.querySelector('.how__art');

  if (howArt) {
    var howSteps = document.querySelectorAll('.how__step');
    var howCap = document.getElementById('how-cap');
    var howIn = document.querySelector('.how__in');
    var CAPS = ['Your backyard, today', 'Measured on-site', 'Framed, and priced in 24 hours', 'Your finished deck'];
    var shownStage = 0, scrollStage = 0, howQueued = false;

    var setStage = function (n) {
      if (n === shownStage) return;
      shownStage = n;
      howArt.setAttribute('data-stage', n);
      for (var i = 0; i < howSteps.length; i++) {
        var on = i === n - 1;
        howSteps[i].classList.toggle('is-on', on);
        howSteps[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      if (howCap) howCap.textContent = CAPS[n - 1];
    };

    Array.prototype.forEach.call(howSteps, function (btn) {
      btn.addEventListener('click', function () { setStage(+btn.getAttribute('data-stage')); });
    });

    if (still) {
      setStage(4);
    } else {
      var readScroll = function () {
        howQueued = false;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var s;
        if (getComputedStyle(howArt).position === 'sticky') {
          // Phones: the picture is pinned on top. The step that has scrolled
          // up to just under it is the one being read.
          var line = howArt.getBoundingClientRect().bottom + (vh - howArt.getBoundingClientRect().bottom) * 0.35;
          s = 1;
          for (var k = 0; k < howSteps.length; k++) {
            if (howSteps[k].getBoundingClientRect().top < line) s = k + 1;
          }
        } else {
          var box = howIn.getBoundingClientRect();
          var from = vh * 0.75, span = vh * 0.45 + box.height * 0.35;
          var p = (from - box.top) / span;
          p = p < 0 ? 0 : (p > 0.999 ? 0.999 : p);
          s = 1 + Math.floor(p * 4);
        }
        if (s !== scrollStage) { scrollStage = s; setStage(s); }
      };
      var nudgeHow = function () {
        if (!howQueued) { howQueued = true; requestAnimationFrame(readScroll); }
      };
      window.addEventListener('scroll', nudgeHow, { passive: true });
      window.addEventListener('resize', nudgeHow);
      readScroll();
    }
  }

  /* ---------- soft entrance for every section ----------
     Each group's pieces fade and rise in order as the group scrolls into view.
     The class is only added here, so with no JS or under reduced motion
     nothing is ever hidden. Once played, the classes come off again so each
     element gets its own transitions (hover, sticky, etc.) back. The hero and
     Why-us have their own entrances and are not in this list. */
  var REVEAL = [
    '.services__copy > *', '.services__fig', '.feats > .feat',
    '.about__copy > *', '.about__montage',
    '.work .kicker', '.work__h2', '.work__carousel-wrap', '.work .act',
    '.cta-break__copy > *', '.cta-break__mark',
    '.how .kicker', '.how__h2', '.how .why__rule', '.how__art', '.how__steps > li', '.how__cta',
    '.financing .finance',
    '.flooring__gallery', '.flooring__copy > *',
    '.estimate__aside > *', '.estimate .form',
    '.foot__in > *'
  ];

  if (!still && 'IntersectionObserver' in window) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        revealIo.unobserve(el);
        el.classList.add('is-in');
        var wait = parseInt(el.style.getPropertyValue('--rv-d'), 10) || 0;
        setTimeout(function () {
          el.classList.remove('rv', 'is-in');
          el.style.removeProperty('--rv-d');
        }, wait + 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    Array.prototype.forEach.call(document.querySelectorAll('section, footer'), function (block) {
      var n = 0;
      Array.prototype.forEach.call(block.querySelectorAll(REVEAL.join(',')), function (el) {
        if (el.classList.contains('rv')) return;
        el.classList.add('rv');
        el.style.setProperty('--rv-d', Math.min(n * 90, 540) + 'ms');
        n++;
        revealIo.observe(el);
      });
    });
  }

  /* ---------- estimate form ----------
     Bound by class, so a second form can be added later without touching this. */
  function fieldIsValid(el) {
    if (!el.required) return true;
    if (!el.value.trim()) return false;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
    if (el.type === 'tel') return (el.value.replace(/\D/g, '').length >= 10);
    return true;
  }

  function wireForm(form) {
    var note = form.querySelector('.form__note');
    var send = form.querySelector('.form__send');

    function say(msg, state) {
      if (!note) return;
      note.textContent = msg;
      note.setAttribute('data-state', state || 'ok');
    }

    // Clear the invalid flag as soon as the visitor fixes the field.
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && fieldIsValid(e.target)) {
        e.target.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = form.querySelectorAll('input, textarea');
      var firstBad = null;

      Array.prototype.forEach.call(fields, function (el) {
        if (fieldIsValid(el)) {
          el.removeAttribute('aria-invalid');
        } else {
          el.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = el;
        }
      });

      if (firstBad) {
        say('Please check the highlighted fields so we can reach you.', 'error');
        firstBad.focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        say('This form is not connected yet — please call (854) 444-8481 and we will take it from there.', 'error');
        return;
      }

      send.disabled = true;
      say('Sending your request…');

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          window.location.href = form.getAttribute('data-thanks') || '/thanks';
        })
        .catch(function () {
          send.disabled = false;
          say('That did not go through. Please call (854) 444-8481 and we will take it from there.', 'error');
        });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('form.form'), wireForm);
})();
