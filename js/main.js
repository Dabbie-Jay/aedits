// AEDITS — shared helpers used on every public page
(function () {
  var CONFIG = window.AEDITS_CONFIG || {};

  window.AEDITS = {
    config: CONFIG,
    projects: Array.isArray(window.AEDITS_PROJECTS) ? window.AEDITS_PROJECTS : [],

    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    categoryLabel: function (id) {
      var cats = CONFIG.categories || [];
      for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i].label;
      return id ? id.charAt(0).toUpperCase() + id.slice(1) : '';
    },

    tileClass: function (id) {
      return ['branding', 'social', 'print', 'packaging'].indexOf(id) > -1 ? id : 'other';
    }
  };

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) menuBtn.click();
    });
  }

  // Fill email and social links from config
  document.querySelectorAll('[data-config-email]').forEach(function (a) {
    if (!CONFIG.email) { a.hidden = true; return; }
    a.href = 'mailto:' + CONFIG.email;
    a.textContent = CONFIG.email;
  });
  ['instagram', 'behance', 'whatsapp'].forEach(function (key) {
    document.querySelectorAll('[data-config-link="' + key + '"]').forEach(function (a) {
      if (CONFIG[key]) a.href = CONFIG[key]; else a.hidden = true;
    });
  });

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
