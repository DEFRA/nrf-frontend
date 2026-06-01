// @vitest-environment jsdom
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { mockGetQuote } from '../../../test-utils/mock-get-quote.js'

const mswServer = setupMswServer()

describe('Quote details page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })
})
