#!/usr/bin/env node
// Static site generator for AIBD Lab.
// Reads /data/*.json, renders /src/templates into /dist for both languages. No dependencies.
//
// Environment variables:
//   SITE_URL   Absolute origin used for canonical/hreflang/sitemap URLs (default: Netlify's $URL or a fallback).
//   BASE_PATH  Path the site is served from, e.g. "/" (Netlify, custom domain) or "/repo-name/" (GitHub Pages).
//              Only the 404 pages need it: every other page uses relative links and works at any base path.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { LANGS, HTML_LANG, t } from '../src/templates/helpers.mjs';
import { layout } from '../src/templates/layout.mjs';
import { homePage } from '../src/templates/pages/home.mjs';
import { researchIndexPage, researchDetailPage } from '../src/templates/pages/research.mjs';
import { publicationsPage, publicationsAliasPage, membersPage } from '../src/templates/pages/listing.mjs';
import { memberPage } from '../src/templates/pages/member.mjs';
import { projectsPage, awardsPage, newsPage, contactPage, notFoundBody } from '../src/templates/pages/misc.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const readJSON = (f) => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));

const normBase = (b) => `/${(b || '/').replace(/^\/+|\/+$/g, '')}/`.replace(/\/+/g, '/');
const BASE_PATH = normBase(process.env.BASE_PATH);
const SITE_URL = (process.env.SITE_URL || process.env.URL || 'https://research-lab-website-90e450.netlify.app').replace(/\/+$/, '');

// ---------- data ----------
const site = readJSON('site.json');
const members = readJSON('members.json').sort((a, b) => a.order - b.order);
const publications = readJSON('publications.json');
const projects = readJSON('projects.json').sort((a, b) => b.start - a.start || b.end - a.end);
const awards = readJSON('awards.json');
const research = readJSON('research.json');
const news = readJSON('news.json').sort((a, b) => b.date.localeCompare(a.date));

const memberMap = Object.fromEntries(members.map((m) => [m.slug, m]));
const pubMap = Object.fromEntries(publications.map((p) => [p.id, p]));
const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

