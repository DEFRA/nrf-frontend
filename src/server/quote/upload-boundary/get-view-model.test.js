import { describe, it, expect } from 'vitest'
import getViewModel, { pageHeading } from './get-view-model.js'
import { BOUNDARY_UPLOAD_HINT_TEXT } from '../../common/constants/boundary-upload-hint.js'

describe('upload-boundary getViewModel', () => {
  it('should export the correct pageHeading', () => {
    expect(pageHeading).toBe('Upload a red line boundary file')
  })

  it('should return correct view model', () => {
    const viewModel = getViewModel()

    expect(viewModel).toEqual({
      pageTitle: 'Upload boundary - Nature restoration levy - GOV.UK',
      pageHeading: 'Upload a red line boundary file',
      backLinkPath: '/quote/boundary-type',
      boundaryUploadHint: BOUNDARY_UPLOAD_HINT_TEXT
    })
  })
})
