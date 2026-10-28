// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('Who are you requesting to use the nature restoration levy for page accessibility checks', () => {
  const getServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
