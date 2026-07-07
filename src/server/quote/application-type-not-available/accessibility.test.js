// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Application type not available page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const sessionCookie = await withValidQuoteSession(getServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    await runAxeChecks(document.documentElement)
  })
})
