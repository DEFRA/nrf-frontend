// @vitest-environment jsdom
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

describe('Check your answers page accessibility checks', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())
    const document = await loadPage({
      requestUrl: '/request-to-use/check-your-answers',
      server: getSeededServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
