import { getByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { mockGetQuote } from '../../../test-utils/mock-get-quote.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'
import { failIfBackendCalled } from '../../../test-utils/fail-if-backend-called.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const mswServer = setupMswServer()

const reference = 'NRL-123456'
const requestUrl = `${routePath}?reference=${reference}`

describe('Confirmation page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title', async () => {
    mockGetQuote(mswServer, { reference })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(document.title).toBe(
      'Confirmation - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details have been submitted'
    )
  })

  it('should show the reference number', async () => {
    mockGetQuote(mswServer, { reference })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(getByRole(document, 'main')).toHaveTextContent(
      'NRL reference: NRL-123456'
    )
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    mockGetQuote(mswServer, { reference })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    assertContactDetails(document)
  })

  describe('invalid reference', () => {
    // The page must reject the reference before calling the backend (NRF2-1066)
    // — an empty reference would otherwise request /quotes/, the
    // list-all-quotes endpoint.
    it.each([
      ['empty', `${routePath}?reference=`],
      ['malformed', `${routePath}?reference=not-a-reference`],
      ['missing', routePath]
    ])(
      'should return the 404 page and not call the backend for a %s reference',
      async (_label, url) => {
        failIfBackendCalled(mswServer, ['/quotes', '/quotes/'])

        const response = await getServer().inject({ method: 'GET', url })

        expect(response.statusCode).toBe(statusCodes.notFound)

        const { window } = new JSDOM(response.result)
        expect(
          getByRole(window.document, 'heading', { level: 1 })
        ).toHaveTextContent('Page not found')
      }
    )
  })
})
