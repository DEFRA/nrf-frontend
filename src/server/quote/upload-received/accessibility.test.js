// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { getUploadStatus } from '../../common/services/cdp-uploader.js'

vi.mock('../session-cache.js')
vi.mock('../../common/services/cdp-uploader.js')

describe('Upload received page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues when processing', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'pending'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues when ready', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'ready'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })
})
