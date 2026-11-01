// AEDITS — admin dashboard
// Edits data/projects.js and project images, then either downloads them as a
// zip or commits them to GitHub (which redeploys the site on Netlify,
// Vercel, GitHub Pages, Cloudflare Pages and similar hosts).
(function () {
  var CONFIG = window.AEDITS_CONFIG || {};
  var CATS = CONFIG.categories || [];
  var SETTINGS_KEY = 'aedits-admin-settings';
  var DATA_PATH = 'data/projects.js';
  var IMG_DIR = 'images/projects/';

  var projects = clone(window.AEDITS_PROJECTS || []);
  var pending = {};       // image path -> { dataUrl, base64 } not yet saved
  var currentIdx = projects.length ? 0 : -1;
  var dirty = false;

  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('list'), editorEl = $('editor'), statusEl = $('status'), logEl = $('log');

  // ── helpers ────────────────────────────────────────────────
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }

  function icon(d) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '20'); s.setAttribute('height', '20'); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.2');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p);
    return s;
  }
  var ICON_UP = 'M18 15l-6-6-6 6', ICON_DOWN = 'M6 9l6 6 6-6', ICON_X = 'M18 6L6 18M6 6l12 12';

  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function uniqueId(base, skipIdx) {
    var id = base || 'project', n = 2;
    while (projects.some(function (p, i) { return i !== skipIdx && p.id === id; })) id = base + '-' + n++;
    return id;
  }

  function src(path) { return pending[path] ? pending[path].dataUrl : path; }

  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
    return id || 'No category';
  }

  function tileClass(id) { return ['branding', 'social', 'print', 'packaging'].indexOf(id) > -1 ? id : 'other'; }

  function setDirty(v) {
    dirty = v;
    statusEl.textContent = v ? 'Unsaved changes' : 'All changes saved';
    statusEl.classList.toggle('dirty', v);
  }

  function log(msg) { logEl.textContent = msg; }

  function settingsMsg(msg, ok) {
    var el = $('settings-msg');
    el.textContent = msg;
    el.className = 'ad-msg ' + (ok === true ? 'ok' : ok === false ? 'bad' : '');
  }

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  // ── images ─────────────────────────────────────────────────
  // Large JPEG/WebP files are resized to 2400px and re-encoded so the site stays fast.
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.type)) return reject(new Error(file.name + ' is not a JPG, PNG, WebP, GIF or SVG image.'));
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Couldn’t read ' + file.name)); };
      fr.onload = function () {
        var dataUrl = fr.result;
        var shrinkable = /^image\/(jpeg|webp)$/.test(file.type) || (file.type === 'image/png' && file.size > 3e6);
        if (!shrinkable) return resolve({ dataUrl: dataUrl, ext: extOf(file) });
        var img = new Image();
        img.onload = function () {
          var max = 2400, w = img.naturalWidth, hgt = img.naturalHeight;
          if (w <= max && hgt <= max && file.size < 1.5e6) return resolve({ dataUrl: dataUrl, ext: extOf(file) });
          var scale = Math.min(1, max / Math.max(w, hgt));
          var c = document.createElement('canvas');
          c.width = Math.round(w * scale); c.height = Math.round(hgt * scale);
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve({ dataUrl: c.toDataURL('image/jpeg', 0.86), ext: 'jpg' });
        };
        img.onerror = function () { resolve({ dataUrl: dataUrl, ext: extOf(file) }); };
        img.src = dataUrl;
      };
      fr.readAsDataURL(file);
    });
  }

  function extOf(file) {
    var m = /\.([a-z0-9]+)$/i.exec(file.name);
    var e = m ? m[1].toLowerCase() : (file.type.split('/')[1] || 'jpg');
    return e === 'jpeg' ? 'jpg' : e.replace('svg+xml', 'svg');
  }

  function addImage(file, project) {
    return readImage(file).then(function (r) {
      var base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
      var path = IMG_DIR + (project.id || 'project') + '/' + base + '-' + Date.now().toString(36) + '.' + r.ext;
      pending[path] = { dataUrl: r.dataUrl, base64: r.dataUrl.split(',')[1] };
      return path;
    });
  }

  // ── list ───────────────────────────────────────────────────
  function renderList() {
    listEl.innerHTML = '';
    projects.forEach(function (p, i) {
      var thumb = h('span', { class: 'ad-thumb tile ' + tileClass(p.category), 'aria-hidden': 'true' },
        p.cover ? [h('img', { src: src(p.cover), alt: '' })] : []);
      var pick = h('button', {
        class: 'ad-pick', type: 'button', 'aria-current': i === currentIdx ? 'true' : null,
        onclick: function () { currentIdx = i; renderAll(); }
      }, [thumb, h('span', null, [h('strong', { text: p.title || 'Untitled project' }), h('small', { text: catLabel(p.category) + (p.year ? ', ' + p.year : '') })])]);
      var up = h('button', { class: 'ad-icon', type: 'button', 'aria-label': 'Move ' + (p.title || 'project') + ' up', disabled: i === 0, onclick: function () { move(i, -1); } }, [icon(ICON_UP)]);
      var down = h('button', { class: 'ad-icon', type: 'button', 'aria-label': 'Move ' + (p.title || 'project') + ' down', disabled: i === projects.length - 1, onclick: function () { move(i, 1); } }, [icon(ICON_DOWN)]);
      listEl.appendChild(h('li', { class: 'ad-item' + (i === currentIdx ? ' active' : '') }, [pick, up, down]));
    });
    if (!projects.length) listEl.appendChild(h('li', { class: 'ad-help', text: 'No projects yet.' }));
  }

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= projects.length) return;
    var t = projects[i]; projects[i] = projects[j]; projects[j] = t;
    if (currentIdx === i) currentIdx = j; else if (currentIdx === j) currentIdx = i;
    setDirty(true);
    renderAll();
  }

  // ── editor ─────────────────────────────────────────────────
  function field(label, input, hint) {
    var id = input.id;
    return h('div', { class: 'field' }, [
      h('label', { for: id }, [label, hint ? h('span', { class: 'ad-hint', text: '  ' + hint }) : null]),
      input
    ]);
  }

  function bind(input, project, key, after) {
    input.addEventListener('input', function () {
      project[key] = input.value;
      setDirty(true);
      if (after) after();
      renderList();
    });
    return input;
  }

  function renderEditor() {
    editorEl.innerHTML = '';
    var p = projects[currentIdx];
    if (!p) {
      editorEl.appendChild(h('div', { class: 'ad-empty' }, [
        h('h2', { text: 'Add your first project' }),
        h('p', { class: 'ad-help', text: 'Projects you add here appear in the Selected work grid and get their own page with an image gallery.' }),
        h('button', { class: 'pill pill-primary', type: 'button', text: 'New project', onclick: newProject })
      ]));
      return;
    }

    editorEl.appendChild(h('h2', { text: p.title || 'Untitled project' }));
    var heading = editorEl.firstChild;

    // Basic details
    var idErr = h('p', { class: 'ad-field-err', hidden: true });
    var idInput = h('input', { id: 'f-id', type: 'text', value: p.id, spellcheck: 'false' });
    idInput.addEventListener('input', function () {
      var clean = slugify(idInput.value);
      p.id = clean;
      var clash = projects.some(function (q, i) { return i !== currentIdx && q.id === clean; });
      idErr.hidden = !(clash || !clean);
      idErr.textContent = !clean ? 'Add a page address using letters, numbers and dashes.' : 'Another project already uses this address.';
      setDirty(true);
    });
    idInput.addEventListener('blur', function () { idInput.value = p.id; });

    var titleInput = h('input', { id: 'f-title', type: 'text', value: p.title });
    var autoId = p.id === '' || p.id.indexOf('new-project') === 0;
    bind(titleInput, p, 'title', function () {
      heading.textContent = p.title || 'Untitled project';
      if (autoId) { p.id = uniqueId(slugify(p.title) || 'new-project', currentIdx); idInput.value = p.id; }
    });

    var cat = h('select', { id: 'f-cat' }, CATS.map(function (c) {
      return h('option', { value: c.id, text: c.label, selected: c.id === p.category });
    }));
    cat.value = p.category;
    cat.addEventListener('change', function () { p.category = cat.value; setDirty(true); renderList(); renderCover(); });

    editorEl.appendChild(h('div', { class: 'ad-grid2' }, [
      field('Project title', titleInput),
      field('Client', bind(h('input', { id: 'f-client', type: 'text', value: p.client }), p, 'client')),
      field('Category', cat),
      field('Year', bind(h('input', { id: 'f-year', type: 'text', inputmode: 'numeric', value: p.year }), p, 'year'))
    ]));

    editorEl.appendChild(field('Short summary', bind(h('input', { id: 'f-summary', type: 'text', value: p.summary, maxlength: '120' }), p, 'summary'), 'Shown under the project in the grid'));

    var descInput = bind(h('textarea', { id: 'f-desc', rows: '8' }), p, 'description');
    descInput.value = p.description || '';
    editorEl.appendChild(field('Description', descInput, 'Leave a blank line between paragraphs'));

    editorEl.appendChild(h('div', null, [field('Page address', idInput, 'project.html?id=…'), idErr]));

    // Cover image
    var coverBox = h('div', { class: 'ad-cover' });
    function renderCover() {
      coverBox.innerHTML = '';
      coverBox.appendChild(h('div', { class: 'ad-cover-prev tile ' + tileClass(p.category) },
        p.cover ? [h('img', { src: src(p.cover), alt: 'Cover image preview' })] : [h('span', { text: 'No cover image' })]));
      var input = h('input', { type: 'file', accept: 'image/*', 'aria-label': p.cover ? 'Replace cover image' : 'Choose cover image' });
      input.addEventListener('change', function () {
        var f = input.files[0]; if (!f) return;
        addImage(f, p).then(function (path) {
          p.cover = path; setDirty(true); renderCover(); renderList();
        }).catch(function (e) { log(e.message); });
      });
      var btns = h('div', { class: 'ad-row' }, [
        h('span', { class: 'pill pill-outline ad-sm ad-file' }, [p.cover ? 'Replace image' : 'Choose image', input])
      ]);
      if (p.cover) btns.appendChild(h('button', { class: 'ad-textbtn', type: 'button', text: 'Remove cover', onclick: function () { p.cover = ''; setDirty(true); renderCover(); renderList(); } }));
      coverBox.appendChild(h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
        btns, h('p', { class: 'ad-help', text: 'Shown in the grid and at the top of the project page. Landscape works best.' })
      ]));
    }
    renderCover();
    editorEl.appendChild(h('div', { class: 'ad-block' }, [h('h3', { text: 'Cover image' }), coverBox]));

    // Gallery
    p.images = p.images || [];
    var galList = h('ol', { class: 'ad-gallery' });
    function renderGallery() {
      galList.innerHTML = '';
      p.images.forEach(function (img, i) {
        var alt = h('input', { id: 'g-alt-' + i, type: 'text', value: img.alt || '' });
        alt.addEventListener('input', function () { img.alt = alt.value; setDirty(true); });
        galList.appendChild(h('li', { class: 'ad-g' }, [
          h('img', { src: src(img.src), alt: '' }),
          field('Image description', alt, 'For screen readers'),
          h('div', { class: 'ad-g-btns' }, [
            h('button', { class: 'ad-icon', type: 'button', 'aria-label': 'Move image ' + (i + 1) + ' up', disabled: i === 0, onclick: function () { swap(i, i - 1); } }, [icon(ICON_UP)]),
            h('button', { class: 'ad-icon', type: 'button', 'aria-label': 'Move image ' + (i + 1) + ' down', disabled: i === p.images.length - 1, onclick: function () { swap(i, i + 1); } }, [icon(ICON_DOWN)]),
            h('button', { class: 'ad-icon ad-danger', type: 'button', 'aria-label': 'Remove image ' + (i + 1), onclick: function () { p.images.splice(i, 1); setDirty(true); renderGallery(); } }, [icon(ICON_X)])
          ])
        ]));
      });
      if (!p.images.length) galList.appendChild(h('li', { class: 'ad-help', text: 'No gallery images yet.' }));
    }
    function swap(a, b) { var t = p.images[a]; p.images[a] = p.images[b]; p.images[b] = t; setDirty(true); renderGallery(); }
    renderGallery();

    var gInput = h('input', { type: 'file', accept: 'image/*', multiple: true, 'aria-label': 'Add gallery images' });
    gInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(gInput.files);
      if (!files.length) return;
      log('Adding ' + files.length + ' image' + (files.length > 1 ? 's' : '') + '…');
      Promise.all(files.map(function (f) {
        return addImage(f, p).then(function (path) { return { src: path, alt: '' }; }, function (e) { log(e.message); return null; });
      })).then(function (items) {
        items.filter(Boolean).forEach(function (it) { p.images.push(it); });
        gInput.value = '';
        setDirty(true); renderGallery();
        log('Images added. Give each one a short description, then publish.');
      });
    });

    editorEl.appendChild(h('div', { class: 'ad-block' }, [
      h('h3', { text: 'Gallery' }),
      h('p', { class: 'ad-help', text: 'Visitors can open these full size on the project page. You can select several images at once.' }),
      galList,
      h('div', { class: 'ad-row' }, [h('span', { class: 'pill pill-outline ad-sm ad-file' }, ['Add images', gInput])])
    ]));

    // Footer
    editorEl.appendChild(h('div', { class: 'ad-foot' }, [
      h('a', { class: 'pill pill-outline ad-sm', href: 'project.html?id=' + encodeURIComponent(p.id), target: '_blank', rel: 'noopener', text: 'View live page' }),
      h('button', { class: 'pill ad-sm ad-delete', type: 'button', text: 'Delete project', onclick: function () {
        if (!confirm('Delete “' + (p.title || 'Untitled project') + '”? This takes effect when you publish.')) return;
        projects.splice(currentIdx, 1);
        currentIdx = Math.min(currentIdx, projects.length - 1);
        setDirty(true); renderAll();
      } })
    ]));
  }

  function newProject() {
    var first = CATS[0] ? CATS[0].id : '';
    projects.unshift({
      id: uniqueId('new-project', -1), title: '', client: '', category: first,
      year: String(new Date().getFullYear()), summary: '', description: '', cover: '', images: []
    });
    currentIdx = 0;
    setDirty(true);
    renderAll();
    $('f-title').focus();
  }

  function renderAll() { renderList(); renderEditor(); }

  // ── output ─────────────────────────────────────────────────
  function validate() {
    var seen = {};
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      if (!p.title.trim()) return 'Give every project a title. Project ' + (i + 1) + ' is missing one.';
      if (!p.id) return '“' + p.title + '” needs a page address.';
      if (seen[p.id]) return 'Two projects use the page address “' + p.id + '”. Change one of them.';
      seen[p.id] = true;
    }
    return '';
  }

  function usedPaths() {
    var used = {};
    projects.forEach(function (p) {
      if (p.cover) used[p.cover] = true;
      (p.images || []).forEach(function (i) { if (i.src) used[i.src] = true; });
    });
    return Object.keys(pending).filter(function (k) { return used[k]; });
  }

  function dataFile() {
    return '// Managed by admin.html. You can also edit this file by hand.\n' +
      '// Each project: id (used in the page link), title, client, category, year,\n' +
      '// summary (one line for the grid), description (blank line between paragraphs),\n' +
      '// cover (image path or ""), images (gallery: [{ "src": "...", "alt": "..." }]).\n' +
      'window.AEDITS_PROJECTS = ' + JSON.stringify(projects, null, 2) + ';\n';
  }

  function toBase64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  $('btn-download').addEventListener('click', function () {
    var problem = validate(); if (problem) { log(problem); return; }
    if (!window.JSZip) { log('The zip tool didn’t load. Check your internet connection and reload this page.'); return; }
    var zip = new JSZip();
    zip.file(DATA_PATH, dataFile());
    var paths = usedPaths();
    paths.forEach(function (path) { zip.file(path, pending[path].base64, { base64: true }); });
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'aedits-update.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      log('Downloaded aedits-update.zip with ' + DATA_PATH + (paths.length ? ' and ' + paths.length + ' new image' + (paths.length > 1 ? 's' : '') : '') +
        '. Unzip it into your site folder, replacing the old file, then upload the site again.');
    });
  });

  // ── GitHub publishing ──────────────────────────────────────
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
  }
  function readSettingsForm() {
    return {
      owner: $('gh-owner').value.trim(), repo: $('gh-repo').value.trim(),
      branch: $('gh-branch').value.trim() || 'main', token: $('gh-token').value.trim()
    };
  }
  (function fillSettings() {
    var s = getSettings();
    $('gh-owner').value = s.owner || ''; $('gh-repo').value = s.repo || '';
    $('gh-branch').value = s.branch || ''; $('gh-token').value = s.token || '';
    if (!s.token) $('settings').open = true;
  })();

  $('btn-save-settings').addEventListener('click', function () {
    var s = readSettingsForm();
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); settingsMsg('Settings saved in this browser.', true); }
    catch (e) { settingsMsg('This browser blocked saving settings. They’ll work until you close this tab.', false); }
  });
  $('btn-clear-settings').addEventListener('click', function () {
    try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {}
    ['gh-owner', 'gh-repo', 'gh-branch', 'gh-token'].forEach(function (id) { $(id).value = ''; });
    settingsMsg('Settings removed from this browser.', true);
  });

  function gh(s, method, path, body) {
    var url = 'https://api.github.com/repos/' + encodeURIComponent(s.owner) + '/' + encodeURIComponent(s.repo) + path;
    return fetch(url, {
      method: method,
      headers: { Authorization: 'Bearer ' + s.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok, body: j }; });
    });
  }

  function ghError(res) {
    if (res.status === 401) return 'GitHub didn’t accept the access token. Check it hasn’t expired, then paste it again.';
    if (res.status === 403) return 'The access token can’t write to this repository. Give it “Contents: Read and write” access.';
    if (res.status === 404) return 'GitHub couldn’t find that repository or branch. Check the username, repository name and branch.';
    if (res.status === 409) return 'The repository changed while publishing. Publish again.';
    return 'GitHub returned an error' + (res.body && res.body.message ? ': ' + res.body.message : '.');
  }

  function contentPath(p) { return '/contents/' + p.split('/').map(encodeURIComponent).join('/'); }

  function putFile(s, path, base64, message) {
    return gh(s, 'GET', contentPath(path) + '?ref=' + encodeURIComponent(s.branch)).then(function (cur) {
      if (!cur.ok && cur.status !== 404) throw cur;
      var body = { message: message, content: base64, branch: s.branch };
      if (cur.ok && cur.body.sha) body.sha = cur.body.sha;
      return gh(s, 'PUT', contentPath(path), body).then(function (res) { if (!res.ok) throw res; return res; });
    });
  }

  function ready(s) {
    if (!s.owner || !s.repo || !s.token) {
      $('settings').open = true;
      settingsMsg('Fill in your GitHub username, repository name and access token first.', false);
      $('gh-owner').focus();
      return false;
    }
    return true;
  }

  $('btn-test').addEventListener('click', function () {
    var s = readSettingsForm(); if (!ready(s)) return;
    settingsMsg('Checking…');
    gh(s, 'GET', '/branches/' + encodeURIComponent(s.branch)).then(function (res) {
      if (res.ok) settingsMsg('Connected to ' + s.owner + '/' + s.repo + ' on the ' + s.branch + ' branch.', true);
      else settingsMsg(ghError(res), false);
    }).catch(function () { settingsMsg('Couldn’t reach GitHub. Check your internet connection.', false); });
  });

  $('btn-load-gh').addEventListener('click', function () {
    var s = readSettingsForm(); if (!ready(s)) return;
    if (dirty && !confirm('Replace your unsaved changes with the version on GitHub?')) return;
    settingsMsg('Loading…');
    gh(s, 'GET', contentPath(DATA_PATH) + '?ref=' + encodeURIComponent(s.branch)).then(function (res) {
      if (!res.ok) throw res;
      var bin = atob(res.body.content.replace(/\n/g, ''));
      var text = new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
      var start = text.indexOf('['), end = text.lastIndexOf(']');
      projects = JSON.parse(text.slice(start, end + 1));
      pending = {};
      currentIdx = projects.length ? 0 : -1;
      setDirty(false); renderAll();
      settingsMsg('Loaded ' + projects.length + ' project' + (projects.length === 1 ? '' : 's') + ' from GitHub.', true);
    }).catch(function (res) {
      settingsMsg(res && res.status ? ghError(res) : 'Couldn’t read the projects file from GitHub.', false);
    });
  });

  $('btn-publish').addEventListener('click', function () {
    var problem = validate(); if (problem) { log(problem); return; }
    var s = getSettings();
    var formS = readSettingsForm();
    if (formS.token) s = formS;
    if (!ready(s)) return;

    var btn = $('btn-publish');
    btn.disabled = true; btn.textContent = 'Publishing…';
    var paths = usedPaths();
    var step = 0;

    // Upload images one at a time, then the data file
    paths.reduce(function (chain, path) {
      return chain.then(function () {
        log('Uploading image ' + (++step) + ' of ' + paths.length + '…');
        return putFile(s, path, pending[path].base64, 'Add image ' + path.split('/').pop());
      });
    }, Promise.resolve()).then(function () {
      log('Saving projects…');
      return putFile(s, DATA_PATH, toBase64(dataFile()), 'Update projects from admin');
    }).then(function () {
      pending = {};
      setDirty(false);
      log('Published. Your site will show the changes once your host finishes updating, usually within a minute or two.');
    }).catch(function (res) {
      log(res && res.status ? ghError(res) : 'Publishing stopped: couldn’t reach GitHub. Check your connection and try again. Nothing you edited here was lost.');
    }).then(function () {
      btn.disabled = false; btn.textContent = 'Publish to site';
    });
  });

  $('btn-new').addEventListener('click', newProject);

  setDirty(false);
  renderAll();
})();
