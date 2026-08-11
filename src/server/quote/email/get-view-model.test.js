import { describe, it, expect, vi } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('email getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe('Enter your email address')
  })

  it('should return the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel()
    expect(viewModel.pageTitle).toBe(
      'Enter your email address - Nature restoration levy - GOV.UK'
    )
    expect(viewModel.pageHeading).toBe(title)
  })

  it('should link back to boundary-type when the boundary entry type is not set', () => {
    const viewModel = getViewModel()

    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })

  it('should link back to the draw boundary map page when the boundary was drawn', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'draw' })

    expect(viewModel.backLinkPath).toBe('/quote/draw-boundary')
  })

  it('should link back to the upload preview map page when the boundary was uploaded', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'upload' })

    expect(viewModel.backLinkPath).toBe('/quote/file-preview')
  })

  it('should log an error and keep the placeholder back link when the boundary entry type is not recognised', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'unknown' })

    expect(mockLogger.error).toHaveBeenCalledWith(
      { boundaryEntryType: 'unknown' },
      'boundaryEntryType is not recognised'
    )
    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })

  it('should link back to check-your-answers when change=true is in the query', () => {
    const viewModel = getViewModel(
      { boundaryEntryType: 'draw' },
      { change: 'true' }
    )

    expect(viewModel.backLinkPath).toBe('/quote/check-your-answers')
  })

  it('should link back to check-your-answers on change=true regardless of boundary entry type', () => {
    const viewModel = getViewModel({}, { change: 'true' })

    expect(viewModel.backLinkPath).toBe('/quote/check-your-answers')
  })
})
