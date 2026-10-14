// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { loadPage } from '../../test-utils/load-page.js'
import { runAxeChecks } from '../../test-utils/axe-helper.js'
import { mockGetQuoteError } from '../../test-utils/mock-get-quote.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { routePath as confirmationRoutePath } from '../quote/confirmation/routes.js'

const mswServer = setupMswServer()

describe('Error page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues on the page not found error', async () => {
    const document = await loadPage({
      requestUrl: '/non-existent-path',
      server: getServer()
    })

    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the bad request error', async () => {
    const { result } = await getServer().inject({
      method: 'POST',
      url: ANALYTICS_INTERNAL_ROUTE,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'analyticsEnabled=banana'
    })

    const { window } = new JSDOM(result)
    await runAxeChecks(window.document.documentElement)
  })

  it.each([
    ['internal server error', statusCodes.internalServerError],
    ['bad gateway', statusCodes.badGateway],
    ['service unavailable', statusCodes.serviceUnavailable]
  ])(
    'should have no HTML accessibility issues on the %s error page',
    async (_label, backendStatus) => {
      const reference = 'NRL-123456'
      mockGetQuoteError(mswServer, reference, backendStatus)

      const { result } = await getServer().inject({
        method: 'GET',
        url: `${confirmationRoutePath}?reference=${reference}`
      })

      const { window } = new JSDOM(result)
      await runAxeChecks(window.document.documentElement)
    }
  )
})
