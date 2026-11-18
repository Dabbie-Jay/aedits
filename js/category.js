// AEDITS — category page: every project in one category (category.html?c=branding)
(function () {
  var A = window.AEDITS;
  var esc = A.esc;
  var main = document.getElementById('category');
  var id = new URLSearchParams(window.location.search).get('c');
  var cats = A.config.categories || [];
  var cat = cats.filter(function (c) { return c.id === id; })[0];

  if (!cat) {
    document.title = 'Category not found · AEDITS';
    main.innerHTML =
      '<div class="wrap notfound">' +
      '<h1 class="p-title">Category not found</h1>' +
      '<p style="margin:0;font-size:17px;max-width:44ch">Have a look through the selected work instead.</p>' +
      '<a class="pill pill-primary" href="index.html#work">See selected work</a>' +
      '</div>';
    return;
  }

  document.title = cat.label + ' · AEDITS';
  var desc = document.querySelector('meta[name="description"]');
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
  desc.content = cat.label + ' work by AEDITS: ' + (A.catDesc[id] || '').toLowerCase() + '.';

  // Featured project first, then the rest in the order they're listed
  var feat = A.featuredIn(id);
  var list = A.inCategory(id);
  if (feat) list = [feat].concat(list.filter(function (p) { return p !== feat; }));
  var cls = A.tileClass(id);

  function cardHTML(p, i) {
    var tileInner = p.cover
      ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">'
      : '<span>Project image</span>';
    return '<a class="work-card" style="animation-delay:' + (i * 0.08) + 's" href="project.html?id=' + encodeURIComponent(p.id) + '">' +
      '<span class="tile ' + cls + '">' + tileInner + (p === feat ? '<span class="work-badge">Featured</span>' : '') + '</span>' +
      '<span class="work-row"><strong>' + esc(p.title) + '</strong></span>' +
      '<span class="work-sub">' + esc([p.client, p.summary].filter(Boolean).join(', ')) + (p.year ? ' · ' + esc(p.year) : '') + '</span>' +
      '</a>';
  }

  var others = cats.filter(function (c) { return c.id !== id; }).map(function (c) {
    return '<a class="cat-link ' + A.tileClass(c.id) + '" href="category.html?c=' + encodeURIComponent(c.id) + '">' + esc(c.label) + ' <span aria-hidden="true">→</span></a>';
  }).join('');

  main.innerHTML =
    '<section class="cat-hero ' + cls + '">' +
      '<div class="wrap">' +
        '<a class="back" href="index.html#services"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>What AEDITS designs</a>' +
        '<h1 class="cat-hero-title">' + esc(cat.label) + '</h1>' +
        '<p class="cat-hero-desc">' + esc(A.catDesc[id] || '') + '</p>' +
        '<p class="cat-hero-n">' + list.length + (list.length === 1 ? ' project' : ' projects') + '</p>' +
      '</div>' +
    '</section>' +
    '<section class="wrap section">' +
      (list.length
        ? '<div class="work-grid">' + list.map(cardHTML).join('') + '</div>'
        : '<p class="cat-none">' + esc(cat.label) + ' projects are on the way. Check back soon.</p>') +
      '<nav class="cat-more" aria-label="Other categories"><p class="eyebrow">More work</p><div>' + others + '</div></nav>' +
    '</section>';
})();
