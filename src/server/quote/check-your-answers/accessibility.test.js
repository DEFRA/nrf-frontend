// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

describe('Check your answers page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const cookie = await withCompleteQuoteSession(getServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
