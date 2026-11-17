// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import {
  agentClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { reviewDetailsSessions } from '../../../test-utils/fixtures/review-details-personas.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

const pagePath = '/request-to-use/check-your-answers'
const { getServer, signIn } = setupSignedInTestServer()

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

const signInWithQuote = async ({ claims, session }) => {
  seededSession = {
    ...session,
    nrlReference: fullQuote.reference,
    acceptLevy: 'yes'
  }
  const quoteCookie = await withCompleteQuoteSession(getServer())
  return signIn({ claims, cookie: quoteCookie })
}

describe('Check your answers page accessibility checks', () => {
  it.each([
    {
      scenario: 'for an agent',
      claims: agentClaims,
      session: reviewDetailsSessions.agent
    },
    {
      scenario: 'for an employee',
      claims: singleOrgEmployeeClaims,
      session: reviewDetailsSessions.employee
    }
  ])(
    'should have no HTML accessibility issues $scenario',
    async ({ claims, session }) => {
      const { cookie } = await signInWithQuote({ claims, session })
      const document = await loadPage({
        requestUrl: pagePath,
        server: getServer(),
        cookie
      })

      await runAxeChecks(document.documentElement)
    }
  )

  it('should have no HTML accessibility issues in the error state', async () => {
    const { cookie } = await signInWithQuote({
      claims: singleOrgEmployeeClaims,
      session: reviewDetailsSessions.employee
    })

    await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: {},
      cookie
    })
    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
