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

## Other docs

- [Context for AI tools](./docs/ai-context.md)
- [Docker for local development](./docs/docker.md)
- [Application caching](./docs/app-caching.md)
- [Authentication](./docs/auth/index.md)
- [Licence](./docs/licence.md)
