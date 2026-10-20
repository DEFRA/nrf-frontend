// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withEmailAcceptedSession } from '../../../test-utils/with-email-accepted-session.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const mswServer = setupMswServer()

describe('We have sent you an email page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: await withEmailAcceptedSession(getServer(), mswServer)
    })

    await runAxeChecks(document.documentElement)
  })
})
