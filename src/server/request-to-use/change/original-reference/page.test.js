import { getByRole } from '@testing-library/dom'
import { loadPage } from '../../../../test-utils/load-page.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { mockCompareBoundaries } from '../../../../test-utils/mock-get-quote.js'
import { originalNrlReference } from '../../../../test-utils/fixtures/quote.js'
import { setupChangePlanningPageTest } from '../../../../test-utils/setup-change-planning-page-test.js'

const pagePath = '/request-to-use/change/original-reference'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const notMatchedPath = '/request-to-use/change/original-reference-not-matched'
const boundaryNotMatchedPath =
  '/request-to-use/change/original-boundary-not-matched'
const startPath = '/manage/start-page'
const originalReferenceKey = 'Original NRL reference'

describe('Change the NRL reference for the original planning permission page', () => {
  const { getServer, mswServer, signedInCookie, seedSession, rowText } =
    setupChangePlanningPageTest()
  let sessionCookie

  beforeEach(async () => {
    seedSession({ variation: 'yes', originalCommitted: 'yes' })
    sessionCookie = await signedInCookie()
  })

  const submit = (originalReference = originalNrlReference) =>
    submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { originalReference },
      cookie: sessionCookie
    })

  it('redirects to the start page when there is no request to use session', async () => {
    seedSession(null)

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it('links back to the check your answers page', async () => {
    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it.each([
    { from: 'reference-not-matched', backPath: notMatchedPath },
    { from: 'boundary-not-matched', backPath: boundaryNotMatchedPath }
  ])(
    'links back to the $from page when reached from it',
    async ({ from, backPath }) => {
      mockCompareBoundaries(mswServer)
      const document = await loadPage({
        requestUrl: `${pagePath}?from=${from}`,
        server: getServer(),
        cookie: sessionCookie
      })

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        backPath
      )
    }
  )

  it('links back to the check your answers page for an unknown source', async () => {
    mockCompareBoundaries(mswServer)
    const document = await loadPage({
      requestUrl: `${pagePath}?from=https://example.com`,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it.each([
    ['the reference and boundary match', {}, checkYourAnswersPath],
    ['the original quote is not found', { status: 404 }, notMatchedPath],
    [
      'the boundaries differ',
      { boundariesMatch: false },
      boundaryNotMatchedPath
    ]
  ])(
    'redirects with a 303 when %s',
    async (_scenario, mockOptions, expectedPath) => {
      mockCompareBoundaries(mswServer, mockOptions)

      const { response } = await submit()

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(expectedPath)
    }
  )

  it('sends the entered reference to the backend and shows it on the check your answers page', async () => {
    const requests = mockCompareBoundaries(mswServer)

    const { cookie } = await submit()

    expect(requests[0].originalReference).toBe(originalNrlReference)
    expect(await rowText({ cookie, key: originalReferenceKey })).toBe(
      originalNrlReference
    )
  })

  it('redirects back to the form when the reference is blank', async () => {
    const { response } = await submit('')

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(pagePath)
  })
})
