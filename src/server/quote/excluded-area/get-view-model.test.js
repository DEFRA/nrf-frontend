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

  it('should carry change=true on the back link in change mode', () => {
    const drawn = getViewModel(
      { ...baseQuoteData, boundaryEntryType: 'draw' },
      { change: 'true' }
    )
    const uploaded = getViewModel(baseQuoteData, { change: 'true' })

    expect(drawn.backLinkPath).toBe('/quote/draw-boundary?change=true')
    expect(uploaded.backLinkPath).toBe('/quote/upload-boundary?change=true')
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

  it('should expose the first intersecting excluded area as rlbExcludedArea', () => {
    const viewModel = getViewModel(baseQuoteData)

    expect(viewModel.rlbExcludedArea).toBe(excludedAreas[0])
  })

  it('should expose the first intersecting EDP label as rlbEdp', () => {
    const intersectingEdps = [
      { label: 'Norfolk EDP', catchments: [] },
      { label: 'Wensum EDP', catchments: [] }
    ]
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryGeojson: {
        intersectingExcludedAreas: excludedAreas,
        intersectingEdps
      }
    })

    expect(viewModel.rlbEdp).toBe('Norfolk EDP')
  })

  it('should expose the second catchment label as rlbCatchment2 when it exists', () => {
    const intersectingEdps = [
      {
        label: 'Norfolk EDP',
        catchments: [
          { label: 'Catchment A' },
          { label: 'Catchment B' },
          { label: 'Catchment C' }
        ]
      }
    ]
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryGeojson: {
        intersectingExcludedAreas: excludedAreas,
        intersectingEdps
      }
    })

    expect(viewModel.rlbCatchment2).toBe('Catchment B')
  })

  it('should not include rlbCatchment2 when only one catchment exists', () => {
    const intersectingEdps = [
      { label: 'Norfolk EDP', catchments: [{ label: 'Catchment A' }] }
    ]
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryGeojson: {
        intersectingExcludedAreas: excludedAreas,
        intersectingEdps
      }
    })

    expect(viewModel).not.toHaveProperty('rlbCatchment2')
  })

  it('should expose the third catchment label as rlbCatchment3 when it exists', () => {
    const intersectingEdps = [
      {
        label: 'Norfolk EDP',
        catchments: [
          { label: 'Catchment A' },
          { label: 'Catchment B' },
          { label: 'Catchment C' }
        ]
      }
    ]
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryGeojson: {
        intersectingExcludedAreas: excludedAreas,
        intersectingEdps
      }
    })

    expect(viewModel.rlbCatchment3).toBe('Catchment C')
  })

  it('should not include rlbCatchment3 when only two catchments exist', () => {
    const intersectingEdps = [
      {
        label: 'Norfolk EDP',
        catchments: [{ label: 'Catchment A' }, { label: 'Catchment B' }]
      }
    ]
    const viewModel = getViewModel({
      ...baseQuoteData,
      boundaryGeojson: {
        intersectingExcludedAreas: excludedAreas,
        intersectingEdps
      }
    })

    expect(viewModel).not.toHaveProperty('rlbCatchment3')
  })

  it('should expose the boundary entry type as rlbOption', () => {
    const viewModel = getViewModel(baseQuoteData)

    expect(viewModel.rlbOption).toBe('upload')
  })
})
