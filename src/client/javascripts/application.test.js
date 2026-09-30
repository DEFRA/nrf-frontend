// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('govuk-frontend', () => ({
  createAll: vi.fn(),
  Button: {},
  Checkboxes: {},
  ErrorSummary: {},
  Header: {},
  NotificationBanner: {},
  Radios: {},
  SkipLink: {}
}))

describe('application.js', () => {
  it('initializes components on DOMContentLoaded', async () => {
    const {
      createAll,
      Button,
      Checkboxes,
      ErrorSummary,
      NotificationBanner,
      Radios,
      SkipLink
    } = await import('govuk-frontend')

    await import('./application.js')
    document.dispatchEvent(new Event('DOMContentLoaded'))

    expect(createAll).toHaveBeenCalledWith(Button)
    expect(createAll).toHaveBeenCalledWith(Checkboxes)
    expect(createAll).toHaveBeenCalledWith(ErrorSummary)
    expect(createAll).toHaveBeenCalledWith(NotificationBanner)
    expect(createAll).toHaveBeenCalledWith(Radios)
    expect(createAll).toHaveBeenCalledWith(SkipLink)
  })
})
