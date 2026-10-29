// @vitest-environment jsdom
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('You will need to create or join a Defra account for your business or organisation page accessibility checks', () => {
  const getServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: '/request-to-use/defra-account-organisation',
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })
    await runAxeChecks(document.documentElement)
  })
})
