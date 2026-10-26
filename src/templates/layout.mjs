// Page shell: <head> with SEO metadata, sticky header with navigation and language switcher, footer.
import { esc, t, href, asset, icon, HTML_LANG, LANGS } from './helpers.mjs';

const NAV = [
  ['research', 'research/'],
  ['publications', 'achievements/'],
  ['projects', 'projects/'],
  ['awards', 'awards/'],
  ['members', 'members/'],
  ['news', 'news/'],
  ['contact', 'contact/'],
];

function absUrl(ctx, lang, path) {
  return `${ctx.siteUrl}${ctx.basePath}${lang}/${path}`;
}

function head(ctx, page) {
  const { lang, site } = ctx;
  const ui = site.ui;
  const title = page.title ? `${page.title} · ${site.shortName}` : `${site.shortName} · ${t(site.name, lang)}`;
  const desc = page.description || t(site.description, lang);
  const canonical = absUrl(ctx, lang, ctx.path);
  const ogImage = `${ctx.siteUrl}${ctx.basePath}assets/img/icon-512.png`;
  const alternates = page.noAlternates
    ? ''
    : LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${esc(absUrl(ctx, l, ctx.path))}">`).join('\n') +
      `\n<link rel="alternate" hreflang="x-default" href="${esc(absUrl(ctx, 'en', ctx.path))}">`;
  const jsonld = (page.jsonld || [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${page.noindex ? '<meta name="robots" content="noindex">' : ''}
${page.refresh ? `<meta http-equiv="refresh" content="0; url=${esc(page.refresh)}">` : ''}
<link rel="canonical" href="${esc(page.canonical || canonical)}">
${alternates}
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.shortName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:locale" content="${lang === 'zh' ? 'zh_CN' : 'en_US'}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/png" sizes="32x32" href="${asset(ctx, 'img/favicon-32.png')}">
<link rel="apple-touch-icon" href="${asset(ctx, 'img/apple-touch-icon.png')}">
<link rel="preload" href="${asset(ctx, 'fonts/source-serif-4-var.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${asset(ctx, 'fonts/inter-var.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset(ctx, ctx.assets.css)}">
<script type="module" src="${asset(ctx, ctx.assets.js)}"></script>
${jsonld}
</head>`;
}

function langSwitch(ctx) {
  const ui = ctx.site.ui;
  const link = (l, label) =>
    l === ctx.lang
      ? `<span class="lang-switch__item is-current" aria-current="true" lang="${HTML_LANG[l]}">${label}</span>`
      : `<a class="lang-switch__item" href="${href(ctx, ctx.path, l)}" hreflang="${HTML_LANG[l]}" lang="${HTML_LANG[l]}" data-lang-switch="${l}" title="${esc(t(ui.switchTo, ctx.lang))}">${label}</a>`;
  return `<div class="lang-switch" role="group" aria-label="${esc(t(ui.langLabel, ctx.lang))}">${link('en', 'EN')}<span class="lang-switch__sep" aria-hidden="true">|</span>${link('zh', '中文')}</div>`;
}

function header(ctx, page) {
  const { lang, site } = ctx;
  const ui = site.ui;
  const items = NAV.map(([key, path]) => {
    const active = page.active === key;
    return `<li><a class="nav__link${active ? ' is-active' : ''}" href="${href(ctx, path)}"${active ? ' aria-current="page"' : ''}>${esc(t(ui.nav[key], lang))}</a></li>`;
  }).join('');
  return `<header class="site-header" data-header>
  <div class="container site-header__inner">
    <a class="brand" href="${href(ctx, '')}" aria-label="${esc(site.shortName)} — ${esc(t(ui.nav.home, lang))}">
      <picture><source srcset="${asset(ctx, 'img/logo.webp')}" type="image/webp"><img class="brand__logo" src="${asset(ctx, 'img/logo.png')}" alt="" width="40" height="35"></picture>
      <span class="brand__text"><span class="brand__name">${esc(site.shortName)}</span><span class="brand__sub">${esc(t(site.university, lang))}</span></span>
    </a>
    <nav class="nav" id="site-nav" aria-label="${esc(t(ui.mainNav, lang))}" data-nav>
      <ul class="nav__list">${items}</ul>
      ${langSwitch(ctx)}
    </nav>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle data-label-open="${esc(t(ui.menu, lang))}" data-label-close="${esc(t(ui.closeMenu, lang))}">
      <span class="nav-toggle__open">${icon('menu')}</span><span class="nav-toggle__close">${icon('close')}</span>
      <span class="visually-hidden" data-nav-toggle-label>${esc(t(ui.menu, lang))}</span>
    </button>
  </div>
</header>`;
}

function footer(ctx) {
  const { lang, site } = ctx;
  const ui = site.ui;
  const links = NAV.map(([key, path]) => `<li><a href="${href(ctx, path)}">${esc(t(ui.nav[key], lang))}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container site-footer__grid">
    <div class="site-footer__brand">
      <p class="site-footer__name">${esc(site.shortName)}</p>
      <p class="site-footer__full">${esc(t(site.name, lang))}</p>
      <p class="site-footer__inst">${esc(t(site.institution, lang))}</p>
    </div>
    <div>
      <h2 class="site-footer__heading">${esc(t(ui.footer.explore, lang))}</h2>
      <ul class="site-footer__links">${links}</ul>
    </div>
    <div>
      <h2 class="site-footer__heading">${esc(t(ui.footer.contact, lang))}</h2>
      <p class="site-footer__contact">${icon('pin')}<span>${esc(t(site.contact.address, lang))}</span></p>
      <p class="site-footer__contact">${icon('mail')}<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p>
    </div>
  </div>
  <div class="container site-footer__bottom">
    <p>© ${ctx.year} ${esc(site.shortName)}. ${esc(t(ui.footer.rights, lang))}</p>
    <a class="site-footer__top" href="#top">${esc(t(ui.footer.backToTop, lang))} ${icon('up')}</a>
  </div>
</footer>`;
}

export function layout(ctx, page, body) {
  const ui = ctx.site.ui;
  return `<!doctype html>
<html lang="${HTML_LANG[ctx.lang]}" data-lang="${ctx.lang}">
${head(ctx, page)}
<body id="top"${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<a class="skip-link" href="#main">${esc(t(ui.skip, ctx.lang))}</a>
${header(ctx, page)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(ctx)}
</body>
</html>
`;
}

export function breadcrumb(ctx, trail) {
  const ui = ctx.site.ui;
  const items = [[t(ui.nav.home, ctx.lang), href(ctx, '')], ...trail];
  return `<nav class="breadcrumb" aria-label="${esc(t(ui.breadcrumb, ctx.lang))}"><ol>${items
    .map(([label, url], i) =>
      i === items.length - 1 && !url
        ? `<li><span aria-current="page">${esc(label)}</span></li>`
        : `<li><a href="${url}">${esc(label)}</a></li>`,
    )
    .join('')}</ol></nav>`;
}

export function pageHero(ctx, { eyebrow, title, lead, crumbs = [], extra = '' }) {
  return `<section class="page-hero">
  <div class="page-hero__art" aria-hidden="true"></div>
  <div class="container">
    ${breadcrumb(ctx, crumbs)}
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1 class="page-hero__title">${esc(title)}</h1>
    ${lead ? `<p class="page-hero__lead">${esc(lead)}</p>` : ''}
    ${extra}
  </div>
</section>`;
}
