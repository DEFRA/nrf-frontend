import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { config } from '../../config/config.js'
import { resetBrowserLogsRateLimiter } from './rate-limiter.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { withValidQuoteSession } from '../../test-utils/with-valid-quote-session.js'

describe('browser-logs rate limiting', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    config.set('log.browserLogging.enabled', true)
    config.set('log.browserLogging.rateLimit.points', 3)
    resetBrowserLogsRateLimiter()
  })

  afterAll(() => {
    config.set('log.browserLogging.enabled', false)
    config.set('log.browserLogging.rateLimit.points', 10)
    resetBrowserLogsRateLimiter()
  })

  it('allows requests up to the limit and returns 429 on the next one', async () => {
    const sessionCookie = await withValidQuoteSession(getServer())

    const injectRequest = () =>
      getServer().inject({
        method: 'POST',
        url: '/api/browser-logs',
        headers: { cookie: sessionCookie },
        payload: {
          level: 'error',
          message: 'test error',
          timestamp: Date.now(),
          action: 'error',
          url: 'http://localhost/test',
          userAgent: 'vitest'
        }
      })

    const results = []
    for (let i = 0; i < 4; i++) {
      results.push(await injectRequest())
    }

    const codes = results.map((r) => r.statusCode)
    expect(codes).toEqual([
      statusCodes.noContent,
      statusCodes.noContent,
      statusCodes.noContent,
      statusCodes.tooManyRequests
    ])
  })
})
