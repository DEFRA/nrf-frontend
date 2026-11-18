import { getByRole } from '@testing-library/dom'
import { setupSignedInTestServer } from '../../../../test-utils/setup-signed-in-test-server.js'
import { seedRequestToUseSessionWith } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { singleOrgEmployeeClaims } from '../../../../test-utils/fixtures/defra-id-org-claims.js'
import { reviewDetailsSessions } from '../../../../test-utils/fixtures/review-details-personas.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const ROUTE_PATH = '/request-to-use/change/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

// The page's guard needs the completed quote, and the form needs the persona
// snapshot, over one signed-in session.
const signedInCookie = async () => {
  seededSession = {
    ...reviewDetailsSessions.employee,
    nrlReference: fullQuote.reference
  }
  const quoteCookie = await withCompleteQuoteSession(getServer())
  const { cookie } = await signIn({
    claims: singleOrgEmployeeClaims,
    cookie: quoteCookie
  })
  return cookie
}

describe('Change the address or full name page', () => {
  it('links back to the check your answers page', async () => {
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie: await signedInCookie()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/check-your-answers'
    )
  })

  it('redirects a changed address to the check your answers page', async () => {
    const { response } = await submitForm({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      formData: {
        formVariant: 'employee',
        addressLine1: '1 Development Road',
        townOrCity: 'Development',
        postcode: 'DV1 6RP'
      },
      cookie: await signedInCookie()
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/check-your-answers')
  })
})
