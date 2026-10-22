// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { config } from '../../../../config/config.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const mswServer = setupMswServer()

describe('Change upload boundary page accessibility checks', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const backendUrl = config.get('backend').apiUrl
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, () =>
        HttpResponse.json({
          uploadId: '22222222-2222-2222-2222-222222222222',
          uploadUrl: '/upload-and-scan/22222222-2222-2222-2222-222222222222'
        })
      )
    )

    const cookie = await withCompleteQuoteSession(getSeededServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    await runAxeChecks(document.documentElement)
  })
})
