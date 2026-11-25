import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { mockCompareBoundaries } from '../../../../test-utils/mock-get-quote.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

// Declared as literals rather than imports: a wrong change to a route must
// fail these tests (tests.md, constants vs literals).
const ROUTE_PATH = '/request-to-use/change/original-reference'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const notMatchedPath = '/request-to-use/original-reference-not-matched'
const boundaryNotMatchedPath = '/request-to-use/original-boundary-not-matched'

describe('Change the NRL reference for the original planning permission page', () => {
  const getServer = setupSeededRequestToUseServer()
  const mswServer = setupMswServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  const submit = () =>
    submitForm({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      formData: { originalReference: 'NRL-123456' },
      cookie: sessionCookie
    })

  it('links back to the check your answers page', async () => {
    mockCompareBoundaries(mswServer)
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it('redirects to the check your answers page when the reference and boundary match', async () => {
    mockCompareBoundaries(mswServer)
    const { response } = await submit()

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('redirects to the not matched page when the original quote is not found', async () => {
    mockCompareBoundaries(mswServer, { status: 404 })
    const { response } = await submit()

    expect(response.headers.location).toBe(notMatchedPath)
  })

  it('redirects to the boundary not matched page when the boundaries differ', async () => {
    mockCompareBoundaries(mswServer, { boundariesMatch: false })
    const { response } = await submit()

    expect(response.headers.location).toBe(boundaryNotMatchedPath)
  })
})
