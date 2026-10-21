// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('You need a quote before you can request to use the nature restoration levy page accessibility checks', () => {
  const getServer = setupTestServer()
  let cookie

  beforeEach(async () => {
    cookie = await withValidRetrieveQuoteSession(getServer())
  })

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
