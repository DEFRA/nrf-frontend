import { vi } from 'vitest'

/**
 * The module under test registers its init function via
 * document.addEventListener('DOMContentLoaded', ...) at import time — this
 * captures that handler so it can be invoked on demand instead of waiting
 * for a real DOMContentLoaded event.
 * @param {() => Promise<unknown>} importModule
 */
export function createModuleLoader(importModule) {
  let initFn = null
  const originalAddEventListener = document.addEventListener.bind(document)

  function interceptDOMContentLoaded() {
    vi.spyOn(document, 'addEventListener').mockImplementation(
      (event, fn, ...rest) => {
        if (event === 'DOMContentLoaded') {
          initFn = fn
        } else {
          originalAddEventListener(event, fn, ...rest)
        }
      }
    )
  }

  async function loadModule() {
    await importModule()
    initFn?.()
  }

  return { interceptDOMContentLoaded, loadModule }
}
