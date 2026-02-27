// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getValidationFlashFromCache } from '../session-cache.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

vi.mock('../session-cache.js')

describe('Email page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const errorMessage = 'Enter an email address'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#email',
            text: errorMessage,
            field: ['email']
          }
        ],
        messagesByFormField: {
          email: {
            href: '#email',
            text: errorMessage,
            field: ['email']
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
