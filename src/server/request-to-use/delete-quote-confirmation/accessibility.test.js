// @vitest-environment jsdom
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const pagePath = '/request-to-use/delete-quote-confirmation'

describe('Your details have been deleted page (request to use) accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })
})
