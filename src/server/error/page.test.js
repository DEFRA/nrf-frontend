import { getByRole, queryByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { mockGetQuoteError } from '../../test-utils/mock-get-quote.js'
import { assertContactDetails } from '../../test-utils/assert-contact-details.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'
import { routePath as confirmationRoutePath } from '../quote/confirmation/routes.js'

const mswServer = setupMswServer()

describe('Error pages', () => {
  const getServer = setupTestServer()

  it('should render a page not found error for an unknown path', async () => {
    const document = await loadPage({
      requestUrl: '/non-existent-path',
      server: getServer()
    })

    expect(document.title).toBe(
      'Page not found - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Page not found'
    )
    expect(getByRole(document, 'main')).toHaveTextContent(
      'If the web address is correct or you selected a link or button, contact Natural England.'
    )
    expect(
      queryByRole(document, 'link', { name: 'contact Natural England' })
    ).toBeNull()
    assertContactDetails(document, { intro: false })
  })

  it('should render a bad request error when a form payload fails validation', async () => {
    const { result, statusCode } = await getServer().inject({
      method: 'POST',
      url: ANALYTICS_INTERNAL_ROUTE,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'analyticsEnabled=banana'
    })

    expect(statusCode).toBe(statusCodes.badRequest)

    const { window } = new JSDOM(result)
    expect(window.document.title).toBe(
      'Your details are incomplete - Nature restoration levy - GOV.UK'
    )
    expect(
      getByRole(window.document, 'heading', { level: 1 })
    ).toHaveTextContent('Your details are incomplete')
  })

  it.each([
    [
      'internal server error',
      statusCodes.internalServerError,
      'Sorry, there is a problem with the service'
    ],
    [
      'bad gateway',
      statusCodes.badGateway,
      'Sorry, there is a problem with the service'
    ],
    [
      'service unavailable',
      statusCodes.serviceUnavailable,
      'Service unavailable'
    ]
  ])(
    'should show Natural England contact details on the %s page',
    async (_label, backendStatus, expectedHeading) => {
      const reference = 'NRL-123456'
      mockGetQuoteError(mswServer, reference, backendStatus)

      const response = await getServer().inject({
        method: 'GET',
        url: `${confirmationRoutePath}?reference=${reference}`
      })

      expect(response.statusCode).toBe(backendStatus)

      const { window } = new JSDOM(response.result)
      expect(
        getByRole(window.document, 'heading', { level: 1 })
      ).toHaveTextContent(expectedHeading)
      assertContactDetails(window.document)
    }
  )
})
