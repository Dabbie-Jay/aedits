// ─────────────────────────────────────────────────────────────
// AEDITS site settings. Edit the values below, then save.
// ─────────────────────────────────────────────────────────────
window.AEDITS_CONFIG = {
  // Where enquiries should go (also used for the email link on the page)
  email: 'aeditsportfolio@gmail.com',

  // Free access key from https://web3forms.com (enter your email there, they send you a key).
  // Leave empty and the form will open the visitor's email app instead.
  web3formsKey: 'cbc56e0a-28b2-4906-ab4c-3a9070b1dc30',

  // Social links. Leave any of them empty to hide that link.
  instagram: '',   // e.g. 'https://instagram.com/aedits'
  behance: '',     // e.g. 'https://behance.net/aedits'
  whatsapp: '',    // e.g. 'https://wa.me/2348000000000'

  // Project categories: id is used in data/projects.js, label is what visitors see.
  categories: [
    { id: 'branding', label: 'Branding' },
    { id: 'social', label: 'Social' },
    { id: 'print', label: 'Print' },
    { id: 'packaging', label: 'Packaging' }
  ]
};