// Validate references so broken content is caught at build time.
const problems = [];
for (const p of publications) for (const a of p.authors) if (a.member && !memberMap[a.member]) problems.push(`publication ${p.id}: unknown member ${a.member}`);
for (const p of projects) for (const s of [p.pi, ...p.participants, ...p.members].filter(Boolean)) if (!memberMap[s]) problems.push(`project ${p.id}: unknown member ${s}`);
for (const a of awards) for (const s of [...a.winners, ...a.advisors]) if (!memberMap[s]) problems.push(`award ${a.id}: unknown member ${s}`);
for (const r of research) {
  for (const id of r.publications) if (!pubMap[id]) problems.push(`research ${r.slug}: unknown publication ${id}`);
  for (const id of r.projects) if (!projectMap[id]) problems.push(`research ${r.slug}: unknown project ${id}`);
}
if (problems.length) {
  console.error('Content errors:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// Researchers per direction: lab members who authored the direction's publications, in directory order.
const researchMembers = Object.fromEntries(
  research.map((r) => {
    const slugs = new Set(r.publications.flatMap((id) => pubMap[id].authors.map((a) => a.member).filter(Boolean)));
    return [r.slug, members.filter((m) => slugs.has(m.slug))];
  }),
);

const data = { members, memberMap, publications, pubMap, projects, projectMap, awards, research, researchMembers, news };

// ---------- assets ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'src/assets'), join(DIST, 'assets'), { recursive: true });

function hashAsset(rel) {
  const file = join(DIST, 'assets', rel);
  const content = readFileSync(file);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 10);
  const out = rel.replace(/(\.\w+)$/, `.${hash}$1`);
  writeFileSync(join(DIST, 'assets', out), content);
  rmSync(file);
  return out;
}
const assets = { css: hashAsset('css/main.css'), js: hashAsset('js/main.js') };

// ---------- rendering ----------
const year = new Date().getFullYear();
const pages = []; // { lang, path } for sitemap

function makeCtx(lang, path, { absolute = false } = {}) {
  const depth = path.split('/').filter(Boolean).length + 1;
  const root = absolute ? BASE_PATH : '../'.repeat(depth);
  return { lang, path, root, site, data, assets, siteUrl: SITE_URL, basePath: BASE_PATH, year };
}

function write(rel, html) {
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function emit(lang, path, page, renderBody, { sitemap = true } = {}) {
  const ctx = makeCtx(lang, path);
  const body = renderBody(ctx);
  write(join(lang, path, 'index.html'), layout(ctx, typeof page === 'function' ? page(ctx) : page, body));
  if (sitemap) pages.push({ lang, path });
}

const abs = (lang, path) => `${SITE_URL}${BASE_PATH}${lang}/${path}`;

const orgLd = (lang) => ({
  '@context': 'https://schema.org',
  '@type': 'ResearchOrganization',
  name: t(site.name, lang),
  alternateName: site.shortName,
  url: abs(lang, ''),
  logo: `${SITE_URL}${BASE_PATH}assets/img/icon-512.png`,
  email: site.contact.email,
  description: t(site.description, lang),
  parentOrganization: { '@type': 'CollegeOrUniversity', name: t(site.university, lang) },
  member: members.filter((m) => m.role === 'faculty').map((m) => ({ '@type': 'Person', name: m.name[lang], url: abs(lang, `members/${m.slug}/`) })),
});

function personLd(m, lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: m.name[lang],
    alternateName: lang === 'zh' ? m.name.en : m.name.zh,
    jobTitle: t(m.position, lang),
    url: abs(lang, `members/${m.slug}/`),
    ...(m.email ? { email: `mailto:${m.email}` } : {}),
    ...(m.photo ? { image: `${SITE_URL}${BASE_PATH}assets/img/${m.photo.src}.jpg` } : {}),
    ...(m.orcid ? { sameAs: [`https://orcid.org/${m.orcid}`] } : {}),
    ...(m.researchInterests[lang].length ? { knowsAbout: m.researchInterests[lang] } : {}),
    affiliation: { '@type': 'CollegeOrUniversity', name: t(site.university, lang), department: { '@type': 'Organization', name: t(site.ui.members.department, lang) } },
    worksFor: { '@type': 'ResearchOrganization', name: site.shortName, url: abs(lang, '') },
  };
}

function scholarlyLd(p, lang) {
  return {
    '@type': 'ScholarlyArticle',
    headline: p.title.slice(0, 110),
    name: p.title,
    datePublished: String(p.year),
    author: p.authors.filter((a) => !a.others).map((a) => ({ '@type': 'Person', name: a.en || a.zh, ...(a.member ? { url: abs(lang, `members/${a.member}/`) } : {}) })),
    ...(p.venue ? { isPartOf: { '@type': p.type === 'journal' ? 'Periodical' : 'PublicationEvent', name: p.venue } } : {}),
    ...(p.doi ? { sameAs: `https://doi.org/${p.doi}` } : {}),
    url: `${abs(lang, 'achievements/')}#${p.id}`,
  };
}

for (const lang of LANGS) {
  const ui = site.ui;
  emit(lang, '', { active: 'home', description: t(site.description, lang), jsonld: [orgLd(lang)] }, homePage);

  emit(lang, 'research/', { active: 'research', title: t(ui.research.title, lang), description: t(ui.research.lead, lang) }, researchIndexPage);
  for (const r of research) {
    emit(lang, `research/${r.slug}/`, { active: 'research', title: t(r.title, lang), description: t(r.summary, lang) }, (ctx) => researchDetailPage(ctx, r));
  }

  emit(
    lang,
    'achievements/',
    {
      active: 'publications',
      title: t(ui.pubs.title, lang),
      description: t(ui.pubs.lead, lang),
      jsonld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: publications.filter((p) => p.type === 'journal' || p.type === 'conference').map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: scholarlyLd(p, lang) })) }],
    },
    publicationsPage,
  );
  // Friendly alias: /publications/ -> /achievements/ (the original site's URL).
  emit(lang, 'publications/', { active: 'publications', title: t(ui.pubs.title, lang), noindex: true, refresh: '../achievements/', canonical: abs(lang, 'achievements/') }, publicationsAliasPage, { sitemap: false });

  emit(lang, 'projects/', { active: 'projects', title: t(ui.projects.title, lang), description: t(ui.projects.lead, lang) }, projectsPage);
  emit(lang, 'awards/', { active: 'awards', title: t(ui.awards.title, lang), description: t(ui.awards.lead, lang) }, awardsPage);
  emit(lang, 'members/', { active: 'members', title: t(ui.members.title, lang), description: t(ui.members.lead, lang) }, membersPage);
  for (const m of members) {
    const name = m.name[lang];
    const interests = m.researchInterests[lang];
    const desc =
      lang === 'zh'
        ? `${name}（${m.name.en}），${t(m.position, 'zh')}，AIBD 实验室，沈阳工业大学软件学院。${interests.length ? '研究兴趣：' + interests.join('、') + '。' : ''}`
        : `${name} (${m.name.zh}), ${t(m.position, 'en')} at AIBD Lab, School of Software, Shenyang University of Technology.${interests.length ? ' Research interests: ' + interests.join(', ') + '.' : ''}`;
    emit(lang, `members/${m.slug}/`, { active: 'members', title: name, description: desc, ogType: 'profile', jsonld: [personLd(m, lang)] }, (ctx) => memberPage(ctx, m));
  }
  emit(lang, 'news/', { active: 'news', title: t(ui.news.title, lang), description: t(ui.news.lead, lang) }, newsPage);
  emit(lang, 'contact/', { active: 'contact', title: t(ui.contact.title, lang), description: t(ui.contact.lead, lang) }, contactPage);

  // Localized 404 (absolute links via BASE_PATH so it works at any URL depth).
  const nf = makeCtx(lang, '', { absolute: true });
  const nfOther = makeCtx(lang === 'en' ? 'zh' : 'en', '', { absolute: true });
  write(join(lang, '404.html'), layout(nf, { title: t(ui.notFound.title, lang), noindex: true, noAlternates: true }, notFoundBody(lang === 'en' ? nf : nfOther, lang === 'en' ? nfOther : nf)));
}

