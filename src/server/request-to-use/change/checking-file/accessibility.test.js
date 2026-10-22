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

describe('Change checking file page accessibility checks', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  it('should have no HTML accessibility issues', async () => {
    // A pending upload still being processed renders the polling page.
    const backendUrl = config.get('backend').apiUrl
    const uploadId = '22222222-2222-2222-2222-222222222222'
    mswServer.use(
      http.post(`${backendUrl}/upload/initiate`, () =>
        HttpResponse.json({
          uploadId,
          uploadUrl: `/upload-and-scan/${uploadId}`
        })
      ),
      http.get(`${backendUrl}/upload/${uploadId}/status`, () =>
        HttpResponse.json({ uploadStatus: 'pending' })
      )
    )

    const cookie = await withCompleteQuoteSession(getSeededServer())
    await getSeededServer().inject({
      method: 'GET',
      url: '/request-to-use/change/upload-boundary',
      headers: { cookie }
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    // Scope to the page content: the polling page's deliberate <meta refresh>
    // head tag trips axe's meta-refresh rule but is the intended mechanism.
    await runAxeChecks(document.querySelector('main'))
  })
})
