# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

**IMPORTANT:** Before making any code changes, read `.ai/coding-rules.md` for coding standards and patterns.

## NPM tasks

See `package.json`

## App architecture

Entry point is `src/index.js` → `src/server/server.js` creates the Hapi server with plugins registered in a specific order. Routes are registered via `src/server/router.js`.

**Configuration** uses `convict` (`src/config/config.js`) with environment variable overrides. All config values are accessed via `config.get('key.path')`.

Each route is a Hapi plugin in its own directory under `src/server/`.

Routes are registered in `src/server/router.js`.

### Views (Nunjucks)

- **Layout:** `src/server/common/templates/layouts/page.njk` extends `govuk/template.njk`
- **Page templates:** Located alongside their route module (e.g., `src/server/home/index.njk`), extend `layouts/page.njk`
- **Custom components:** `src/server/common/components/{name}/` with `macro.njk`, `template.njk`, and optional SCSS
- **Nunjucks path resolution:** Views are resolved relative to `src/server/` — so `h.view('home/index')` maps to `src/server/home/index.njk`
- **Filters/globals:** `src/config/nunjucks/filters/` and `src/config/nunjucks/globals/`

### Client-Side Assets

- **JS:** `src/client/javascripts/application.js` — bundled by Webpack
- **SCSS:** `src/client/stylesheets/application.scss` — imports GOV.UK Frontend styles
- **Built output:** `.public/` directory (gitignored)
