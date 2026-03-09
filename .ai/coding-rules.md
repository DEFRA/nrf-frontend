# Coding Rules

This file contains specific coding standards, patterns, and conventions for this project.

AI coding agents should read this file before making any code changes.

## Tests

- Unit tests for a given file should be in the same directory as the file, with the same filename but with a `.test.js` extension.
- no need to reset or clear mocks within test files as `mockReset` is set globally for vitest
- hoist imports to the top of the file, lint rules prevent them being below mocking statements
