// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getValidationFlashFromCache } from '../session-cache.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

vi.mock('../session-cache.js')

describe('People count page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const errorMessage = 'Enter the maximum number of people to continue'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#peopleCount',
            text: errorMessage,
            field: ['peopleCount']
          }
        ],
        messagesByFormField: {
          peopleCount: {
            href: '#peopleCount',
            text: errorMessage,
            field: ['peopleCount']
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
