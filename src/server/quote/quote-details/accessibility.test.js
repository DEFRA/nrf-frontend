// @vitest-environment jsdom
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import {
  mockGetQuote,
  mockGetQuoteStatus
} from '../../../test-utils/mock-get-quote.js'
import { resetQuoteAccessRateLimiter } from './rate-limiter.js'

const mswServer = setupMswServer()
const humanClick = { 'sec-fetch-user': '?1' }

describe('Quote details page accessibility checks', () => {
  const getServer = setupTestServer()

  beforeEach(() => resetQuoteAccessRateLimiter())

  it('should have no HTML accessibility issues', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer(),
      headers: humanClick
    })
    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the error page', async () => {
    mockGetQuoteStatus(mswServer, 'NRF-123456', 'invalid')
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer(),
      headers: humanClick
    })
    await runAxeChecks(document.documentElement)
  })
})
