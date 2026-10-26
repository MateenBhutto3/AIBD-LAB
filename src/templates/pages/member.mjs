import { esc, t, href, icon, placeholder, fmt } from '../helpers.mjs';
import { breadcrumb } from '../layout.mjs';
import { avatar, names, citation, awardItem, projectCard, tagList, sectionHeader } from '../components.mjs';

export function memberPage(ctx, m) {
  const { lang, site, data } = ctx;
  const ui = site.ui.members;
  const n = names(m, lang);
  const pubs = data.publications.filter((p) => p.authors.some((a) => a.member === m.slug));
  const projects = data.projects.filter((p) => p.pi === m.slug || p.participants.includes(m.slug) || p.members.includes(m.slug));
  const awards = data.awards.filter((a) => a.winners.includes(m.slug) || a.advisors.includes(m.slug));
  const interests = m.researchInterests[lang];
  const position = t(m.position, lang) + (m.cohort ? ` · ${fmt(t(ui.cohortLabel, lang), { y: m.cohort })}` : '');
  const ph = placeholder(site.ui, lang);

  const listBlock = (title, items) =>
    items && items[lang]?.length
      ? `<section class="profile-block"><h2 class="profile-block__title">${esc(t(title, lang))}</h2><ul class="bullet-list">${items[lang].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`
      : '';

  const contactRows = [
    `<li>${icon('mail')}<span class="visually-hidden">${esc(t(site.ui.email, lang))}: </span>${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ph}</li>`,
  ];
  if (m.orcid) contactRows.push(`<li>${icon('orcid')}<span class="visually-hidden">ORCID: </span><a href="https://orcid.org/${esc(m.orcid)}" target="_blank" rel="noopener">${esc(m.orcid)}</a></li>`);
  contactRows.push(`<li>${icon('pin')}<span>${esc(t(ui.department, lang))}, ${esc(t(site.university, lang))}</span></li>`);

  const counts = [
    [pubs.length, ui.publications, 'pubs'],
    [projects.length, ui.projects, 'projects'],
    [awards.length, ui.awards, 'awards'],
  ].filter(([c]) => c > 0);

  return `<section class="profile-hero">
  <div class="page-hero__art" aria-hidden="true"></div>
  <div class="container">
    ${breadcrumb(ctx, [[t(site.ui.nav.members, lang), href(ctx, 'members/')], [n.primary]])}
    <div class="profile-head">
      <div class="profile-head__photo">${avatar(ctx, m, { size: 'xl', eager: true })}</div>
      <div class="profile-head__body">
        <p class="eyebrow">${esc(position)}</p>
        <h1 class="profile-head__name">${esc(n.primary)} <span class="profile-head__alt" lang="${n.secLang}">${esc(n.secondary)}</span></h1>
        ${m.titles ? `<ul class="profile-head__titles">${m.titles[lang].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="profile-head__dept">${esc(t(ui.department, lang))} · ${esc(t(site.university, lang))}</p>`}
        <ul class="contact-list">${contactRows.join('')}</ul>
        ${counts.length ? `<ul class="profile-counts">${counts.map(([c, label, id]) => `<li><a href="#${id}"><span class="profile-counts__num">${c}</span> ${esc(t(label, lang))}</a></li>`).join('')}</ul>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="container profile-grid">
    <div class="profile-main">
      <section class="profile-block">
        <h2 class="profile-block__title">${esc(t(ui.bio, lang))}</h2>
        ${m.bio && t(m.bio, lang) ? `<div class="prose">${t(m.bio, lang).split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : `<p>${ph}</p>`}
      </section>
    </div>
    <aside class="profile-aside">
      <section class="profile-block">
        <h2 class="profile-block__title">${esc(t(ui.interests, lang))}</h2>
        ${interests.length ? tagList(interests, 'tags--accent') : `<p>${ph}</p>`}
      </section>
      ${listBlock(ui.education, m.education)}
      ${listBlock(ui.memberships, m.memberships)}
      ${listBlock(ui.honours, m.honours)}
    </aside>
  </div>
</section>

${pubs.length ? `<section class="section section--tint" id="pubs">
  <div class="container">
    ${sectionHeader({ title: `${t(ui.publications, lang)} (${pubs.length})` })}
    <ol class="cite-list">${pubs.map((p) => citation({ ...ctx, currentMember: m.slug }, p)).join('')}</ol>
  </div>
</section>` : ''}

${projects.length ? `<section class="section" id="projects">
  <div class="container">
    ${sectionHeader({ title: `${t(ui.projects, lang)} (${projects.length})` })}
    <ul class="project-grid">${projects.map((p) => projectCard(ctx, p)).join('')}</ul>
  </div>
</section>` : ''}

${awards.length ? `<section class="section${projects.length ? ' section--tint' : ''}" id="awards">
  <div class="container">
    ${sectionHeader({ title: `${t(ui.awards, lang)} (${awards.length})` })}
    <ul class="award-grid">${awards.map((a) => awardItem(ctx, a)).join('')}</ul>
  </div>
</section>` : ''}

<div class="container profile-back">
  <a class="text-link text-link--back" href="${href(ctx, 'members/')}">${icon('arrow')}${esc(t(ui.back, lang))}</a>
</div>`;
}
