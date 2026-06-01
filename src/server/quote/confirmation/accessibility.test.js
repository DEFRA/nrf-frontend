// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { mockGetQuote } from '../../../test-utils/mock-get-quote.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const mswServer = setupMswServer()

describe('Confirmation page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl: `${routePath}?reference=${fullQuote.reference}`,
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })
})
