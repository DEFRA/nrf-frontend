import { afterEach } from 'vitest'

/**
 * Some client-side modules bind listeners to `document` itself rather than a
 * specific element (e.g. to catch clicks on dynamically-rendered panel
 * buttons). Since jsdom's `document` is shared across every test in a file,
 * those listeners would otherwise keep firing — and closing over stale
 * mocks — in every subsequent test. Call this once at the top of a test
 * file to remove any listener added via `document.addEventListener` after
 * each test.
 */
export function trackDocumentListeners() {
  const listeners = []
  const originalAddEventListener = document.addEventListener.bind(document)

  document.addEventListener = (eventType, handler, options) => {
    listeners.push([eventType, handler, options])
    originalAddEventListener(eventType, handler, options)
  }

  afterEach(() => {
    listeners.splice(0).forEach(([eventType, handler, options]) => {
      document.removeEventListener(eventType, handler, options)
    })
  })
}
