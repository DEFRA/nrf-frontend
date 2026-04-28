# Tests

## Types of test

- **Unit** - the lowest level, prefer this for edge cases, there should be many more of these than acceptance tests as they're faster and easier to debug. Filename is \*.test.js
- **Acceptance** - should test an entire page or endpoint by sending a request to the running server. Filename is \*.acceptance.test.js
- There are also **journey** tests but those are in a different repo (nrf-journey-tests) and should be reserved for very few 'happy path' cases, or functionality that's too complext to test using unit or acceptance tests.

## Location

- Unit tests for a given code file should be in the same directory as the file. For acceptance tests put the test file in the same folder as the page or the endpoint controller it's testing.

## Mocking

- avoid excessive mocking of functions used by the function-under-test unless there's a good reason (eg the function you want to mock wraps a browser API that is difficult to mock)
- for mocking responses from service calls out to other APIs, prefer Mock Service Worker rather than mocking fetch or HTTP clients like Wreck ([example](../../src/server/quote/check-your-answers/controller-post.test.js))
- no need to reset or clear mocks within test files as `mockReset` is set globally for vitest
- the test suite spins up a real redis container so tests **don't** have to mock functions that wrap it eg session cache

## Testing DOM / HTML

- DOM testing library is used for querying the DOM, prefer that to native querySelector as it enables finding elements by ARIA role or associated label so builds in accessibility checks, for free

## Test readability

- Keep fixtures and test utils out of tests and place in eg `src/test-utils` for re-use and to make the test file itself shorter and easier to read.

## Fixtures

- Re-use fixture fragments eg response JSON where possible to make it easier to maintain data contracts, as the codebase doesn't have the benefit of using Typescript. Shared fixtures can be placed in `src/test-utils/fixtures`
