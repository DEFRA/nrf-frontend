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

const excludedAreas = ['River Wensum Exclusion Zone', 'Norfolk Broads Buffer']

const baseQuoteData = {
  boundaryEntryType: 'upload',
  boundaryGeojson: { intersectingExcludedAreas: excludedAreas }
}

describe('excluded-area getViewModel', () => {
  it('should link back to the draw boundary map page when the boundary was drawn', () => {
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryEntryType: 'draw'
    })

    expect(viewModel.backLinkPath).toBe('/quote/draw-boundary')
  })

  it('should link back to the upload boundary page when the boundary was uploaded', () => {
    const viewModel = getViewModel(baseQuoteData)

    expect(viewModel.backLinkPath).toBe('/quote/upload-boundary')
  })

  it('should use a placeholder back link when the boundary entry type is not set', () => {
    const viewModel = getViewModel({
      boundaryGeojson: { intersectingExcludedAreas: [] }
    })

    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })

  it('should log an error and keep the placeholder back link when the boundary entry type is not recognised', () => {
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryEntryType: 'unknown'
    })

    expect(mockLogger.error).toHaveBeenCalledWith(
      { boundaryEntryType: 'unknown' },
      'boundaryEntryType is not recognised'
    )
    expect(viewModel.backLinkPath).toBe('/quote/boundary-type')
  })

  it('should expose the intersecting excluded areas as rlbExcludedAreas', () => {
    const viewModel = getViewModel(baseQuoteData)

    expect(viewModel.rlbExcludedAreas).toEqual(excludedAreas)
  })

  it('should expose the boundary entry type as rlbOption', () => {
    const viewModel = getViewModel(baseQuoteData)

    expect(viewModel.rlbOption).toBe('upload')
  })
})
