import { describe, it, expect, vi } from 'vitest'
import getBoundaryTypePathFromQuote from './index.js'
import { routePath as drawBoundaryPath } from '../../draw-boundary/routes.js'
import { routePath as uploadBoundaryPath } from '../../upload-boundary/routes.js'
import { routePath as boundaryTypePath } from '../../boundary-type/routes.js'

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../../../common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('getBoundaryTypePathFromQuote', () => {
  describe('recognised boundary entry types', () => {
    it('returns the draw boundary route path when the boundary was drawn', () => {
      expect(getBoundaryTypePathFromQuote({ boundaryEntryType: 'draw' })).toBe(
        drawBoundaryPath
      )
    })

    it('returns the upload boundary route path when the boundary was uploaded', () => {
      expect(
        getBoundaryTypePathFromQuote({ boundaryEntryType: 'upload' })
      ).toBe(uploadBoundaryPath)
    })

    it('does not log an error when the boundary entry type is recognised', () => {
      getBoundaryTypePathFromQuote({ boundaryEntryType: 'draw' })

      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('unrecognised boundary entry types', () => {
    it('falls back to the boundary type route path for an unrecognised value', () => {
      expect(
        getBoundaryTypePathFromQuote({ boundaryEntryType: 'unknown' })
      ).toBe(boundaryTypePath)
    })

    it('falls back to the boundary type route path when boundaryEntryType is missing', () => {
      expect(getBoundaryTypePathFromQuote({})).toBe(boundaryTypePath)
    })

    it('falls back to the boundary type route path when no quote data is provided', () => {
      expect(getBoundaryTypePathFromQuote()).toBe(boundaryTypePath)
    })

    it('logs an error including the unrecognised boundary entry type', () => {
      getBoundaryTypePathFromQuote({ boundaryEntryType: 'unknown' })

      expect(mockLogger.error).toHaveBeenCalledWith(
        { boundaryEntryType: 'unknown' },
        'boundaryEntryType is not recognised'
      )
    })

    it('logs an error when boundaryEntryType is missing', () => {
      getBoundaryTypePathFromQuote()

      expect(mockLogger.error).toHaveBeenCalledWith(
        { boundaryEntryType: undefined },
        'boundaryEntryType is not recognised'
      )
    })
  })
})
