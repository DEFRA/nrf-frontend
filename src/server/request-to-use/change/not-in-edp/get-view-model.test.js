import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('change not in EDP getViewModel', () => {
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
    'should link back to $expected when the boundary entry type is $boundaryEntryType',
    ({ boundaryEntryType, expected }) => {
      const viewModel = getViewModel({ boundaryEntryType })

      expect(viewModel.backLinkPath).toBe(expected)
    }
  )

  it("should keep the quote dropout page's heading and title", () => {
    const viewModel = getViewModel({ boundaryEntryType: 'draw' })

    expect(viewModel.pageHeading).toBe(
      'Nature restoration levy is not available in this area'
    )
    expect(viewModel.pageTitle).toBe(
      'Not in EDP - Nature restoration levy - GOV.UK'
    )
  })
})
