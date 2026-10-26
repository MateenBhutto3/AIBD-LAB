import { esc, t, href, icon, placeholder } from '../helpers.mjs';
import { pageHero } from '../layout.mjs';
import { projectCard, awardItem, newsList, personRef, names } from '../components.mjs';

export function projectsPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.projects;
  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container">
    <ul class="project-grid">${data.projects.map((p) => projectCard(ctx, p, { headingLevel: 2 })).join('')}</ul>
  </div>
</section>`;
}

export function awardsPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.awards;
  const levels = ['national', 'northeast', 'provincial', 'city', 'school'].filter((l) => data.awards.some((a) => a.level === l));
  const years = [...new Set(data.awards.map((a) => a.year))].sort((a, b) => b - a);
  const chip = (value, label, count, checked) =>
    `<label class="chip"><input type="radio" name="level" value="${value}"${checked ? ' checked' : ''}><span>${esc(label)} <span class="chip__count">${count}</span></span></label>`;
  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container">
    <form class="filter-bar filter-bar--simple" data-filter="awards" aria-label="${esc(t(ui.title, lang))}">
      <fieldset class="filter-bar__group"><legend class="visually-hidden">${esc(t(ui.all, lang))}</legend>
        ${chip('', t(ui.all, lang), data.awards.length, true)}
        ${levels.map((l) => chip(l, t(ui.levels[l], lang), data.awards.filter((a) => a.level === l).length)).join('')}
      </fieldset>
      <p class="filter-bar__status" aria-live="polite"><span data-count>${data.awards.length}</span> ${esc(t(ui.count, lang))}</p>
    </form>
    <div class="filter-results" data-results>
      ${years
        .map((y) => `<section class="year-group" data-group aria-labelledby="ay-${y}">
        <h2 class="year-group__title" id="ay-${y}">${y}</h2>
        <ul class="award-grid">${data.awards.filter((a) => a.year === y).map((a) => awardItem(ctx, a)).join('')}</ul>
      </section>`)
        .join('')}
    </div>
  </div>
</section>`;
}

export function newsPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.news;
  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container narrow">${newsList(ctx, data.news)}</div>
</section>`;
}

export function contactPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.contact;
  const ph = placeholder(site.ui, lang);
  const c = site.contact;
  const faculty = data.members.filter((m) => m.role === 'faculty');
  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container contact-grid">
    <div class="contact-card">
      <h2 class="contact-card__title">${esc(t(ui.lab, lang))}</h2>
      <p class="contact-card__name">${esc(site.shortName)} · ${esc(t(site.name, lang))}</p>
      <dl class="contact-dl">
        <div><dt>${icon('pin')}${esc(t(ui.address, lang))}</dt><dd>${esc(t(c.address, lang))}</dd></div>
        <div><dt>${icon('building')}${esc(t(ui.street, lang))}</dt><dd>${c.streetAddress ? esc(t(c.streetAddress, lang)) : ph}</dd></div>
        <div><dt>${icon('mail')}${esc(t(site.ui.email, lang))}</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
        <div><dt>${icon('phone')}${esc(t(ui.phone, lang))}</dt><dd>${c.phone ? esc(c.phone) : ph}</dd></div>
      </dl>
    </div>
    <div class="contact-card">
      <h2 class="contact-card__title">${esc(t(ui.faculty, lang))}</h2>
      <ul class="contact-people">
        ${faculty
          .map((m) => `<li>
          <p class="contact-people__name">${personRef(ctx, m.slug)} <span lang="${names(m, lang).secLang}">${esc(names(m, lang).secondary)}</span></p>
          <p class="contact-people__pos">${esc(t(m.position, lang))}</p>
          <p>${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ph}</p>
        </li>`)
          .join('')}
      </ul>
      <h2 class="contact-card__title">${esc(t(ui.opensource, lang))}</h2>
      <ul class="link-list">${site.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${icon('code')}${esc(t(l.label, lang))}</a></li>`).join('')}</ul>
    </div>
  </div>
</section>`;
}

/** Bilingual 404 page; uses absolute BASE_PATH links because it can be served at any URL depth. */
export function notFoundBody(ctxEn, ctxZh) {
  const block = (ctx) => {
    const ui = ctx.site.ui.notFound;
    return `<div class="notfound__block" lang="${ctx.lang === 'zh' ? 'zh-CN' : 'en'}" data-nf="${ctx.lang}">
      <h1 class="notfound__title">${esc(t(ui.title, ctx.lang))}</h1>
      <p class="notfound__lead">${esc(t(ui.lead, ctx.lang))}</p>
      <p><a class="btn btn--primary" href="${href(ctx, '')}">${esc(t(ui.home, ctx.lang))}${icon('arrow')}</a></p>
    </div>`;
  };
  return `<section class="section notfound">
  <div class="container notfound__inner">
    <p class="notfound__code" aria-hidden="true">404</p>
    ${block(ctxEn)}
    ${block(ctxZh)}
  </div>
</section>`;
}

