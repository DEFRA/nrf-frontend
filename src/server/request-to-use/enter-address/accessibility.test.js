// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const ROUTE_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

describe('Enter address page accessibility checks', () => {
  it('should have no HTML accessibility issues', async () => {
    const { cookie } = await signIn()
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
