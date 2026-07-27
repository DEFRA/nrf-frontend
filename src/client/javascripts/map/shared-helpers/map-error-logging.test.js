// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { wireMapErrorLogging } from './map-error-logging.js'

describe('wireMapErrorLogging', () => {
  it('suppresses map errors without throwing', () => {
    const mapInstance = { on: vi.fn() }

    wireMapErrorLogging(mapInstance)

    const errorHandler = mapInstance.on.mock.calls[0][1]

    expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(() =>
      errorHandler({ error: new Error('tile load failed') })
    ).not.toThrow()
  })
})
