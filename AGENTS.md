# Agent notes
- Generator: `scripts/build.mjs` imports templates from `src/templates/` (`helpers.mjs`, `layout.mjs`, `components.mjs`, `pages/*.mjs`) and data from `/data`. Output: `dist/` (never commit).
- Links are relative (`ctx.root` = `../` × depth); only 404 pages use `BASE_PATH`. Keep it that way so GitHub Pages sub-paths work. No Netlify-only features.
- URLs mirror the original site: `/en/achievements/` = publications, `/en/members/<Slug>/`.
- Never invent content; missing data renders `placeholder()`.
- CSS/JS in `src/assets` are content-hashed at build. Fonts self-hosted (Inter, Source Serif 4).
- Remaining work: see PLAN.md.
