// Reusable UI components shared across pages.
import { esc, t, href, asset, icon, placeholder, fmt, formatDate, HTML_LANG } from './helpers.mjs';

const HAN = /[一-鿿]/;

export function sectionHeader({ eyebrow, title, lead, id, action }) {
  return `<div class="section-header">
  <div>
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h2 class="section-title"${id ? ` id="${id}"` : ''}>${esc(title)}</h2>
    ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ''}
  </div>
  ${action || ''}
</div>`;
}

export function textLink(url, label, iconName = 'arrow') {
  return `<a class="text-link" href="${url}">${esc(label)}${icon(iconName)}</a>`;
}

/** Primary name in the page language, plus the other script as a secondary line. */
export function names(member, lang) {
  const primary = lang === 'zh' ? member.name.zh : member.name.en;
  const secondary = lang === 'zh' ? member.name.en : member.name.zh;
  const secLang = lang === 'zh' ? 'en' : 'zh-CN';
  return { primary, secondary, secLang };
}

function initials(member) {
  return member.name.en
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function avatar(ctx, member, { size = 'md', eager = false } = {}) {
  const { primary } = names(member, ctx.lang);
  if (member.photo) {
    const { src, width, height } = member.photo;
    return `<picture class="avatar avatar--${size} avatar--photo">
  <source srcset="${asset(ctx, `img/${src}.webp`)}" type="image/webp">
  <img src="${asset(ctx, `img/${src}.jpg`)}" alt="${esc(primary)}" width="${width}" height="${height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
</picture>`;
  }
  return `<span class="avatar avatar--${size} avatar--mono" aria-hidden="true"><span>${esc(initials(member))}</span></span>`;
}

export function tagList(items, cls = '') {
  if (!items || !items.length) return '';
  return `<ul class="tags ${cls}">${items.map((x) => `<li class="tag">${esc(x)}</li>`).join('')}</ul>`;
}

export function memberCard(ctx, m, { compact = false } = {}) {
  const { lang, site } = ctx;
  const ui = site.ui;
  const n = names(m, lang);
  const interests = m.researchInterests[lang].length ? m.researchInterests[lang] : null;
  const search = [m.name.en, m.name.zh, ...m.researchInterests.en, ...m.researchInterests.zh].join(' ').toLowerCase();
  return `<li class="member-card${m.lead ? ' member-card--lead' : ''}" data-member data-role="${m.role}" data-cohort="${m.cohort || ''}" data-search="${esc(search)}">
  <a class="member-card__link" href="${href(ctx, `members/${m.slug}/`)}">
    ${avatar(ctx, m)}
    <span class="member-card__body">
      <span class="member-card__name">${esc(n.primary)}</span>
      <span class="member-card__alt" lang="${n.secLang}">${esc(n.secondary)}</span>
      <span class="member-card__pos">${esc(t(m.position, lang))}</span>
      ${!compact ? `<span class="member-card__interests">${interests ? esc(interests.join(' · ')) : placeholder(ui, lang)}</span>` : ''}
    </span>
  </a>
</li>`;
}

/** Render a person reference (member link if known). */
export function personRef(ctx, slug) {
  const m = ctx.data.memberMap[slug];
  if (!m) return esc(slug);
  return `<a href="${href(ctx, `members/${m.slug}/`)}">${esc(names(m, ctx.lang).primary)}</a>`;
}

export function peopleList(ctx, slugs) {
  return slugs.map((s) => personRef(ctx, s)).join(ctx.lang === 'zh' ? '、' : ', ');
}

function authorName(a, lang, chinesePub) {
  if (a.others) return lang === 'zh' ? '等' : 'et al.';
  if (lang === 'en') return a.en || a.zh;
  return chinesePub ? a.zh || a.en : a.en || a.zh;
}

export function authorsHtml(ctx, pub) {
  const chinesePub = HAN.test(pub.title);
  const sep = chinesePub && ctx.lang === 'zh' ? '，' : ', ';
  return pub.authors
    .map((a) => {
      const name = esc(authorName(a, ctx.lang, chinesePub));
      if (a.member && ctx.data.memberMap[a.member]) {
        const self = ctx.currentMember === a.member;
        return self ? `<strong class="author is-self">${name}</strong>` : `<a class="author is-member" href="${href(ctx, `members/${a.member}/`)}">${name}</a>`;
      }
      return `<span class="author">${name}</span>`;
    })
    .join(sep);
}

function venueHtml(ctx, pub) {
  const { lang } = ctx;
  const ui = ctx.site.ui.pubs;
  const parts = [];
  if (pub.type === 'patent') {
    parts.push(`${esc(t(ui.patentNo, lang))} ${esc(pub.patentNumber)}`);
    if (pub.date) parts.push(`${esc(t(ui.granted, lang))} ${esc(pub.date)}`);
    return parts.join(' · ');
  }
  let venue = pub.venue ? `<em>${esc(pub.venue)}</em>` : '';
  if (pub.venueTranslation && lang === 'en') venue += ` <span class="cite__trans">(${esc(pub.venueTranslation.en)})</span>`;
  if (pub.venueShort && pub.venue && !pub.venue.includes(pub.venueShort)) venue += ` <span class="cite__short">(${esc(pub.venueShort)})</span>`;
  if (venue) parts.push(venue);
  let vol = '';
  if (pub.volume) vol += esc(pub.volume);
  if (pub.issue) vol += `(${esc(pub.issue)})`;
  if (vol) parts.push(vol);
  if (pub.pages) parts.push(esc(pub.pages));
  if (pub.type === 'book' && pub.isbn) parts.push(`${esc(t(ui.isbn, lang))} ${esc(pub.isbn)}`);
  parts.push(String(pub.year));
  return parts.join(', ');
}

export function citation(ctx, pub, { headingLevel = 3, showBib = true, compact = false } = {}) {
  const { lang } = ctx;
  const ui = ctx.site.ui.pubs;
  const badges = [];
  badges.push(`<span class="badge badge--type badge--${pub.type}">${esc(t(ui.types[pub.type], lang))}</span>`);
  for (const ix of pub.indexes) {
    const label = t(ix, lang);
    const strong = /CCF-A|Q1|一区/.test(label);
    badges.push(`<span class="badge${strong ? ' badge--strong' : ''}">${esc(label)}</span>`);
  }
  if (pub.award) badges.push(`<span class="badge badge--award">${icon('award')}${esc(t(ui.awards[pub.award], lang))}</span>`);
  if (pub.isNew) badges.push(`<span class="badge badge--new">${esc(t(ui.new, lang))}</span>`);

  const actions = [];
  if (pub.doi) actions.push(`<a class="chip-link" href="https://doi.org/${esc(pub.doi)}" target="_blank" rel="noopener">${icon('external')}${esc(t(ui.doi, lang))}<span class="visually-hidden"> ${esc(pub.doi)}</span></a>`);
  if (pub.url) actions.push(`<a class="chip-link" href="${esc(pub.url)}" target="_blank" rel="noopener">${icon('doc')}${esc(t(ui.link, lang))}</a>`);
  if (pub.code) actions.push(`<a class="chip-link" href="${esc(pub.code)}" target="_blank" rel="noopener">${icon('code')}${esc(t(ui.code, lang))}</a>`);
  const bib = showBib && pub.bibtex
    ? `<details class="cite__bib">
  <summary class="chip-link">${icon('quote')}${esc(t(ui.cite, lang))}</summary>
  <div class="cite__bibbody"><pre><code>${esc(pub.bibtex)}</code></pre><button class="btn btn--ghost btn--sm" type="button" data-copy data-copied="${esc(t(ui.copied, lang))}">${icon('copy')}<span>${esc(t(ui.copy, lang))}</span></button></div>
</details>`
    : '';

  const trans = pub.titleTranslation && lang === 'en' && pub.titleTranslation.en
    ? `<span class="cite__titletrans">${esc(pub.titleTranslation.en)}</span>` : '';
  const titleLang = HAN.test(pub.title) ? ' lang="zh-CN"' : ' lang="en"';
  const search = [
    pub.title, pub.titleTranslation?.en, pub.venue, pub.venueShort, pub.venueTranslation?.en,
    ...pub.authors.flatMap((a) => [a.en, a.zh]), pub.year,
  ].filter(Boolean).join(' ').toLowerCase();
  const h = `h${headingLevel}`;
  return `<li class="cite${compact ? ' cite--compact' : ''}" id="${esc(pub.id)}" data-pub data-type="${pub.type}" data-year="${pub.year}" data-search="${esc(search)}">
  <div class="cite__year" aria-hidden="true">${pub.year}</div>
  <div class="cite__main">
    <${h} class="cite__title"${titleLang}>${esc(pub.title)}${trans}</${h}>
    <p class="cite__authors">${authorsHtml(ctx, pub)}</p>
    <p class="cite__venue">${venueHtml(ctx, pub)}</p>
    <div class="cite__meta"><div class="badges">${badges.join('')}</div>${actions.length || bib ? `<div class="cite__actions">${actions.join('')}${bib}</div>` : ''}</div>
  </div>
</li>`;
}

export function awardItem(ctx, a, { compact = false } = {}) {
  const { lang } = ctx;
  const ui = ctx.site.ui.awards;
  const level = t(ui.levels[a.level], lang);
  const prize = a.prize ? t(a.prize, lang) : t(ui.honour, lang);
  const otherTitle = lang === 'en' ? `<p class="award__orig" lang="zh-CN">${esc(a.title.zh)}</p>` : '';
  return `<li class="award${a.prize ? '' : ' award--honour'}" data-award data-level="${a.level}" data-year="${a.year}">
  <div class="award__icon" aria-hidden="true">${icon('award')}</div>
  <div class="award__body">
    <p class="award__meta"><span class="badge badge--level badge--${a.level}">${esc(level)}</span><span class="award__year">${a.year}</span></p>
    <h3 class="award__title">${esc(t(a.title, lang))}</h3>
    ${compact ? '' : otherTitle}
    <p class="award__prize">${esc(prize)}</p>
    <dl class="award__people">
      <div><dt>${esc(t(ui.winners, lang))}</dt><dd>${peopleList(ctx, a.winners)}</dd></div>
      ${a.advisors.length ? `<div><dt>${esc(t(ui.advisors, lang))}</dt><dd>${peopleList(ctx, a.advisors)}</dd></div>` : ''}
      ${!compact && a.number ? `<div><dt>${esc(t(ui.number, lang))}</dt><dd class="mono">${esc(a.number)}</dd></div>` : ''}
    </dl>
  </div>
</li>`;
}

export function projectCard(ctx, p, { headingLevel = 3 } = {}) {
  const { lang } = ctx;
  const ui = ctx.site.ui.projects;
  const period = p.start === p.end ? `${p.start}` : `${p.start}–${p.end}`;
  const other = lang === 'en' ? p.title.zh : p.title.en;
  const h = `h${headingLevel}`;
  const rows = [];
  if (p.pi) rows.push(`<div><dt>${esc(t(ui.pi, lang))}</dt><dd>${personRef(ctx, p.pi)}</dd></div>`);
  if (p.participants.length) rows.push(`<div><dt>${esc(t(ui.participants, lang))}</dt><dd>${peopleList(ctx, p.participants)}</dd></div>`);
  if (p.members.length) rows.push(`<div><dt>${esc(t(ui.members, lang))}</dt><dd>${peopleList(ctx, p.members)}</dd></div>`);
  return `<li class="project" id="${p.id}" data-project data-funding="${esc(p.funding.en)}">
  <div class="project__top">
    <span class="project__funding">${esc(t(p.funding, lang))}</span>
    <span class="project__period">${icon('calendar')}${period}</span>
  </div>
  <${h} class="project__title">${esc(t(p.title, lang))}</${h}>
  <p class="project__alt" lang="${lang === 'en' ? 'zh-CN' : 'en'}">${esc(other)}</p>
  <dl class="project__meta">
    <div><dt>${esc(t(ui.number, lang))}</dt><dd class="mono">${esc(p.number)}</dd></div>
    ${rows.join('')}
  </dl>
</li>`;
}

export function newsList(ctx, items, { limit } = {}) {
  const ui = ctx.site.ui.news;
  const list = limit ? items.slice(0, limit) : items;
  return `<ol class="timeline">${list
    .map((n) => `<li class="timeline__item">
  <time class="timeline__date" datetime="${n.date}">${esc(formatDate(n.date, ctx.lang))}</time>
  <p class="timeline__title"><a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(t(n.title, ctx.lang))}${icon('external')}<span class="visually-hidden"> (${esc(t(ui.external, ctx.lang))})</span></a></p>
</li>`)
    .join('')}</ol>`;
}

