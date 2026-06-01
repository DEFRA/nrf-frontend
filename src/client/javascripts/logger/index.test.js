// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from './index.js'

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({})
})

describe('logger.info', () => {
  it('POSTs to /api/browser-logs with level info and message', () => {
    logger.info({ action: 'map-load' }, 'Map loaded')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/browser-logs',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body).toMatchObject({
      level: 'info',
      message: 'Map loaded',
      action: 'map-load',
      url: window.location.href,
      userAgent: navigator.userAgent
    })
    expect(body.timestamp).toBeTypeOf('number')
  })

  it('allows meta to override action', () => {
    logger.info({ action: 'custom-event' }, 'Something happened')

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.action).toBe('custom-event')
  })
})

describe('logger.error', () => {
  it('POSTs to /api/browser-logs with level error, stack and errorType', () => {
    const error = new Error('Something broke')
    logger.error(error, 'Map failed')

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body).toMatchObject({
      level: 'error',
      message: 'Map failed',
      action: 'error',
      stack: error.stack,
      errorType: 'Error'
    })
  })

  it('handles a null error without throwing', () => {
    expect(() => logger.error(null, 'Something went wrong')).not.toThrow()

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(body.level).toBe('error')
    expect(body.message).toBe('Something went wrong')
  })
})

describe('logger fetch error handling', () => {
  it('swallows fetch errors without throwing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))

    expect(() => logger.info({ action: 'test' }, 'test')).not.toThrow()
    await Promise.resolve()
  })
})