// Root 404 (GitHub Pages serves only this one; Netlify uses it as the fallback).
{
  const en = makeCtx('en', '', { absolute: true });
  const zh = makeCtx('zh', '', { absolute: true });
  write('404.html', layout(en, { title: '404 · Page not found / 页面未找到', noindex: true, noAlternates: true, bodyClass: 'is-404' }, notFoundBody(en, zh)));
}

// Root language redirect: saved preference -> browser language -> English. Works without JS via links.
write(
  'index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${site.shortName} · ${site.name.en} | ${site.name.zh}</title>
<meta name="description" content="${site.description.en}">
<link rel="canonical" href="${abs('en', '')}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${abs(l, '')}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${abs('en', '')}">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="stylesheet" href="assets/${assets.css}">
<script src="assets/js/lang-redirect.js"></script>
<noscript><meta http-equiv="refresh" content="0; url=en/"></noscript>
</head>
<body class="is-redirect">
<main class="redirect">
  <img src="assets/img/logo.png" alt="AIBD Lab" width="80" height="71">
  <h1>${site.shortName}</h1>
  <p><a class="btn btn--primary" href="en/" hreflang="en">English</a> <a class="btn btn--ghost" href="zh/" hreflang="zh-CN" lang="zh-CN">简体中文</a></p>
</main>
</body>
</html>
`,
);

// ---------- sitemap, robots, misc ----------
const lastmod = new Date().toISOString().slice(0, 10);
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
  .map(
    ({ lang, path }) => `  <url>
    <loc>${abs(lang, path)}</loc>
    <lastmod>${lastmod}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${abs(l, path)}"/>`).join('\n')}
  </url>`,
  )
  .join('\n')}
</urlset>
`,
);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}${BASE_PATH}sitemap.xml\n`);
write('.nojekyll', '');

// ---------- report ----------
function countFiles(dir) {
  return readdirSync(dir).reduce((n, f) => {
    const p = join(dir, f);
    return n + (statSync(p).isDirectory() ? countFiles(p) : 1);
  }, 0);
}
console.log(`Built ${pages.length} pages (${LANGS.length} languages) → dist/ (${countFiles(DIST)} files)`);
console.log(`  SITE_URL=${SITE_URL}  BASE_PATH=${BASE_PATH}`);