export function researchCard(ctx, r, count) {
  const { lang } = ctx;
  const ui = ctx.site.ui.research;
  return `<li class="research-card" data-reveal>
  <a class="research-card__link" href="${href(ctx, `research/${r.slug}/`)}">
    <span class="research-card__icon" aria-hidden="true">${icon(r.icon)}</span>
    <span class="research-card__title">${esc(t(r.title, lang))}</span>
    <span class="research-card__summary">${esc(t(r.summary, lang))}</span>
    <span class="research-card__foot"><span>${count} ${esc(t(ui.pubCount, lang))}</span>${icon('arrow')}</span>
  </a>
</li>`;
}

/** Deterministic abstract line art: multimodal inputs flowing through a layered network into a graph. */
export function heroArt() {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const layers = [
    [150, [120, 190, 260, 330, 400]],
    [270, [150, 215, 280, 345, 410].map((y) => y - 10)],
    [390, [175, 255, 335]],
  ];
  let edges = '';
  for (let i = 0; i < layers.length - 1; i++) {
    const [x1, ys1] = layers[i];
    const [x2, ys2] = layers[i + 1];
    for (const y1 of ys1) for (const y2 of ys2) {
      const mx = (x1 + x2) / 2;
      edges += `<path d="M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
    }
  }
  const nodes = layers
    .flatMap(([x, ys], li) => ys.map((y) => `<circle cx="${x}" cy="${y}" r="${li === 2 ? 7 : 5}"/>`))
    .join('');
  // graph constellation on the right
  const pts = [[470, 140], [520, 205], [478, 268], [540, 300], [496, 352], [548, 400], [460, 420], [530, 130]];
  let gEdges = '';
  const links = [[0, 1], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [0, 7], [7, 1], [2, 4]];
  for (const [a, b] of links) gEdges += `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`;
  const gNodes = pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 6 : 4}"/>`).join('');
  // inputs: text lines, image tile, waveform
  const flows = layers[0][1]
    .map((y, i) => `<path class="flow flow--${i}" d="M${60 + (i % 2) * 6} ${y}H${150}"/>`)
    .join('');
  let dots = '';
  for (let x = 20; x <= 580; x += 28) for (let y = 30; y <= 470; y += 28) if (rand() > 0.72) dots += `<circle cx="${x}" cy="${y}" r="1.1"/>`;
  return `<svg class="hero-art" viewBox="0 0 600 500" role="presentation" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="ha-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6fd6"/><stop offset="1" stop-color="#6aa6f0"/></linearGradient>
    <radialGradient id="ha-r" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#e3eefc"/><stop offset="1" stop-color="#e3eefc" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="320" cy="270" r="250" fill="url(#ha-r)"/>
  <g class="hero-art__dots" fill="#9fb8dc">${dots}</g>
  <g class="hero-art__inputs" fill="none" stroke="#7fa3d6" stroke-width="1.4" stroke-linecap="round">
    <rect x="28" y="104" width="34" height="34" rx="5"/><path d="M33 132l8-10 6 6 5-4 6 8"/><circle cx="52" cy="113" r="2.4"/>
    <path d="M30 186h30M30 194h22"/>
    <path d="M28 262c4-12 8 12 12 0s8 12 12 0 6-8 8-4"/>
    <path d="M30 326h30M30 334h18"/>
    <rect x="28" y="388" width="34" height="24" rx="4"/><path d="M36 404v-6M43 404v-10M50 404v-4M57 404v-8"/>
  </g>
  <g class="hero-art__flows" fill="none" stroke="url(#ha-g)" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 6">${flows}</g>
  <g class="hero-art__edges" fill="none" stroke="#2f6fd6" stroke-opacity="0.18" stroke-width="1">${edges}</g>
  <g class="hero-art__graph" stroke="#2f6fd6" stroke-opacity="0.35" stroke-width="1.1">${gEdges}<path fill="none" d="M397 255C430 255 440 205 470 140M397 255C430 255 440 300 478 268M397 335C430 335 450 380 460 420"/></g>
  <g class="hero-art__nodes" fill="#fff" stroke="#2f6fd6" stroke-width="1.6">${nodes}</g>
  <g class="hero-art__gnodes" fill="#2f6fd6">${gNodes}</g>
  <circle class="hero-art__pulse" cx="390" cy="255" r="14" fill="none" stroke="#2f6fd6" stroke-opacity="0.35"/>
</svg>`;
}

export { HTML_LANG, fmt };
