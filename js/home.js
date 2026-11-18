// AEDITS — homepage: featured work and enquiry form
(function () {
  var A = window.AEDITS;
  var esc = A.esc;

  // ── Selected work ──────────────────────────────────────────
  // One featured project per category (set with "featured" in data/projects.js
  // or the tick box in admin.html), shown as large cards in a 2×2 grid. Each
  // card opens the project, and its button opens the page with all that
  // category's work.
  var empty = document.getElementById('empty');
  var cats = A.config.categories || [];

  function featHTML(c, i) {
    var p = A.featuredIn(c.id);
    var total = A.inCategory(c.id).length;
    var cls = A.tileClass(c.id);
    var label = esc(c.label);
    var idx = '<span class="feat-idx">' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + cats.length).slice(-2) + '</span>';
    var art = p && p.cover
      ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">'
      : '<span class="feat-ph">' + label + '<small>Project image</small></span>';
    var head = '<span class="feat-cat">' + label + '</span>';
    var all = '<a class="feat-all" href="category.html?c=' + encodeURIComponent(c.id) + '">' +
      'See all ' + label + ' work <span class="feat-n">' + total + '</span><span class="feat-arr" aria-hidden="true">→</span></a>';

    if (!p) {
      return '<article class="feat ' + cls + '">' + head +
        '<div class="feat-art"><span class="feat-piece">' + art + '</span></div>' +
        '<div class="feat-cap"><div><strong>Coming soon</strong><span class="feat-sub">' + esc(A.catDesc[c.id] || '') + '</span></div>' + idx + '</div>' +
        '</article>';
    }
    return '<article class="feat ' + cls + '">' + head +
      '<a class="feat-link" href="project.html?id=' + encodeURIComponent(p.id) + '">' +
        '<span class="feat-art"><span class="feat-piece">' + art + '</span></span>' +
        '<span class="feat-cap"><span><strong>' + esc(p.title) + '</strong>' +
        '<span class="feat-sub">' + esc([p.summary, p.client].filter(Boolean).join(' · ')) + '</span></span>' + idx + '</span>' +
      '</a>' + all +
      '</article>';
  }

  if (!A.projects.length) {
    empty.hidden = false;
    empty.textContent = 'New projects are on the way. Check back soon.';
  }
  document.getElementById('featured').innerHTML = cats.map(featHTML).join('');

  // ── Enquiry form ───────────────────────────────────────────
  var form = document.getElementById('enquiry');
  var err = document.getElementById('form-error');
  var sent = document.getElementById('sent');
  var sentTitle = document.getElementById('sent-title');
  var sentMsg = document.getElementById('sent-msg');
  var submitBtn = form.querySelector('button[type="submit"]');
  var cfg = A.config;
  function field(n) { return form.elements.namedItem(n); }

  function showError(html) { err.innerHTML = html; err.hidden = false; }

  function mailtoLink(data) {
    var subject = 'Project enquiry: ' + data.service;
    var body = 'Name: ' + data.name + '\nEmail: ' + data.email + '\nService: ' + data.service + '\n\n' + data.message;
    return 'mailto:' + (cfg.email || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function done(title, msg) {
    sentTitle.textContent = title;
    sentMsg.innerHTML = msg;
    form.hidden = true;
    sent.hidden = false;
    sent.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    if (field('botcheck').checked) return; // spam bot

    var data = {
      name: field('name').value.trim(),
      email: field('email').value.trim(),
      service: field('service').value,
      message: field('message').value.trim()
    };
    if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError('Add your name and a valid email address.');
      field(data.name ? 'email' : 'name').focus();
      return;
    }

    // No form service set up: fall back to the visitor's email app
    if (!cfg.web3formsKey) {
      window.location.href = mailtoLink(data);
      done('Your email is ready to send', 'Your email app has opened with your enquiry filled in. Press send there and expect a reply within two working days.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: cfg.web3formsKey,
        subject: 'New AEDITS enquiry: ' + data.service + ' from ' + data.name,
        from_name: 'AEDITS website',
        replyto: data.email,
        name: data.name,
        email: data.email,
        service: data.service,
        message: data.message || '(no details given)'
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.success !== false, body: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.body && res.body.message) || 'Request failed');
        done('Enquiry sent', 'Thanks, ' + esc(data.name) + '. Expect a reply within two working days.');
        form.reset();
      })
      .catch(function () {
        showError('Your enquiry didn’t go through. Check your connection and try again, or <a href="' + esc(mailtoLink(data)) + '">send it by email instead</a>.');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send enquiry';
      });
  });

  // ── About: heading highlight ───────────────────────────────
  var aboutTitle = document.querySelector('.about-title');
  if (aboutTitle) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { aboutTitle.classList.add('lit'); io.disconnect(); }
      }, { threshold: 0.6 });
      io.observe(aboutTitle);
    } else {
      aboutTitle.classList.add('lit');
    }
  }
})();
