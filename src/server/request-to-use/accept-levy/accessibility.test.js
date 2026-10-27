// @vitest-environment jsdom
import { routePath } from './routes.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockRecalculateLevy } from '../../../test-utils/mock-recalculate-levy.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const mswServer = setupMswServer()

describe('Do you accept this nature restoration levy amount page accessibility checks', () => {
  const getServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    mockRecalculateLevy(mswServer)
    const { cookie: levyCookie } = await submitForm({
      requestUrl: reviewQuoteDetailsPath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: levyCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
