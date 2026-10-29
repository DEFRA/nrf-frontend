// @vitest-environment jsdom
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('You will need to create or sign in to a Defra account as an individual page accessibility checks', () => {
  const getServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: '/request-to-use/defra-account-individual',
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })
    await runAxeChecks(document.documentElement)
  })
})
