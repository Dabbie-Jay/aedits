// AEDITS — homepage: work categories and enquiry form
(function () {
  var A = window.AEDITS;
  var esc = A.esc;

  // ── Work categories ────────────────────────────────────────
  // Four coloured boxes. Clicking one opens a panel underneath with that
  // category's projects; each project links to its own page.
  var catsEl = document.getElementById('cats');
  var empty = document.getElementById('empty');
  var projects = A.projects;
  var catDesc = {
    branding: 'Logos and brand identities',
    social: 'Campaigns and social media',
    print: 'Posters, flyers and print',
    packaging: 'Labels and product packaging'
  };
  var cats = (A.config.categories || []).slice();
  projects.forEach(function (p) {
    if (p.category && !cats.some(function (c) { return c.id === p.category; })) cats.push({ id: p.category, label: A.categoryLabel(p.category) });
  });

  function inCat(id) { return projects.filter(function (p) { return p.category === id; }); }

  function cardHTML(p) {
    var tileInner = p.cover
      ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">'
      : '<span>Project image</span>';
    return '<a class="cat-card" href="project.html?id=' + encodeURIComponent(p.id) + '">' +
      '<span class="tile">' + tileInner + '</span>' +
      '<h3>' + esc(p.title) + '<span aria-hidden="true">→</span></h3>' +
      '<p>' + esc([p.client, p.summary].filter(Boolean).join(', ')) + '</p>' +
      '</a>';
  }

  if (!projects.length) {
    empty.hidden = false;
    empty.textContent = 'New projects are on the way. Check back soon.';
  }

  catsEl.innerHTML = cats.map(function (c) {
    var n = inCat(c.id).length;
    return '<button class="cat-box ' + A.tileClass(c.id) + '" type="button" data-cat="' + esc(c.id) + '" aria-expanded="false" aria-controls="cat-panel">' +
      '<span class="cat-top"><span class="cat-count">' + (n ? n + (n === 1 ? ' project' : ' projects') : 'Coming soon') + '</span>' +
      '<span class="cat-plus" aria-hidden="true">+</span></span>' +
      '<span><span class="cat-name">' + esc(c.label) + '</span><span class="cat-desc">' + esc(catDesc[c.id] || '') + '</span></span>' +
      '</button>';
  }).join('');

  var panel = document.createElement('div');
  panel.className = 'cat-panel';
  panel.id = 'cat-panel';
  panel.setAttribute('role', 'region');
  panel.hidden = true;
  panel.innerHTML = '<div><div class="cat-panel-in"></div></div>';
  var panelIn = panel.querySelector('.cat-panel-in');
  var openBox = null;

  // Put the panel straight after the last box on the open box's row, so it
  // opens directly underneath it at every screen width.
  function placePanel() {
    if (!openBox) return;
    var boxes = [].slice.call(catsEl.querySelectorAll('.cat-box'));
    var row = boxes.filter(function (b) { return b.offsetTop === openBox.offsetTop; });
    row[row.length - 1].after(panel);
    panel.classList.toggle('first', row[0] === openBox);
    panel.classList.toggle('last', row[row.length - 1] === openBox);
  }

  function closePanel() {
    if (!openBox) return;
    openBox.classList.remove('open');
    openBox.setAttribute('aria-expanded', 'false');
    openBox = null;
    catsEl.classList.remove('has-open');
    panel.classList.remove('open');
    setTimeout(function () { if (!openBox) panel.hidden = true; }, 600);
  }

  function openCat(box) {
    if (openBox) { openBox.classList.remove('open'); openBox.setAttribute('aria-expanded', 'false'); }
    var id = box.getAttribute('data-cat');
    var list = inCat(id);
    openBox = box;
    box.classList.add('open');
    box.setAttribute('aria-expanded', 'true');
    catsEl.classList.add('has-open');
    panel.className = 'cat-panel ' + A.tileClass(id);
    panel.setAttribute('aria-label', A.categoryLabel(id) + ' projects');
    panelIn.innerHTML = list.length
      ? '<div class="cat-grid">' + list.map(cardHTML).join('') + '</div>'
      : '<p class="cat-empty">' + esc(A.categoryLabel(id)) + ' projects are on the way. Check back soon.</p>';
    panelIn.querySelectorAll('.cat-card').forEach(function (c, i) { c.style.transitionDelay = (0.2 + i * 0.08) + 's'; });
    panel.hidden = false;
    placePanel();
    void panel.offsetWidth;
    panel.classList.add('open');
  }

  catsEl.addEventListener('click', function (e) {
    var box = e.target.closest('.cat-box');
    if (!box) return;
    if (box === openBox) closePanel(); else openCat(box);
  });
  window.addEventListener('resize', placePanel);

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

  // ── About: heading highlight and approach steps ────────────
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

  // Steps open on hover where there's a mouse, and on tap on touch screens
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setStep(step, open) {
    step.classList.toggle('open', open);
    step.querySelector('button').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.querySelectorAll('.step').forEach(function (step) {
    var btn = step.querySelector('button');
    if (canHover) {
      setStep(step, false);
      // A short pause before opening, so a pointer just passing over doesn't open it
      var timer;
      step.addEventListener('mouseenter', function () { timer = setTimeout(function () { setStep(step, true); }, 150); });
      step.addEventListener('mouseleave', function () { clearTimeout(timer); if (document.activeElement !== btn) setStep(step, false); });
      btn.addEventListener('focus', function () { setStep(step, true); });
      btn.addEventListener('blur', function () { if (!step.matches(':hover')) setStep(step, false); });
    } else {
      btn.addEventListener('click', function () { setStep(step, !step.classList.contains('open')); });
    }
  });
})();
