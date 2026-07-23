import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('excluded-area getViewModel', () => {
  it('should link back to the draw boundary map page when the boundary was drawn', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'draw' })

    expect(viewModel.backLinkPath).toBe('/quote/draw-boundary')
  })

  it('should link back to the upload boundary page when the boundary was uploaded', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'upload' })

    expect(viewModel.backLinkPath).toBe('/quote/upload-boundary')
  })

  it('should use a placeholder back link when the boundary entry type is not set', () => {
    const viewModel = getViewModel()

    expect(viewModel.backLinkPath).toBe('#')
  })
})
