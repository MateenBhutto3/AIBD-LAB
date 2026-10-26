// Shared helpers used by every template: escaping, i18n lookup, URL building, icons.

export const LANGS = ['en', 'zh'];
export const HTML_LANG = { en: 'en', zh: 'zh-CN' };

/** Escape text for HTML element content and attribute values. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Pick the string for the current language from a {en, zh} object. */
export function t(obj, lang) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? obj.en ?? '';
}

/** Simple "{key}" interpolation. */
export function fmt(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

/** Relative link to another page in the same language. `path` is like "members/" or "" for home. */
export function href(ctx, path = '', lang = ctx.lang) {
  return `${ctx.root}${lang}/${path}`;
}

/** Relative link to a file under /assets. */
export function asset(ctx, path) {
  return `${ctx.root}assets/${path}`;
}

export function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'zh') return `${y}年${m}月${d}日`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Placeholder marker for content the owner still has to provide. */
export function placeholder(ui, lang) {
  return `<span class="placeholder">${esc(t(ui.placeholder, lang))}</span>`;
}

export function attrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(' ');
}

// Small, hand-tuned 24px line icons (stroke = currentColor).
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  quote: '<path d="M7 8h4v4c0 2.5-1.5 4-4 4M14 8h4v4c0 2.5-1.5 4-4 4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  doc: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19c1.2-3.3 3.6-5 6.5-5s5.3 1.7 6.5 5M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c1.7.7 2.9 2.3 3.5 4.7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  orcid: '<circle cx="12" cy="12" r="9"/><path d="M9 10v6M9 7.5v.01M12 16v-6h2a3 3 0 0 1 0 6z"/>',
  phone: '<path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  building: '<path d="M4 21V6l8-3 8 3v15M4 21h16M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  // research icons
  multimodal: '<rect x="3" y="4" width="8" height="7" rx="1.5"/><path d="M3 15h8M3 18.5h5"/><path d="M14 7.5c2 0 2 9 4 9s2-9 3-9"/><circle cx="7" cy="7.5" r="1"/>',
  language: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  knowledge: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="13" r="2.4"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="m7.7 7.4 2.6 3.8M16.3 7.4l-2.6 3.8M10.2 14.6l-2.7 2.8M13.8 14.6l2.7 2.8M8.2 6h7.6"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
  timeseries: '<path d="M3 20h18M3 4v16"/><path d="m6 15 3.5-4 3 2.5 4-6 3 3.5"/>',
  graph: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="12" cy="12" r="1.6"/><path d="M6.6 10.6 10.5 6.5M13.5 6.5l3.9 4.1M17.4 13.4l-3.9 4.1M10.5 17.5l-3.9-4.1M7 12h3.4M13.6 12H17"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
