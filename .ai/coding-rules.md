# Coding Rules

This file contains specific coding standards, patterns, and conventions for this project.

AI coding agents should read this file before making any code changes.

## Environment

- Always run `nvm use` before running any commands to ensure the correct Node version (v24) is active. The project requires Node >=24 and has a `.nvmrc` file.

## Tests

- Unit tests for a given file should be in the same directory as the file, with the same filename but with a `.test.js` extension.
- no need to reset or clear mocks within test files as `mockReset` is set globally for vitest
- hoist imports to the top of the file, lint rules prevent them being below mocking statements
- use Mock Service Worker in tests rather than mocking functions that call other services
