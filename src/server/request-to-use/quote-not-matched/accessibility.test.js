// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withQuoteNotMatchedSession } from '../../../test-utils/with-quote-not-matched-session.js'

const mswServer = setupMswServer()

describe('These details do not match our records page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const cookie = await withQuoteNotMatchedSession(getServer(), mswServer)
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
