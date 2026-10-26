import { esc, t, href, icon, fmt } from '../helpers.mjs';
import { sectionHeader, textLink, avatar, names, citation, awardItem, memberCard, newsList, researchCard, heroArt, tagList } from '../components.mjs';

export function homePage(ctx) {
  const { lang, site, data } = ctx;
  const ui = site.ui;
  const h = ui.home;
  const lead = data.members.find((m) => m.lead);
  const leadNames = names(lead, lang);
  const faculty = data.members.filter((m) => m.role === 'faculty');
  const students = data.members.filter((m) => m.role === 'master');
  const cohorts = new Set(students.map((m) => m.cohort)).size;
  const featuredPubs = data.publications.filter((p) => p.featured).slice(0, 6);
  const featuredAwards = data.awards.filter((a) => a.featured).slice(0, 6);
  const bioParas = lead.bio ? t(lead.bio, lang) : '';
  const bioShort = lang === 'zh' ? bioParas.split('。').slice(0, 3).join('。') + '。' : bioParas.split('. ').slice(0, 2).join('. ') + '.';

  const stats = [
    [data.publications.length, h.stats.publications, 'achievements/'],
    [data.projects.length, h.stats.projects, 'projects/'],
    [data.awards.length, h.stats.awards, 'awards/'],
    [data.members.length, h.stats.members, 'members/'],
  ];

  return `
<section class="hero">
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">${esc(t(h.eyebrow, lang))}</p>
      <h1 class="hero__title"><span class="hero__short">${esc(site.shortName)}</span>${esc(t(site.name, lang))}</h1>
      <p class="hero__lead">${esc(t(site.mission, lang))}</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="${href(ctx, 'research/')}">${esc(t(h.ctaResearch, lang))}${icon('arrow')}</a>
        <a class="btn btn--ghost" href="${href(ctx, 'achievements/')}">${esc(t(h.ctaPubs, lang))}</a>
      </div>
    </div>
    <div class="hero__visual">${heroArt()}</div>
  </div>
  <div class="container">
    <ul class="stats" aria-label="${esc(site.shortName)}">
      ${stats.map(([n, label, path]) => `<li class="stat"><a href="${href(ctx, path)}"><span class="stat__num">${n}</span><span class="stat__label">${esc(t(label, lang))}</span></a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section section--lead" aria-labelledby="lead-title">
  <div class="container">
    <article class="lead-profile" data-reveal>
      <div class="lead-profile__photo">
        ${avatar(ctx, lead, { size: 'xl' })}
        <span class="lead-profile__ring" aria-hidden="true"></span>
      </div>
      <div class="lead-profile__body">
        <p class="eyebrow">${esc(t(h.leadEyebrow, lang))}</p>
        <h2 class="lead-profile__name" id="lead-title">${esc(leadNames.primary)} <span class="lead-profile__alt" lang="${leadNames.secLang}">${esc(leadNames.secondary)}</span></h2>
        <ul class="lead-profile__titles">${lead.titles[lang].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="lead-profile__bio">${esc(bioShort)}</p>
        ${tagList(lead.researchInterests[lang], 'tags--accent')}
        <div class="lead-profile__actions">
          <a class="btn btn--primary" href="${href(ctx, `members/${lead.slug}/`)}">${esc(t(ui.fullProfile, lang))}${icon('arrow')}</a>
          <a class="btn btn--ghost" href="mailto:${esc(lead.email)}">${icon('mail')}${esc(lead.email)}</a>
          ${lead.orcid ? `<a class="btn btn--ghost" href="https://orcid.org/${esc(lead.orcid)}" target="_blank" rel="noopener">${icon('orcid')}ORCID</a>` : ''}
        </div>
      </div>
    </article>
  </div>
</section>

<section class="section" aria-labelledby="research-title">
  <div class="container">
    ${sectionHeader({ title: t(h.researchTitle, lang), lead: t(h.researchLead, lang), id: 'research-title', action: textLink(href(ctx, 'research/'), t(ui.viewAll, lang)) })}
    <ul class="research-grid">${data.research.map((r) => researchCard(ctx, r, r.publications.length)).join('')}</ul>
  </div>
</section>

<section class="section section--tint" aria-labelledby="pubs-title">
  <div class="container">
    ${sectionHeader({ title: t(h.pubsTitle, lang), lead: t(h.pubsLead, lang), id: 'pubs-title', action: textLink(href(ctx, 'achievements/'), t(ui.viewAll, lang)) })}
    <ol class="cite-list cite-list--featured" data-reveal>${featuredPubs.map((p) => citation(ctx, p, { showBib: false, compact: true })).join('')}</ol>
  </div>
</section>

<section class="section" aria-labelledby="news-title">
  <div class="container split">
    <div class="split__aside">
      ${sectionHeader({ title: t(h.newsTitle, lang), id: 'news-title' })}
      ${textLink(href(ctx, 'news/'), t(ui.viewAll, lang))}
    </div>
    <div class="split__main" data-reveal>${newsList(ctx, data.news, { limit: 6 })}</div>
  </div>
</section>

<section class="section section--tint" aria-labelledby="awards-title">
  <div class="container">
    ${sectionHeader({ title: t(h.awardsTitle, lang), lead: t(h.awardsLead, lang), id: 'awards-title', action: textLink(href(ctx, 'awards/'), t(ui.viewAll, lang)) })}
    <ul class="award-grid" data-reveal>${featuredAwards.map((a) => awardItem(ctx, a, { compact: true })).join('')}</ul>
  </div>
</section>

<section class="section" aria-labelledby="team-title">
  <div class="container">
    ${sectionHeader({ title: t(h.teamTitle, lang), lead: t(h.teamLead, lang), id: 'team-title', action: textLink(href(ctx, 'members/'), t(h.meetTeam, lang)) })}
    <ul class="member-grid member-grid--faculty" data-reveal>${faculty.map((m) => memberCard(ctx, m)).join('')}</ul>
    <a class="students-band" href="${href(ctx, 'members/#master')}" data-reveal>
      <span class="students-band__faces" aria-hidden="true">${students.slice(0, 6).map((m) => avatar(ctx, m, { size: 'sm' })).join('')}</span>
      <span class="students-band__text">${esc(fmt(t(h.studentsCount, lang), { n: students.length, c: cohorts }))}</span>
      ${icon('arrow')}
    </a>
  </div>
</section>

<section class="section section--cta" aria-labelledby="cta-title">
  <div class="container cta">
    <div>
      <h2 class="cta__title" id="cta-title">${esc(t(h.contactTitle, lang))}</h2>
      <p class="cta__lead">${esc(t(h.contactLead, lang))}</p>
    </div>
    <div class="cta__actions">
      <a class="btn btn--light" href="mailto:${esc(site.contact.email)}">${icon('mail')}${esc(site.contact.email)}</a>
      <a class="btn btn--outline-light" href="${href(ctx, 'contact/')}">${esc(t(ui.nav.contact, lang))}${icon('arrow')}</a>
    </div>
  </div>
</section>`;
}
