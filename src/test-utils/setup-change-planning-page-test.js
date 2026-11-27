import { setupSignedInTestServer } from './setup-signed-in-test-server.js'
import { seedRequestToUseSessionWith } from './setup-seeded-request-to-use-server.js'
import { withCompleteQuoteSession } from './with-complete-quote-session.js'
import { loadPage } from './load-page.js'
import { findSummaryListRowElement } from './find-summary-list-row.js'
import { agentClaims } from './fixtures/defra-id-org-claims.js'
import { reviewDetailsSessions } from './fixtures/review-details-personas.js'
import { fullQuote } from './fixtures/quote.js'
import { recalculatedLevy } from './fixtures/levy.js'

const checkYourAnswersPath = '/request-to-use/check-your-answers'

const baseSession = {
  ...reviewDetailsSessions.agent,
  nrlReference: fullQuote.reference,
  levy: recalculatedLevy,
  acceptLevy: 'yes'
}

/**
 * Sets up a signed-in test server for a change page that returns to check your
 * answers. The seeded request to use session is re-saved after every response,
 * so it must hold only answers the page under test does not change. It resets
 * before each test; pass `null` to seedSession for the no-session case.
 * @returns {{ getServer: Function, mswServer: object, signedInCookie: () => Promise<string>, seedSession: (session: object | null) => void, rowText: (params: { cookie: string, key: string }) => Promise<string> }}
 */
export const setupChangePlanningPageTest = () => {
  const { getServer, signIn, mswServer } = setupSignedInTestServer()
  let seededSession = null

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => seededSession)
  })

  beforeEach(() => {
    seededSession = baseSession
  })

  const signedInCookie = async () => {
    const quoteCookie = await withCompleteQuoteSession(getServer())
    const { cookie } = await signIn({
      claims: agentClaims,
      cookie: quoteCookie
    })
    return cookie
  }

  const seedSession = (session) => {
    seededSession = session && { ...baseSession, ...session }
  }

  const rowText = async ({ cookie, key }) => {
    const document = await loadPage({
      requestUrl: checkYourAnswersPath,
      server: getServer(),
      cookie
    })
    return findSummaryListRowElement(document, key)
      ?.querySelector('.govuk-summary-list__value')
      ?.textContent.trim()
  }

  return { getServer, mswServer, signedInCookie, seedSession, rowText }
}
