# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

NRF Frontend is a DEFRA (Department for Environment, Food & Rural Affairs) government service built on the CDP (Core Delivery Platform) Frontend Template. It uses Hapi.js as the server framework, Nunjucks for templating with GOV.UK Design System components, and Webpack for frontend asset bundling.

## Commands

Common commands (see `package.json` scripts section for full list):

- **Dev server:** `npm run dev` (runs webpack watch + nodemon in parallel)
- **Run all tests:** `npm test` (builds frontend first via pretest hook)
- **Run single test:** `TZ=UTC npx vitest run src/server/home/controller.test.js`
- **Watch tests:** `npm run test:watch`
- **Lint:** `npm run lint` (runs both JS and SCSS linting)
- **Lint fix:** `npm run lint:js:fix`
- **Format check:** `npm run format:check`
- **Format fix:** `npm run format`

## Architecture

### Server (Hapi.js)

Entry point is `src/index.js` → `src/server/server.js` creates the Hapi server with plugins registered in a specific order. Routes are registered via `src/server/router.js`.

**Configuration** uses `convict` (`src/config/config.js`) with environment variable overrides. All config values are accessed via `config.get('key.path')`.

### Route Module Pattern

Each route is a Hapi plugin in its own directory under `src/server/`:

```
src/server/{route-name}/
  index.js        — Plugin that registers routes, exported as a named constant
  controller.js   — Handler objects with { handler, options? } shape
  controller.test.js
  index.njk       — Nunjucks view template
```

Routes are registered in `src/server/router.js` by importing and adding to the `server.register()` call.

### Views (Nunjucks)

- **Layout:** `src/server/common/templates/layouts/page.njk` extends `govuk/template.njk`
- **Page templates:** Located alongside their route module (e.g., `src/server/home/index.njk`), extend `layouts/page.njk`
- **Custom components:** `src/server/common/components/{name}/` with `macro.njk`, `template.njk`, and optional SCSS
- **Nunjucks path resolution:** Views are resolved relative to `src/server/` — so `h.view('home/index')` maps to `src/server/home/index.njk`
- **Filters/globals:** `src/config/nunjucks/filters/` and `src/config/nunjucks/globals/`

### Authentication (DEFRA Identity)

OAuth 2.0/OIDC authentication via `@hapi/bell` with a custom `yar-session` scheme that stores sessions in server-side cache (Redis in production, in-memory locally). The auth plugin is at `src/server/plugins/defra-identity.js`. Auth is optional — the server starts without it if OIDC configuration is unreachable. Controlled by `ENABLE_DEFRA_ID` env var.

Auth strategies: `defra-id` (Bell OAuth flow), `defra-session` (session validation). Default server auth mode is `'try'` — routes that need auth use `auth: 'defra-session'`, routes that don't use `auth: false`.

### Client-Side Assets

- **JS:** `src/client/javascripts/application.js` — bundled by Webpack
- **SCSS:** `src/client/stylesheets/application.scss` — imports GOV.UK Frontend styles
- **Built output:** `.public/` directory (gitignored)

### Testing

- **Framework:** Vitest with `globals: true` (describe/test/expect are global, no imports needed)
- **Config:** `vitest.config.js` — `clearMocks: true` is set globally, do not add `vi.clearAllMocks()` in test files
- **Controller tests** use `server.inject()` to test routes against the real Hapi server
- **Component tests** use `renderComponent()` from `src/server/common/test-helpers/component-helpers.js` with Cheerio for DOM assertions
- **Tests run with** `TZ=UTC` to ensure consistent date formatting
- **Test files** are co-located with source files using `.test.js` suffix

### Code Style

- ESLint with `neostandard` (no JSX, no style rules — formatting handled by Prettier)
- SCSS linting via `stylelint-config-gds`
- ES modules throughout (`"type": "module"` in package.json)
- Node.js >= 24

## Developer Documentation

Additional documentation is in the [README.md](./README.md) which also links out to other documents.
