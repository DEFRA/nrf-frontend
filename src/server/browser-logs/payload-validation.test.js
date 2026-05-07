import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { withValidQuoteSession } from '../../test-utils/with-valid-quote-session.js'

const validPayload = {
  level: 'error',
  message: 'test error',
  timestamp: 1736937000000,
  action: 'error',
  url: 'http://localhost/test',
  userAgent: 'vitest'
}

describe('browser-logs payload validation', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeAll(async () => {
    config.set('log.browserLogging.enabled', true)
    sessionCookie = await withValidQuoteSession(getServer())
  })

  afterAll(() => {
    config.set('log.browserLogging.enabled', false)
  })

  const inject = (payload) =>
    getServer().inject({
      method: 'POST',
      url: '/api/browser-logs',
      headers: { cookie: sessionCookie },
      payload
    })

  it('accepts a valid payload', async () => {
    const result = await inject(validPayload)
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('silently drops an unknown action value', async () => {
    const result = await inject({ ...validPayload, action: 'unknown-action' })
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('silently drops an unknown errorType value', async () => {
    const result = await inject({ ...validPayload, errorType: 'CustomError' })
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('silently drops a payload missing required message', async () => {
    const { message: _message, ...noMessage } = validPayload
    const result = await inject(noMessage)
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('silently drops a payload missing required timestamp', async () => {
    const { timestamp: _timestamp, ...noTimestamp } = validPayload
    const result = await inject(noTimestamp)
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('strips HTML tags from message before logging', async () => {
    const result = await inject({
      ...validPayload,
      message: 'error <script>alert(1)</script> occurred'
    })
    expect(result.statusCode).toBe(statusCodes.noContent)
  })

  it('strips HTML tags from stack before logging', async () => {
    const result = await inject({
      ...validPayload,
      stack: 'Error\n    at <img src=x onerror=alert(1)> app.js:1'
    })
    expect(result.statusCode).toBe(statusCodes.noContent)
  })
})
