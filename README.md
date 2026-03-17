# nrf-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_nrf-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_nrf-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_nrf-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_nrf-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_nrf-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_nrf-frontend)

## Requirements

### Node.js / NPM

For the minimum Node / NPM versions, see package.json `engines`, and also .nvmrc.

To switch to the required version of Node, ensure you have [nvm](https://github.com/nvm-sh/nvm) installed, and then run:

```
nvm use
```

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Docker Compose (LocalStack)

To run the application with local AWS services (S3, SQS), Redis and MongoDB:

```bash
docker compose up --build -d
```

The `compose/01-start-localstack.sh` script runs automatically on container startup to create the S3 buckets and SQS queues required by the CDP uploader.

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

### Production

For most cases, using development mode as above is easiest.
To mimic the application running in `production` mode locally run:

```bash
npm start
```

### API documentation

Swagger UI is available at `/docs` when the server is running.
The OpenAPI spec is generated from `@openapi` JSDoc annotations in the route and controller files.

### Keeping Swagger docs in sync

An AI (Claude Code) skill is provided to audit and fix the `@openapi` annotations so they match the actual endpoint implementations.

Run it from the project root with:

```shell
/sync-swagger
```

## Interactive map

The boundary check result page uses [@defra/interactive-map](https://github.com/DEFRA/interactive-map) with MapLibre GL to display uploaded red line boundaries. The map client code is in `src/client/javascripts/boundary-map.js`.

### Key details

- **UMD builds via CopyPlugin** — the ESM distribution has its own webpack runtime which conflicts with ours. The UMD builds are copied to `.public/interactive-map/` instead (see `CopyPlugin` in `webpack.config.js`). Core and MapLibre provider go in separate subdirectories because both ship an `index.js`.
- **Separate webpack entry point** — `boundary-map.js` is its own entry so map code is only loaded on pages that need it.
- **Server-side coordinate projection** — the impact assessor API defaults to returning geometry in WGS84 (EPSG:4326), which MapLibre requires. No client-side reprojection is needed.
- **CSP** — map `<script>` tags must include `nonce="{{ nonce }}"` (Blankie). MapLibre needs `workerSrc`/`childSrc` set to `['self', 'blob:']` for web workers, and the `MAP_STYLE_URL` origin is added to `connectSrc` automatically.
- **`MAP_STYLE_URL`** — set this env var to a [Mapbox Style Spec](https://maplibre.org/maplibre-style-spec/) URL (e.g. OS Maps). Defaults to MapLibre demo tiles for local dev.

## Other docs

- [Context for AI tools](./docs/ai-context.md)
- [Docker for local development](./docs/docker.md)
- [Application caching](./docs/app-caching.md)
- [Authentication](./docs/auth/index.md)
- [Licence](./docs/licence.md)
