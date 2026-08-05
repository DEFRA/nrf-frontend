import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

if (typeof HTMLCanvasElement !== 'undefined') {
  // eslint-disable-next-line no-undef
  HTMLCanvasElement.prototype.getContext = () => null
}

// jsdom's `document` is shared across every test in a file, so anything
// appended to the body (panels, buttons, map elements) would otherwise
// still be there for the next test. Only jsdom test files have `document`.
if (typeof document !== 'undefined') {
  afterEach(() => {
    document.body.innerHTML = ''
  })
}
