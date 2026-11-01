// AEDITS — homepage: work grid, filters and enquiry form
(function () {
  var A = window.AEDITS;
  var esc = A.esc;

  // ── Work grid ──────────────────────────────────────────────
  var grid = document.getElementById('grid');
  var filtersEl = document.getElementById('filters');
  var empty = document.getElementById('empty');
  var projects = A.projects;
  var current = 'all';

  function cardHTML(p) {
    var href = 'project.html?id=' + encodeURIComponent(p.id);
    var tileInner = p.cover
      ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">'
      : '<span>Project image</span>';
    return '<article class="card">' +
      '<a class="tile ' + A.tileClass(p.category) + '" href="' + href + '" tabindex="-1" aria-hidden="true">' + tileInner + '</a>' +
      '<div class="card-row"><h3><a href="' + href + '">' + esc(p.title) + '</a></h3>' +
      '<span class="cat">' + esc(A.categoryLabel(p.category)) + '</span></div>' +
      '<p>' + esc([p.client, p.summary].filter(Boolean).join(', ')) + '</p>' +
      '</article>';
  }

  function renderGrid() {
    var shown = projects.filter(function (p) { return current === 'all' || p.category === current; });
    grid.innerHTML = shown.map(cardHTML).join('');
    empty.hidden = shown.length > 0;
    empty.textContent = projects.length === 0
      ? 'New projects are on the way. Check back soon.'
      : 'No projects in this category yet. Pick another filter to see more work.';
  }

  function renderFilters() {
    var used = [];
    projects.forEach(function (p) { if (p.category && used.indexOf(p.category) === -1) used.push(p.category); });
    // Keep the order from config, then any extras
    var order = (A.config.categories || []).map(function (c) { return c.id; });
    used.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    if (used.length < 2) { filtersEl.hidden = true; return; }
    var items = [{ id: 'all', label: 'All' }].concat(used.map(function (id) { return { id: id, label: A.categoryLabel(id) }; }));
    filtersEl.innerHTML = items.map(function (it) {
      return '<button class="filter" type="button" data-filter="' + esc(it.id) + '" aria-pressed="' + (it.id === current) + '">' + esc(it.label) + '</button>';
    }).join('');
  }

  filtersEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter');
    if (!btn) return;
    current = btn.getAttribute('data-filter');
    filtersEl.querySelectorAll('.filter').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    renderGrid();
  });

  renderFilters();
  renderGrid();

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
      showError('Add your name and a valid email address so I can reply.');
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
})();
