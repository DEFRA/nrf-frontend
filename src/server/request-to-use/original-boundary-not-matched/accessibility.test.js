// @vitest-environment jsdom
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import {
  fullQuote,
  originalNrlReference
} from '../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/original-boundary-not-matched'

setupMswServer()

describe('Details do not match page accessibility checks', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => ({
      nrlReference: fullQuote.reference,
      originalNrlReference
    }))
  })

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: await withCompleteQuoteSession(getServer())
    })

    await runAxeChecks(document.documentElement)
  })
})
