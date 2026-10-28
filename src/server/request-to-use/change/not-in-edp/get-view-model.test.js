import { describe, it, expect, vi } from 'vitest'
import getViewModel from './get-view-model.js'

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../../../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

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

  it('should log an error and keep the placeholder back link when the boundary entry type is not recognised', () => {
    const viewModel = getViewModel({ boundaryEntryType: 'unknown' })

    expect(mockLogger.error).toHaveBeenCalledWith(
      { boundaryEntryType: 'unknown' },
      'boundaryEntryType is not recognised'
    )
    expect(viewModel.backLinkPath).toBe('/request-to-use/change/boundary-type')
  })

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
