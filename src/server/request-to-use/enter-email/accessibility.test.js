// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('Enter your email address page accessibility checks', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withValidRetrieveQuoteSession(getServer())
  })

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: '' },
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
