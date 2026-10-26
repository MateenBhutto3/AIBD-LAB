import { esc, t, href, icon } from '../helpers.mjs';
import { pageHero } from '../layout.mjs';
import { sectionHeader, citation, projectCard, researchCard, tagList } from '../components.mjs';

export function researchIndexPage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui.research;
  return `${pageHero(ctx, { title: t(ui.title, lang), lead: t(ui.lead, lang), crumbs: [[t(ui.title, lang)]] })}
<section class="section">
  <div class="container">
    <ol class="research-list">
    ${data.research
      .map(
        (r, i) => `<li class="research-row" data-reveal>
      <span class="research-row__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="research-row__icon" aria-hidden="true">${icon(r.icon)}</span>
      <div class="research-row__body">
        <h2 class="research-row__title"><a href="${href(ctx, `research/${r.slug}/`)}">${esc(t(r.title, lang))}</a></h2>
        <p>${esc(t(r.summary, lang))}</p>
        ${tagList(r.topics[lang])}
      </div>
      <a class="research-row__more" href="${href(ctx, `research/${r.slug}/`)}" aria-hidden="true" tabindex="-1">${icon('arrow')}</a>
    </li>`,
      )
      .join('')}
    </ol>
  </div>
</section>`;
}

export function researchDetailPage(ctx, r) {
  const { lang, site, data } = ctx;
  const ui = site.ui.research;
  const pubs = r.publications.map((id) => data.pubMap[id]);
  const projects = r.projects.map((id) => data.projectMap[id]);
  const members = data.researchMembers[r.slug];
  const others = data.research.filter((x) => x.slug !== r.slug);
  return `${pageHero(ctx, {
    eyebrow: t(ui.title, lang),
    title: t(r.title, lang),
    lead: t(r.summary, lang),
    crumbs: [[t(ui.title, lang), href(ctx, 'research/')], [t(r.title, lang)]],
  })}
<section class="section section--tight">
  <div class="container article-grid">
    <div class="prose">
      ${t(r.body, lang).map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    <aside class="article-aside">
      <h2 class="aside-title">${esc(t(ui.topics, lang))}</h2>
      ${tagList(r.topics[lang], 'tags--accent')}
      ${members.length ? `<h2 class="aside-title">${esc(t(ui.relatedMembers, lang))}</h2>
      <ul class="mini-people">${members.map((m) => `<li><a href="${href(ctx, `members/${m.slug}/`)}">${esc(lang === 'zh' ? m.name.zh : m.name.en)}</a></li>`).join('')}</ul>` : ''}
    </aside>
  </div>
</section>
<section class="section section--tint">
  <div class="container">
    ${sectionHeader({ title: `${t(ui.relatedPubs, lang)} (${pubs.length})` })}
    <ol class="cite-list">${pubs.map((p) => citation(ctx, p)).join('')}</ol>
  </div>
</section>
${projects.length ? `<section class="section">
  <div class="container">
    ${sectionHeader({ title: t(ui.relatedProjects, lang) })}
    <ul class="project-grid">${projects.map((p) => projectCard(ctx, p)).join('')}</ul>
  </div>
</section>` : ''}
<section class="section${projects.length ? ' section--tint' : ''}">
  <div class="container">
    ${sectionHeader({ title: t(ui.other, lang) })}
    <ul class="research-grid research-grid--small">${others.map((x) => researchCard(ctx, x, x.publications.length)).join('')}</ul>
  </div>
</section>`;
}
