import { esc, t, href, icon, fmt } from '../helpers.mjs';
import { pageHero } from '../layout.mjs';
import { citation, memberCard } from '../components.mjs';

function chips(name, options, current = '') {
  return options
    .map(
      ([value, label, count]) => `<label class="chip"><input type="radio" name="${name}" value="${esc(value)}"${value === current ? ' checked' : ''}><span>${esc(label)}${count != null ? ` <span class="chip__count">${count}</span>` : ''}</span></label>`,
    )
    .join('');
}

function searchField(id, label, placeholderText) {
  return `<div class="field field--search">
  <label class="visually-hidden" for="${id}">${esc(label)}</label>
  ${icon('search')}
  <input id="${id}" name="q" type="search" placeholder="${esc(placeholderText)}" autocomplete="off" spellcheck="false">
</div>`;
}

export function publicationsPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.pubs;
  const pubs = data.publications;
  const years = [...new Set(pubs.map((p) => p.year))].sort((a, b) => b - a);
  const typeOrder = ['journal', 'conference', 'book', 'patent'];
  const typeOpts = [['', t(ui.all, lang), pubs.length], ...typeOrder.map((k) => [k, t(ui.typesPlural[k], lang), pubs.filter((p) => p.type === k).length])];

  const groups = years
    .map((y) => `<section class="year-group" data-group aria-labelledby="y-${y}">
    <h2 class="year-group__title" id="y-${y}">${y}</h2>
    <ol class="cite-list">${pubs.filter((p) => p.year === y).map((p) => citation(ctx, p)).join('')}</ol>
  </section>`)
    .join('');

  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container">
    <form class="filter-bar" role="search" data-filter="pubs" aria-label="${esc(t(ui.searchLabel, lang))}">
      ${searchField('pub-q', t(ui.searchLabel, lang), t(ui.search, lang))}
      <fieldset class="filter-bar__group"><legend class="visually-hidden">${esc(t(ui.type, lang))}</legend>${chips('type', typeOpts)}</fieldset>
      <div class="field field--select">
        <label class="visually-hidden" for="pub-year">${esc(t(ui.year, lang))}</label>
        <select id="pub-year" name="year"><option value="">${esc(t(ui.allYears, lang))}</option>${years.map((y) => `<option value="${y}">${y}</option>`).join('')}</select>
      </div>
      <p class="filter-bar__status" aria-live="polite"><span data-count>${pubs.length}</span> ${esc(t(ui.results, lang))}</p>
      <button class="btn btn--ghost btn--sm" type="reset" data-reset>${esc(t(ui.reset, lang))}</button>
    </form>
    <div class="filter-results" data-results>${groups}</div>
    <p class="empty-state" data-empty hidden>${esc(t(ui.noResults, lang))}</p>
  </div>
</section>`;
}

export function publicationsAliasPage(ctx) {
  const ui = ctx.site.ui.pubs;
  const target = href(ctx, 'achievements/');
  return `<section class="section"><div class="container narrow">
  <p>${esc(t(ui.alias, ctx.lang))}</p>
  <p><a class="btn btn--primary" href="${target}">${esc(t(ui.title, ctx.lang))}${icon('arrow')}</a></p>
</div></section>`;
}

export function membersPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.members;
  const faculty = data.members.filter((m) => m.role === 'faculty');
  const students = data.members.filter((m) => m.role === 'master');
  const cohorts = [...new Set(students.map((m) => m.cohort))].sort();
  const roleOpts = [['', t(ui.all, lang), data.members.length], ['faculty', t(ui.faculty, lang), faculty.length], ['master', t(ui.master, lang), students.length]];
  const cohortLabel = (y) => fmt(t(ui.cohortLabel, lang), { y });

  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section section--tight">
  <div class="container">
    <form class="filter-bar" role="search" data-filter="members" aria-label="${esc(t(ui.searchLabel, lang))}">
      ${searchField('member-q', t(ui.searchLabel, lang), t(ui.search, lang))}
      <fieldset class="filter-bar__group"><legend class="visually-hidden">${esc(t(ui.role, lang))}</legend>${chips('role', roleOpts)}</fieldset>
      <div class="field field--select">
        <label class="visually-hidden" for="member-cohort">${esc(t(ui.cohort, lang))}</label>
        <select id="member-cohort" name="cohort"><option value="">${esc(t(ui.allCohorts, lang))}</option>${cohorts.map((y) => `<option value="${y}">${esc(cohortLabel(y))}</option>`).join('')}</select>
      </div>
      <p class="filter-bar__status" aria-live="polite"><span data-count>${data.members.length}</span> ${esc(t(ui.shown, lang))}</p>
      <button class="btn btn--ghost btn--sm" type="reset" data-reset>${esc(t(site.ui.pubs.reset, lang))}</button>
    </form>
    <div class="filter-results" data-results>
      <section class="member-group" data-group id="faculty" aria-labelledby="g-faculty">
        <h2 class="member-group__title" id="g-faculty">${esc(t(ui.faculty, lang))}</h2>
        <ul class="member-grid member-grid--faculty">${faculty.map((m) => memberCard(ctx, m)).join('')}</ul>
      </section>
      <section class="member-group" data-group id="master" aria-labelledby="g-master">
        <h2 class="member-group__title" id="g-master">${esc(t(ui.master, lang))}</h2>
        ${cohorts
          .map((y) => `<div class="cohort" data-group>
          <h3 class="cohort__title">${esc(cohortLabel(y))}</h3>
          <ul class="member-grid">${students.filter((m) => m.cohort === y).map((m) => memberCard(ctx, m)).join('')}</ul>
        </div>`)
          .join('')}
      </section>
    </div>
    <p class="empty-state" data-empty hidden>${esc(t(ui.noResults, lang))}</p>
  </div>
</section>`;
}
