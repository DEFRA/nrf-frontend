# Coding Rules

This file contains specific coding standards, patterns, and conventions for this project.

AI coding agents should read this file before making any code changes.

## Code

- do not add code comments

## Tests

- use minimal mocking; do not mock subdependencies unless necessary
- Framework: Vitest with `globals: true` (describe/test/expect are global, no imports needed)
- Config: `vitest.config.js` — `clearMocks: true` is set globally, do not add `vi.clearAllMocks()` in test files
- Integration tests use `server.inject()` to test routes against the real Hapi server
- Test files are co-located with source files using `.test.js` suffix
