// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { getUploadStatus } from '../../common/services/uploader.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

vi.mock('../helpers/form-validation-session/index.js')
vi.mock('../../common/services/uploader.js')

describe('Upload received page accessibility checks', () => {
  const getServer = setupTestServer()
  let cookie

  beforeEach(async () => (cookie = await withValidQuoteSession(getServer())))

  it('should have no HTML accessibility issues when processing', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'pending'
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
