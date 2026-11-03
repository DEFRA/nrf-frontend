import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/original-reference-not-matched'
const startPagePath = '/manage/start-page'
const enterOriginalReferencePath = '/request-to-use/original-reference'
const originalReference = 'NRL-654321'
const expectedHeading = `${originalReference} does not match our records`

setupMswServer()

describe('NRL reference does not match our records page', () => {
  const getServer = setupTestServer()
  let sessionToSeed = null

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => sessionToSeed)
  })

  beforeEach(() => {
    sessionToSeed = {
      nrlReference: fullQuote.reference,
      originalNrlReference: originalReference
    }
  })

  const load = async () =>
    loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })

  it('should render the saved reference in the heading and title', async () => {
    const document = await load()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      expectedHeading
    )
    expect(document.title).toMatch(new RegExp(`^${expectedHeading}`))
  })

  it('should render the fallback heading when no original reference is saved', async () => {
    sessionToSeed = { nrlReference: fullQuote.reference }

    const document = await load()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'This NRL reference does not match our records'
    )
  })

  it('should explain where to find the NRL reference', async () => {
    const document = await load()

    expect(
      getByText(
        document,
        'You can find the NRL reference on the commitment certificate for the original planning permission.'
      )
    ).toBeInTheDocument()
  })

  it.each([
    { linkName: 'Back' },
    { linkName: 'Enter the NRL reference again' }
  ])(
    'should send the $linkName link to the enter the original reference page',
    async ({ linkName }) => {
      const document = await load()

      expect(getByRole(document, 'link', { name: linkName })).toHaveAttribute(
        'href',
        enterOriginalReferencePath
      )
    }
  )

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
