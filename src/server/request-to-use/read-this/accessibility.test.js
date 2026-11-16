// @vitest-environment jsdom
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

const mswServer = setupMswServer()

describe('Details to read before you request to use the nature restoration levy page accessibility checks', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    mockRecalculateLevy(mswServer)
    const { cookie } = await submitForm({
      requestUrl: reviewQuoteDetailsPath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    sessionCookie = cookie
  })

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: '/request-to-use/read-this',
      server: getServer(),
      cookie: sessionCookie
    })
    await runAxeChecks(document.documentElement)
  })
})
