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

describe('application.js', () => {
  it('initializes components on DOMContentLoaded', async () => {
    const { createAll } = await import('govuk-frontend')

    await import('./application.js')
    document.dispatchEvent(new Event('DOMContentLoaded'))

    expect(createAll).toHaveBeenCalled()
  })
})
