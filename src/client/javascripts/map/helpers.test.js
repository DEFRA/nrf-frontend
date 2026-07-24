// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { wireMapErrorLogging } from './helpers.js'

describe('wireMapErrorLogging', () => {
  it('suppresses map errors without sending browser logs', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({})
    const mapInstance = { on: vi.fn() }

    wireMapErrorLogging(mapInstance)

    const errorHandler = mapInstance.on.mock.calls[0][1]
    errorHandler({ error: new Error('tile load failed') })

    expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
