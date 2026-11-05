import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import {
  fullQuote,
  originalNrlReference
} from '../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/original-boundary-not-matched'
const originalReferenceNotMatchedPath =
  '/request-to-use/original-reference-not-matched'
const startPagePath = '/manage/start-page'
const enterOriginalReferencePath = '/request-to-use/original-reference'

const expectedHeading = 'Details do not match'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

setupMswServer()

describe('Details do not match page', () => {
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

  const load = async () =>
    loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })

  it('should render the heading and title', async () => {
    const document = await load()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      expectedHeading
    )
    expect(document.title).toMatch(new RegExp(`^${expectedHeading}`))
  })

  it('should render the saved reference in the body', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        `This amendment to a development is using a different red line boundary to ${originalNrlReference}.`
      )
    ).toBeInTheDocument()
  })

  it.each([
    { scenario: 'is missing', session: { nrlReference: fullQuote.reference } },
    {
      scenario: 'is empty',
      session: { nrlReference: fullQuote.reference, originalNrlReference: '' }
    }
  ])(
    'should redirect to the original reference not found page when the original reference $scenario',
    async ({ session }) => {
      sessionToSeed = session

      const response = await getResponse({
        server: getServer(),
        requestUrl: pagePath,
        cookie: await withCompleteQuoteSession(getServer())
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(originalReferenceNotMatchedPath)
    }
  )

  it.each([
    { linkName: 'Back', href: enterOriginalReferencePath },
    { linkName: 'Check the NRL reference', href: enterOriginalReferencePath },
    { linkName: 'amend your red line boundary', href: reviewQuoteDetailsPath }
  ])('should send the $linkName link to $href', async ({ linkName, href }) => {
    const document = await load()

    expect(getByRole(document, 'link', { name: linkName })).toHaveAttribute(
      'href',
      href
    )
  })

  it('should have no form or Continue button', async () => {
    const document = await load()

    expect(document.querySelector('main form')).toBeNull()
    expect(queryByRole(document, 'button', { name: 'Continue' })).toBeNull()
  })

  it('should redirect to the start page without a valid session', async () => {
    sessionToSeed = null

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPagePath)
  })

  it('should redirect to the start page when the saved quote is incomplete', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie: await withValidQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPagePath)
  })
})
