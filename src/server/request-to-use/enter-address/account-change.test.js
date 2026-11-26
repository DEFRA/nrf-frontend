import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { observeRequestToUseSession } from '../../../test-utils/observe-request-to-use-session.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { findSummaryListRowElement } from '../../../test-utils/find-summary-list-row.js'
import {
  otherOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { acceptedRequest } from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { reviewDetailsAddress } from '../../../test-utils/fixtures/review-details-personas.js'

const ENTER_ADDRESS_PATH = '/request-to-use/enter-address'
const REVIEW_DETAILS_PATH = '/request-to-use/review-details'
const SIGN_IN_PATH = '/auth/sign-in'
const MINUTE_MS = 60 * 1000
// Past the Defra ID session (1 hour) but inside the service session (2 hours)
const DEFRA_ID_SESSION_EXPIRED_MS = 61 * MINUTE_MS

const { getServer, signIn } = setupSignedInTestServer()

let seededSession = null
let readSession

beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
  readSession = observeRequestToUseSession(getServer())
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  seededSession = null
  vi.useRealTimers()
})

// Signs in and confirms an address, seeded with the answers the page needs
const confirmAddress = async () => {
  seededSession = acceptedRequest
  const { cookie } = await signIn({ claims: singleOrgEmployeeClaims })
  const confirmed = await submitForm({
    requestUrl: ENTER_ADDRESS_PATH,
    server: getServer(),
    formData: { formVariant: 'employee', ...reviewDetailsAddress },
    cookie
  })
  expect(confirmed.response.headers.location).toBe(REVIEW_DETAILS_PATH)
  seededSession = null
  return confirmed.cookie
}

// Lets the Defra ID session expire on a real request, which drops the cached
// sign-in session but keeps the journey answers
const expireSession = async (cookie) => {
  vi.setSystemTime(Date.now() + DEFRA_ID_SESSION_EXPIRED_MS)
  const response = await getServer().inject({
    method: 'GET',
    url: REVIEW_DETAILS_PATH,
    headers: { cookie }
  })
  expect(response.statusCode).toBe(302)
  expect(response.headers.location).toBe(SIGN_IN_PATH)
  return getYarCookie(response)
}

describe('Enter address page when the signed-in account changes', () => {
  it('keeps the address when the same account signs in again after the Defra ID session has expired', async () => {
    const { cookie } = await signIn({
      claims: singleOrgEmployeeClaims,
      cookie: await expireSession(await confirmAddress())
    })
    const document = await loadPage({
      requestUrl: REVIEW_DETAILS_PATH,
      server: getServer(),
      cookie
    })

    expect(findSummaryListRowElement(document, 'Address')).toHaveTextContent(
      reviewDetailsAddress.addressLine1
    )
  })

  it('clears the address when another account signs in after the Defra ID session has expired', async () => {
    await signIn({
      claims: otherOrgEmployeeClaims,
      cookie: await expireSession(await confirmAddress())
    })

    expect(readSession()).toMatchObject({
      nrlReference: 'NRL-123456',
      acceptLevy: 'yes',
      variation: 'no'
    })
    expect(readSession().address).toBeUndefined()
    expect(readSession().signin).toBeUndefined()
  })

  it('clears the address when another account signs in while the previous session is still cached', async () => {
    await signIn({
      claims: otherOrgEmployeeClaims,
      cookie: await confirmAddress()
    })

    expect(readSession().address).toBeUndefined()
    expect(readSession().signin).toBeUndefined()
  })
})
