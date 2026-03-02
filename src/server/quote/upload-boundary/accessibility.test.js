// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getValidationFlashFromCache } from '../session-cache.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

vi.mock('../session-cache.js')

describe('Upload boundary page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const errorMessage = 'Select a file'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#redlineFile',
            text: errorMessage,
            field: ['redlineFile']
          }
        ],
        messagesByFormField: {
          redlineFile: {
            href: '#redlineFile',
            text: errorMessage,
            field: ['redlineFile']
          }
        }
      },
      formSubmitData: {}
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    await runAxeChecks(document.documentElement)
  })
})
