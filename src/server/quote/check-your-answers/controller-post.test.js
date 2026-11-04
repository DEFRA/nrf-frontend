import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as routePathConfirmation } from '../confirmation/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import {
  boundaryGeojson,
  boundaryGeojsonWithExcludedArea
} from '../../../test-utils/fixtures/boundary-geojson.js'

const checkYourAnswersPath = '/quote/check-your-answers'

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
        HttpResponse.json({ reference: 'NRL-123456' })
      )
    )
  })

  it('redirects to the confirmation page on successful submit', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      `${routePathConfirmation}?reference=NRL-123456`
    )
  })

  it.each([
    [
      'the excluded area dropout when the saved boundary is in an exclusion zone',
      boundaryGeojsonWithExcludedArea,
      '/quote/excluded-area?change=true'
    ],
    [
      'the not in EDP dropout when the saved boundary misses every EDP',
      boundaryGeojson,
      '/quote/not-in-edp?change=true'
    ]
  ])(
    'redirects to %s without submitting the quote',
    async (_, boundaryGeojsonFixture, location) => {
      const quoteSubmissions = []
      mswServer.use(
        http.post(`${backendUrl}/quotes`, () => {
          quoteSubmissions.push(true)
          return HttpResponse.json({ reference: 'NRL-123456' })
        })
      )

      const { response } = await submitForm({
        requestUrl: checkYourAnswersPath,
        server: getServer(),
        formData: {},
        cookie: await withCompleteQuoteSession(
          getServer(),
          boundaryGeojsonFixture
        )
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(location)
      expect(quoteSubmissions).toEqual([])
    }
  )

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
