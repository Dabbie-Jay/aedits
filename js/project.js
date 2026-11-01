// AEDITS — project detail page
(function () {
  var A = window.AEDITS;
  var esc = A.esc;
  var main = document.getElementById('project');
  var projects = A.projects;
  var id = new URLSearchParams(window.location.search).get('id');
  var index = -1;
  for (var i = 0; i < projects.length; i++) if (projects[i].id === id) { index = i; break; }

  if (index === -1) {
    document.title = 'Project not found · AEDITS';
    main.innerHTML =
      '<div class="notfound">' +
      '<h1 class="p-title">Project not found</h1>' +
      '<p style="margin:0;font-size:19px;max-width:44ch">This project may have been renamed or removed. Have a look through the rest of the work instead.</p>' +
      '<a class="pill pill-primary" href="index.html#work">See all work</a>' +
      '</div>';
    return;
  }

  var p = projects[index];
  document.title = p.title + ' · AEDITS';
  var desc = document.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
  desc.content = [p.summary, p.client].filter(Boolean).join(' for ');

  // Gallery = cover first (if any) then the other images, without duplicates
  var gallery = [];
  if (p.cover) gallery.push({ src: p.cover, alt: p.title + ' cover image' });
  (p.images || []).forEach(function (img) {
    if (img && img.src && img.src !== p.cover) gallery.push({ src: img.src, alt: img.alt || '' });
  });

  var meta = [
    ['Client', p.client],
    ['Category', A.categoryLabel(p.category)],
    ['Year', p.year]
  ].filter(function (m) { return m[1]; }).map(function (m) {
    return '<div><dt>' + m[0] + '</dt><dd>' + esc(m[1]) + '</dd></div>';
  }).join('');

  var paragraphs = String(p.description || '').split(/\n\s*\n/).map(function (t) { return t.trim(); }).filter(Boolean)
    .map(function (t) { return '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; }).join('');

  var cover = p.cover
    ? '<div class="p-cover"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + ' cover image"></div>'
    : '<div class="p-cover tile ' + A.tileClass(p.category) + '"><span>Project image</span></div>';

  var galleryItems = gallery.slice(p.cover ? 1 : 0);
  var galleryHTML = galleryItems.map(function (img, n) {
    var at = n + (p.cover ? 1 : 0);
    return '<button class="g-item" type="button" data-index="' + at + '" aria-label="View image ' + (at + 1) + ' of ' + gallery.length + (img.alt ? ': ' + esc(img.alt) : '') + '">' +
      '<img src="' + esc(img.src) + '" alt="' + esc(img.alt) + '" loading="lazy"></button>';
  }).join('');

  var prev = projects[(index - 1 + projects.length) % projects.length];
  var next = projects[(index + 1) % projects.length];
  var navHTML = projects.length > 1
    ? '<nav class="p-nav" aria-label="More projects">' +
      '<a class="prev" href="project.html?id=' + encodeURIComponent(prev.id) + '"><span>Previous project</span><strong>' + esc(prev.title) + '</strong></a>' +
      (next.id !== prev.id ? '<a class="next" href="project.html?id=' + encodeURIComponent(next.id) + '"><span>Next project</span><strong>' + esc(next.title) + '</strong></a>' : '') +
      '</nav>'
    : '';

  main.innerHTML =
    '<div class="p-head">' +
      '<a class="back" href="index.html#work"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>All work</a>' +
      '<h1 class="p-title">' + esc(p.title) + '</h1>' +
      (meta ? '<dl class="p-meta">' + meta + '</dl>' : '') +
    '</div>' +
    (p.cover ? '<button class="g-item" type="button" data-index="0" style="display:block;width:100%;aspect-ratio:auto" aria-label="View cover image full size">' + cover + '</button>' : cover) +
    '<div class="p-body">' +
      (p.summary ? '<p class="p-summary">' + esc(p.summary) + '</p>' : '') +
      '<div class="p-desc">' + paragraphs + '</div>' +
    '</div>' +
    (galleryHTML ? '<div class="gallery">' + galleryHTML + '</div>' : '') +
    navHTML;

  // ── Lightbox ───────────────────────────────────────────────
  var dlg = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var at = 0;

  function show(n) {
    at = (n + gallery.length) % gallery.length;
    var img = gallery[at];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = (img.alt ? img.alt + '  ' : '') + '(' + (at + 1) + ' of ' + gallery.length + ')';
  }

  lbPrev.hidden = lbNext.hidden = gallery.length < 2;

  main.addEventListener('click', function (e) {
    var b = e.target.closest('.g-item');
    if (!b || !gallery.length) return;
    show(parseInt(b.getAttribute('data-index'), 10) || 0);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else window.open(gallery[at].src, '_blank');
  });
  document.getElementById('lb-close').addEventListener('click', function () { dlg.close(); });
  lbPrev.addEventListener('click', function () { show(at - 1); });
  lbNext.addEventListener('click', function () { show(at + 1); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-in')) dlg.close(); });
})();
