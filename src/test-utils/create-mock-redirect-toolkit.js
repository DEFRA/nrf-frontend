import { vi } from 'vitest'

/**
 * A mock response toolkit for code that redirects. `redirect` returns a
 * response with `code` and `takeover`, matching how handlers chain them.
 * @returns {{ continue: symbol, response: object, redirect: import('vitest').Mock }}
 */
export const createMockRedirectToolkit = () => {
  const response = {
    code: vi.fn().mockReturnThis(),
    takeover: vi.fn(() => Symbol('takeover'))
  }
  return {
    continue: Symbol('continue'),
    response,
    redirect: vi.fn().mockReturnValue(response)
  }
}
