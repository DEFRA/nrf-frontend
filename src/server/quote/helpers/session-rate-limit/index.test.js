import { describe, it, expect, vi } from 'vitest'
import { quoteSubmitRateLimitPre, fileUploadRateLimitPre } from './index.js'
import { metricsCounter } from '../../../common/helpers/metrics.js'
import { config } from '../../../../config/config.js'

vi.mock('../../../common/helpers/metrics.js', () => ({
  metricsCounter: vi.fn()
}))

const MAX = config.get('sessionRateLimit.maxRequestsPerSession')

const continueSymbol = Symbol('continue')

function makeRequest({ sessionKey, timestamps = [] } = {}) {
  const store = sessionKey ? { [sessionKey]: timestamps } : {}
  return {
    yar: {
      id: 'session-1',
      get: vi.fn((key) => store[key] ?? null),
      set: vi.fn((key, value) => {
        store[key] = value
      })
    }
  }
}

function makeH() {
  const codeChain = { takeover: vi.fn() }
  const responseChain = { code: vi.fn().mockReturnValue(codeChain) }
  return {
    continue: continueSymbol,
    response: vi.fn().mockReturnValue(responseChain),
    _code: codeChain,
    _response: responseChain
  }
}

describe('quoteSubmitRateLimitPre', () => {
  const { method } = quoteSubmitRateLimitPre

  it('returns h.continue when under the limit and records the timestamp', async () => {
    const request = makeRequest({ sessionKey: 'quoteSubmitTimestamps' })
    const h = makeH()

    const result = await method(request, h)

    expect(result).toBe(continueSymbol)
    expect(request.yar.set).toHaveBeenCalledWith('quoteSubmitTimestamps', [
      expect.any(Number)
    ])
  })

  it('returns a 429 takeover when at the max', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: MAX }, (_, i) => now - i * 1000)
    const request = makeRequest({
      sessionKey: 'quoteSubmitTimestamps',
      timestamps
    })
    const h = makeH()

    await method(request, h)

    expect(h.response).toHaveBeenCalledWith({ message: 'Too many requests' })
    expect(h._response.code).toHaveBeenCalledWith(429)
    expect(h._code.takeover).toHaveBeenCalled()
    expect(request.yar.set).not.toHaveBeenCalled()
  })

  it('does not count timestamps outside the hour window', async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    const timestamps = Array.from({ length: MAX }, () => twoHoursAgo)
    const request = makeRequest({
      sessionKey: 'quoteSubmitTimestamps',
      timestamps
    })
    const h = makeH()

    const result = await method(request, h)

    expect(result).toBe(continueSymbol)
  })

  it('emits quoteSubmitCountThreshold exactly when the 30th request is made', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: 29 }, (_, i) => now - i * 1000)
    const request = makeRequest({
      sessionKey: 'quoteSubmitTimestamps',
      timestamps
    })

    await method(request, makeH())

    expect(metricsCounter).toHaveBeenCalledWith('quoteSubmitCountThreshold')
    expect(metricsCounter).toHaveBeenCalledTimes(1)
  })

  it('does not emit the metric below 30 requests', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: 28 }, (_, i) => now - i * 1000)

    await method(
      makeRequest({ sessionKey: 'quoteSubmitTimestamps', timestamps }),
      makeH()
    )

    expect(metricsCounter).not.toHaveBeenCalled()
  })

  it('does not emit the metric above 30 requests', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: 31 }, (_, i) => now - i * 1000)

    await method(
      makeRequest({ sessionKey: 'quoteSubmitTimestamps', timestamps }),
      makeH()
    )

    expect(metricsCounter).not.toHaveBeenCalled()
  })
})

describe('fileUploadRateLimitPre', () => {
  const { method } = fileUploadRateLimitPre

  it('returns h.continue and records the timestamp under the limit', async () => {
    const request = makeRequest({ sessionKey: 'fileUploadTimestamps' })
    const h = makeH()

    const result = await method(request, h)

    expect(result).toBe(continueSymbol)
    expect(request.yar.set).toHaveBeenCalledWith(
      'fileUploadTimestamps',
      expect.any(Array)
    )
  })

  it('emits fileUploadCountThreshold exactly when the 30th request is made', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: 29 }, (_, i) => now - i * 1000)
    const request = makeRequest({
      sessionKey: 'fileUploadTimestamps',
      timestamps
    })

    await method(request, makeH())

    expect(metricsCounter).toHaveBeenCalledWith('fileUploadCountThreshold')
    expect(metricsCounter).toHaveBeenCalledTimes(1)
  })
})
