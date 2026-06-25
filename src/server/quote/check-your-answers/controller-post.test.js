import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

const backendUrl = config.get('backend').apiUrl
const MAX = config.get('sessionRateLimit.maxRequestsPerSession')

const mswServer = setupMswServer()

describe('quoteSubmitController', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withValidQuoteSession(getServer())
    mswServer.use(
      http.post(`${backendUrl}/quotes`, () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
  })

  it('redirects to the confirmation page on successful submit', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/confirmation?reference=NRF-123456'
    )
  })

  it('returns 429 once the session has hit the request limit', async () => {
    for (let i = 0; i < MAX; i++) {
      await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie: sessionCookie
      })
    }

    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(429)
  })
})
