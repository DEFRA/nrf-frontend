import { describe, it, expect } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

describe('upload-boundary getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe('Upload a red line boundary file')
  })

  it('should return correct view model', () => {
    const viewModel = getViewModel()

    expect(viewModel).toEqual({
      pageTitle:
        'Upload a red line boundary file - Nature Restoration Fund - Gov.uk',
      pageHeading: 'Upload a red line boundary file',
      backLinkPath: '/quote/boundary-type'
    })
  })
})
