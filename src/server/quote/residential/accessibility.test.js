// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

describe('Residential units page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
