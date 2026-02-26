// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('govuk-frontend', () => ({
  createAll: vi.fn(),
  Button: {},
  Checkboxes: {},
  ErrorSummary: {},
  Header: {},
  Radios: {},
  SkipLink: {}
}))
vi.mock('./integer-input-filter.js', () => ({ initAllIntegerFilters: vi.fn() }))

describe('application.js', () => {
  it('initializes components on DOMContentLoaded', async () => {
    const { createAll } = await import('govuk-frontend')
    const { initAllIntegerFilters } = await import('./integer-input-filter.js')

    await import('./application.js')
    document.dispatchEvent(new Event('DOMContentLoaded'))

    expect(createAll).toHaveBeenCalled()
    expect(initAllIntegerFilters).toHaveBeenCalled()
  })
})
