// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

describe('Change not housing page accessibility checks', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
