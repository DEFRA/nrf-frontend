import { describe, it, expect, vi } from 'vitest'
import getViewModel from './get-view-model.js'

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('no-edp getViewModel', () => {
  it('should link back to the draw boundary map page when the boundary was drawn', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'draw' })

    expect(viewModel.backLinkPath).toBe('/quote/draw-boundary')
  })

  it('should link back to the upload boundary page when the boundary was uploaded', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'upload' })

    expect(viewModel.backLinkPath).toBe('/quote/upload-boundary')
  })

  it('should carry change=true on the back link in change mode', () => {
    const drawn = getViewModel(
      { boundaryEntryType: 'draw' },
      { change: 'true' }
    )
    const uploaded = getViewModel(
      { boundaryEntryType: 'upload' },
      { change: 'true' }
    )

    expect(drawn.backLinkPath).toBe('/quote/draw-boundary?change=true')
    expect(uploaded.backLinkPath).toBe('/quote/upload-boundary?change=true')
  })

  it('should use a placeholder back link when the boundary entry type is not set', () => {
    const viewModel = getViewModel()

    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })

  // A user editing their saved quote from the review page must go back to
  // the change alias's boundary steps — the quote journey's own pages would
  // bounce them to the start page.
  it.each([
    {
      boundaryEntryType: 'draw',
      expected: '/request-to-use/change/draw-boundary'
    },
    {
      boundaryEntryType: 'upload',
      expected: '/request-to-use/change/upload-boundary'
    },
    {
      boundaryEntryType: undefined,
      expected: '/request-to-use/change/boundary-type'
    }
  ])(
    'should link back to the change alias $expected when editing a saved quote',
    ({ boundaryEntryType, expected }) => {
      const viewModel = getViewModel({
        boundaryEntryType,
        isEditingSavedQuote: true
      })

      expect(viewModel.backLinkPath).toBe(expected)
    }
  )

  it('should log an error and keep the placeholder back link when the boundary entry type is not recognised', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'unknown' })

    expect(mockLogger.error).toHaveBeenCalledWith(
      { boundaryEntryType: 'unknown' },
      'boundaryEntryType is not recognised'
    )
    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })
})
