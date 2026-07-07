// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('Planning type page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const sessionCookie = await withValidQuoteSession(getServer())
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
