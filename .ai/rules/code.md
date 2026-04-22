# Coding patterns

## Functions

- Use short, single-purpose functions. Any over 75 lines will be failed by SonarQube, but aim to make them shorter.
- If there are multiple function params, use an object param instead
- Generate JSDoc for function signatures? (use a skill for this?)

## Config

- If a env var will vary between envs, use config to set it
- For any config vars introduced that don’t have a default value in config.js, add to .env.example

## Functional / classes

- Favour functional over classes (unless creating a stateful local component? To follow gov.uk pattern)

## Observability

### Tracing

- For any inter-service call or message, include the tracing header (example in `src/server/common/services/nrf-backend.js`)

### Logging

- call logger.error with an error instance as the first param
- Call logger.info with an object as the first param
- prefer using createLogger in modules rather than passing the request.logger in as a function parameter

## Services pattern

- Where you need to interact with other services eg APIs, wrap the code in a service (see examples in `src/common/services`
- If a service interaction is not blocking the user experience, consider adding a retry mechanism
- Use a single HTTP client if possible (wreck?) and wrap it in a helper so eg tracing header is always sent
- Base paths for other services should come from config as a separate env var (eg avoid getImpactAssessorUrl)
