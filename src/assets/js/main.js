// AIBD Lab — progressive enhancement. Every page works without this script.
const LANG_KEY = 'aibd-lang';
const root = document.documentElement;
root.classList.add('js');

/* ---------- language preference ---------- */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-lang-switch]');
  if (!link) return;
  try { localStorage.setItem(LANG_KEY, link.dataset.langSwitch); } catch { /* storage unavailable */ }
  // Keep the in-page anchor (e.g. a publication) when switching language.
  if (location.hash) link.href = link.href.split('#')[0] + location.hash;
});

/* ---------- mobile navigation ---------- */
const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (toggle && nav) {
  const label = toggle.querySelector('[data-nav-toggle-label]');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('nav-open', open);
    label.textContent = open ? toggle.dataset.labelClose : toggle.dataset.labelOpen;
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- header shadow on scroll ---------- */
const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- reveal on scroll (CSS disables motion for prefers-reduced-motion) ---------- */
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- copy BibTeX ---------- */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const code = btn.parentElement.querySelector('code');
  const span = btn.querySelector('span');
  const original = span.textContent;
  try {
    await navigator.clipboard.writeText(code.textContent);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
  }
  span.textContent = btn.dataset.copied;
  setTimeout(() => { span.textContent = original; }, 1600);
});

/* ---------- search & filters (publications, members, awards) ---------- */
const FILTERS = {
  pubs: { item: '[data-pub]', test: (el, f) => (!f.type || el.dataset.type === f.type) && (!f.year || el.dataset.year === f.year) },
  members: { item: '[data-member]', test: (el, f) => (!f.role || el.dataset.role === f.role) && (!f.cohort || el.dataset.cohort === f.cohort) },
  awards: { item: '[data-award]', test: (el, f) => !f.level || el.dataset.level === f.level },
};

const normalize = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

document.querySelectorAll('[data-filter]').forEach((form) => {
  const cfg = FILTERS[form.dataset.filter];
  if (!cfg) return;
  const scope = form.parentElement;
  const items = [...scope.querySelectorAll(cfg.item)];
  const groups = [...scope.querySelectorAll('[data-group]')].reverse(); // innermost first
  const count = form.querySelector('[data-count]');
  const empty = scope.querySelector('[data-empty]');

  const read = () => Object.fromEntries(new FormData(form).entries());

  const apply = ({ updateUrl = true } = {}) => {
    const f = read();
    const terms = normalize(f.q || '').split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const el of items) {
      const hay = el.dataset.search ? normalize(el.dataset.search) : '';
      const ok = cfg.test(el, f) && terms.every((term) => hay.includes(term));
      el.hidden = !ok;
      if (ok) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector(`${cfg.item}:not([hidden])`);
    if (count) count.textContent = shown;
    if (empty) empty.hidden = shown > 0;
    if (updateUrl) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(f)) if (v) params.set(k, v);
      const qs = params.toString();
      history.replaceState(null, '', qs ? `?${qs}${location.hash}` : location.pathname + location.hash);
    }
  };

  // Restore state from the URL (?q=&type=&year=…), so filtered views can be shared.
  const params = new URLSearchParams(location.search);
  for (const [k, v] of params) {
    const field = form.elements[k];
    if (!field) continue;
    if (field instanceof RadioNodeList) {
      for (const r of field) r.checked = r.value === v;
    } else field.value = v;
  }

  let timer;
  form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 120); });
  form.addEventListener('change', () => apply());
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
  form.addEventListener('reset', () => setTimeout(() => apply(), 0));
  if ([...params].length) apply({ updateUrl: false });
});
