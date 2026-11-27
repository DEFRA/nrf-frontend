import { getByRole } from '@testing-library/dom'
import { seedRequestToUseSessionWith } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { withValidQuoteSession } from '../../../../test-utils/with-valid-quote-session.js'
import {
  fullQuote,
  originalNrlReference
} from '../../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/change/original-boundary-not-matched'
const changeOriginalReferencePath =
  '/request-to-use/change/original-reference?from=boundary-not-matched'
const changeOriginalReferenceNotMatchedPath =
  '/request-to-use/change/original-reference-not-matched'
const startPagePath = '/manage/start-page'

describe('Change details do not match page', () => {
  const getServer = setupTestServer()
  let sessionToSeed = null

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => sessionToSeed)
  })

  beforeEach(() => {
    sessionToSeed = {
      nrlReference: fullQuote.reference,
      originalNrlReference
    }
  })

  it.each(['Back', 'Check the NRL reference'])(
    'sends the %s link to the change original reference page',
    async (linkName) => {
      const document = await loadPage({
        requestUrl: pagePath,
        server: getServer(),
        cookie: await withCompleteQuoteSession(getServer())
      })

      expect(getByRole(document, 'link', { name: linkName })).toHaveAttribute(
        'href',
        changeOriginalReferencePath
      )
    }
  )

  it('redirects to the change reference not matched page when there is no original reference', async () => {
    sessionToSeed = { nrlReference: fullQuote.reference }

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      changeOriginalReferenceNotMatchedPath
    )
  })

  it('redirects to the start page without a request to use session', async () => {
    sessionToSeed = null

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPagePath)
  })

  it('redirects to the start page when the saved quote is incomplete', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie: await withValidQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPagePath)
  })
})
