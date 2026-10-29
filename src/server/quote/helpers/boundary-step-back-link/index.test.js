import { describe, it, expect, vi } from 'vitest'
import { resolveBoundaryStepBackLink } from './index.js'

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../../../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

const paths = {
  drawBoundaryPath: '/draw-boundary',
  uploadBoundaryPath: '/upload-boundary',
  fallbackPath: '/boundary-type'
}

describe('resolveBoundaryStepBackLink', () => {
  it.each([
    { boundaryEntryType: 'draw', expected: '/draw-boundary' },
    { boundaryEntryType: 'upload', expected: '/upload-boundary' },
    { boundaryEntryType: undefined, expected: '/boundary-type' },
    { boundaryEntryType: 'unknown', expected: '/boundary-type' }
  ])(
    'returns $expected when the boundary entry type is $boundaryEntryType',
    ({ boundaryEntryType, expected }) => {
      expect(resolveBoundaryStepBackLink({ boundaryEntryType, ...paths })).toBe(
        expected
      )
    }
  )

  it('logs an error when the boundary entry type is not recognised', () => {
    resolveBoundaryStepBackLink({ boundaryEntryType: 'unknown', ...paths })

    expect(mockLogger.error).toHaveBeenCalledWith(
      { boundaryEntryType: 'unknown' },
      'boundaryEntryType is not recognised'
    )
  })
})
