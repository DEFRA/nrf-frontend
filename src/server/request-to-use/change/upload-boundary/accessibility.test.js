// @vitest-environment jsdom
import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { config } from '../../../../config/config.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../../test-utils/axe-helper.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { uploadId } from '../../../../test-utils/fixtures/upload-id.js'

const mswServer = setupMswServer()

describe('Change upload boundary page accessibility checks', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    const backendUrl = config.get('backend').apiUrl
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, () =>
        HttpResponse.json({
          uploadId,
          uploadUrl: `/upload-and-scan/${uploadId}`
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
