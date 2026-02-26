// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock govuk-frontend
vi.mock('govuk-frontend', () => ({
  createAll: vi.fn(),
  Button: 'Button',
  Checkboxes: 'Checkboxes',
  ErrorSummary: 'ErrorSummary',
  Header: 'Header',
  Radios: 'Radios',
  SkipLink: 'SkipLink'
}))

// Mock integer-input-filter
vi.mock('./integer-input-filter.js', () => ({
  initAllIntegerFilters: vi.fn()
}))

describe('application.js', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes GOV.UK components and integer filters on DOMContentLoaded', async () => {
    const { createAll } = await import('govuk-frontend')
    const { initAllIntegerFilters } = await import('./integer-input-filter.js')

    // Import application.js to register the event listener
    await import('./application.js')

    // Dispatch DOMContentLoaded event
    document.dispatchEvent(new Event('DOMContentLoaded'))

    // Verify GOV.UK components were initialized
    expect(createAll).toHaveBeenCalledWith('Button')
    expect(createAll).toHaveBeenCalledWith('Checkboxes')
    expect(createAll).toHaveBeenCalledWith('ErrorSummary')
    expect(createAll).toHaveBeenCalledWith('Header')
    expect(createAll).toHaveBeenCalledWith('Radios')
    expect(createAll).toHaveBeenCalledWith('SkipLink')

    // Verify integer filters were initialized
    expect(initAllIntegerFilters).toHaveBeenCalled()
  })
})
