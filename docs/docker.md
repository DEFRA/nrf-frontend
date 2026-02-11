# Docker for local development

### Development image

> [!TIP]
> For Apple Silicon users, you may need to add `--platform linux/amd64` to the `docker run` command to ensure
> compatibility fEx: `docker build --platform=linux/arm64 --no-cache --tag nrf-frontend`

Build:

```bash
docker build --target development --no-cache --tag nrf-frontend:development .
```

Run:

```bash
docker run -p 3000:3000 nrf-frontend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag nrf-frontend .
```

Run:

```bash
docker run -p 3000:3000 nrf-frontend
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- MongoDB
- This service.
- A commented out backend example.

```bash
docker compose up --build -d
```
